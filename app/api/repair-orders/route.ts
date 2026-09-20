import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { PermissionName } from '@/lib/permissions';

const ALLOWED_STATUSES = ['待確認', '處理中', '已完成', '已取消'] as const;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function newOrderNumber() {
  return `R-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;
}

function isAllowedStatus(status: string) {
  return ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number]);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = text(url.searchParams.get('orderNumber'));
  const staffView = url.searchParams.get('staff') === 'true' || url.searchParams.get('staff') === '1';

  if (staffView) {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
    if (!(await hasPermission(user, PermissionName.queryOrders))) {
      return NextResponse.json({ message: '沒有查詢案件權限' }, { status: 403 });
    }

    const status = text(url.searchParams.get('status'));
    if (status && !isAllowedStatus(status)) {
      return NextResponse.json({ message: '狀態值不正確' }, { status: 400 });
    }
    const orders = await prisma.repairOrder.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' }
    });

    const [updateStatus, managePermissions] = await Promise.all([
      hasPermission(user, PermissionName.updateStatus),
      hasPermission(user, PermissionName.managePermissions)
    ]);

    return NextResponse.json({ orders, permissions: { updateStatus, managePermissions } });
  }

  if (!orderNumber) {
    return NextResponse.json({ message: '請提供案件編號' }, { status: 400 });
  }

  try {
    const order = await prisma.repairOrder.findUnique({
      where: { orderNumber },
      select: { orderNumber: true, status: true, customerName: true, department: true, description: true, deviceType: true, issueType: true, phone: true, email: true }
    });
    if (!order) return NextResponse.json({ message: '查無此案件' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ message: '資料庫尚未初始化，請先完成 Prisma 初始化。' }, { status: 503 });
    }
    return NextResponse.json({ message: '查詢失敗，請稍後再試。' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const customerName = text(body.customerName);
  const phone = text(body.phone);
  const email = text(body.email);
  const department = text(body.department);
  const deviceType = text(body.deviceType);
  const issueType = text(body.issueType);
  const description = text(body.description);

  if (!customerName || !phone || !department || !deviceType || !issueType || !description) {
    return NextResponse.json({ message: '請完整填寫必填欄位' }, { status: 400 });
  }

  try {
    const created = await prisma.repairOrder.create({
      data: {
        orderNumber: newOrderNumber(),
        customerName,
        phone,
        email,
        department,
        deviceType,
        issueType,
        description
      }
    });
    return NextResponse.json({ orderNumber: created.orderNumber }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ message: '資料庫尚未初始化，請先完成 Prisma 初始化。' }, { status: 503 });
    }
    return NextResponse.json({ message: '報修送出失敗，請稍後再試。' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (!(await hasPermission(user, PermissionName.updateStatus))) {
    return NextResponse.json({ message: '沒有更新案件狀態權限' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const orderNumber = text(body.orderNumber);
  const status = text(body.status);

  if (!orderNumber || !status) {
    return NextResponse.json({ message: '案件編號與狀態為必填' }, { status: 400 });
  }
  if (!isAllowedStatus(status)) {
    return NextResponse.json({ message: '狀態值不正確' }, { status: 400 });
  }

  try {
    const updated = await prisma.repairOrder.update({
      where: { orderNumber },
      data: { status }
    });
    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: '查無此案件' }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ message: '資料庫尚未初始化，請先完成 Prisma 初始化。' }, { status: 503 });
    }
    return NextResponse.json({ message: '更新案件狀態失敗' }, { status: 500 });
  }
}
