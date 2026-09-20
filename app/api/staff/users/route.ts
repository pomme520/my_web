import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDefaultPermissionsForRole, PermissionName, Role, roles } from '@/lib/permissions';

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}

function parseUserId(value: string | null) {
  const idRaw = text(value);
  if (!/^\d+$/.test(idRaw)) return null;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

async function getUserManageAccess(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return { user: null, canManageUsers: false };
  const canManageUsers = user.role === Role.admin || (await hasPermission(user, PermissionName.managePermissions));
  return { user, canManageUsers };
}

export async function GET(request: Request) {
  const { user, canManageUsers } = await getUserManageAccess(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (!canManageUsers) {
    return NextResponse.json({ message: '只有管理員可檢視使用者' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ message: '資料庫尚未初始化，請先完成 Prisma 初始化。' }, { status: 503 });
    }
    return NextResponse.json({ message: '讀取使用者失敗，請稍後再試' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user, canManageUsers } = await getUserManageAccess(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (!canManageUsers) {
    return NextResponse.json({ message: '只有管理員可新增使用者' }, { status: 403 });
  }

  const bodyRaw = await request.json().catch(() => ({}));
  const body = typeof bodyRaw === 'object' && bodyRaw ? bodyRaw : {};
  const username = text(body.username);
  const password = String(body.password ?? '');
  const role = text(body.role);

  if (!username || !password || !role) {
    return NextResponse.json({ message: '請完整填寫帳號、密碼與角色' }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ message: '角色設定不正確' }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const createdUser = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.create({
        data: {
          username,
          passwordHash,
          role
        }
      });

      for (const permission of getDefaultPermissionsForRole(role)) {
        await tx.permission.upsert({
          where: { role_name: { role: permission.role, name: permission.name } },
          update: { enabled: permission.enabled },
          create: permission
        });
      }

      return nextUser;
    });

    return NextResponse.json(
      { user: { id: createdUser.id, username: createdUser.username, role: createdUser.role } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: '帳號已存在，請使用其他帳號名稱' }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ message: '資料庫尚未初始化，請先完成 Prisma 初始化。' }, { status: 503 });
    }
    return NextResponse.json({ message: '新增使用者失敗，請稍後再試' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, canManageUsers } = await getUserManageAccess(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (!canManageUsers) {
    return NextResponse.json({ message: '只有管理員可刪除使用者' }, { status: 403 });
  }

  const userId = parseUserId(new URL(request.url).searchParams.get('id'));
  if (!userId) {
    return NextResponse.json({ message: '使用者 id 格式錯誤' }, { status: 400 });
  }
  if (userId === user.id) {
    return NextResponse.json({ message: '不可刪除目前登入中的自己帳號' }, { status: 400 });
  }

  try {
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
      select: { id: true, username: true, role: true }
    });
    return NextResponse.json({ user: deletedUser });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: '查無此使用者' }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ message: '資料庫尚未初始化，請先完成 Prisma 初始化。' }, { status: 503 });
    }
    return NextResponse.json({ message: '刪除使用者失敗，請稍後再試' }, { status: 500 });
  }
}
