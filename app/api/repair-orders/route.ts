import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { PermissionName } from '@/lib/permissions';

const ALLOWED_STATUSES = ['待確認', '處理中', '已完成', '已取消'] as const;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

const DEVICE_TYPES = ['桌上型電腦', '筆記型電腦', '螢幕', '印表機', '其他'];
const ISSUE_TYPES = ['無法開機', '網路問題', '軟體問題', '硬體問題', '其他'];
const LIMITS = { customerName: 50, phone: 30, email: 120, department: 80, description: 2000 };
const PHONE_PATTERN = /^[0-9+\-()#\s]{6,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ORDER_NUMBER_ATTEMPTS = 5;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const submissions = new Map<string, number[]>();

function isRateLimited(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const recent = (submissions.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    submissions.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissions.set(ip, recent);
  if (submissions.size > 1000) {
    submissions.forEach((times, key) => {
      if (times.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) submissions.delete(key);
    });
  }
  return false;
}

function newOrderNumber() {
  return `R-${Date.now().toString().slice(-8)}${crypto.randomInt(100, 1000)}`;
}

function validateNewOrder(fields: Record<'customerName' | 'phone' | 'email' | 'department' | 'deviceType' | 'issueType' | 'description', string>) {
  if (!fields.customerName || !fields.phone || !fields.department || !fields.deviceType || !fields.issueType || !fields.description) {
    return '請完整填寫必填欄位';
  }
  if (fields.customerName.length > LIMITS.customerName) return `姓名不可超過 ${LIMITS.customerName} 字`;
  if (fields.department.length > LIMITS.department) return `部門不可超過 ${LIMITS.department} 字`;
  if (fields.description.length > LIMITS.description) return `問題描述不可超過 ${LIMITS.description} 字`;
  if (!PHONE_PATTERN.test(fields.phone)) return '聯絡電話格式不正確';
  if (fields.email && (fields.email.length > LIMITS.email || !EMAIL_PATTERN.test(fields.email))) return '電子信箱格式不正確';
  if (!DEVICE_TYPES.includes(fields.deviceType)) return '設備類型不正確';
  if (!ISSUE_TYPES.includes(fields.issueType)) return '問題類型不正確';
  return null;
}

function maskName(name: string) {
  const chars = Array.from(name);
  if (chars.length <= 1) return name;
  return chars[0] + '*'.repeat(chars.length - 1);
}

function isAllowedStatus(status: string) {
  return ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number]);
}

function parseAssignedTechnicianId(value: unknown): { ok: true; value: number | null } | { ok: false } {
  if (value === null || value === '') return { ok: true, value: null };
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return { ok: true, value };
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (Number.isInteger(parsed) && parsed > 0) {
      return { ok: true, value: parsed };
    }
  }
  return { ok: false };
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
    const [orders, updateStatus, managePermissions, technicians] = await Promise.all([
      prisma.repairOrder.findMany({
        where: status ? { status } : {},
        include: { assignedTechnician: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      hasPermission(user, PermissionName.updateStatus),
      hasPermission(user, PermissionName.managePermissions),
      prisma.user.findMany({
        where: { role: 'technician' },
        select: { id: true, username: true },
        orderBy: { username: 'asc' }
      })
    ]);

    return NextResponse.json({
      orders,
      permissions: { updateStatus, managePermissions },
      technicians,
      currentUser: { id: user.id, username: user.username, role: user.role }
    });
  }

  if (!orderNumber) {
    return NextResponse.json({ message: '請提供案件編號' }, { status: 400 });
  }

  try {
    const order = await prisma.repairOrder.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        customerName: true,
        department: true,
        description: true,
        deviceType: true,
        issueType: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!order) return NextResponse.json({ message: '查無此案件' }, { status: 404 });
    return NextResponse.json({ order: { ...order, customerName: maskName(order.customerName) } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ message: '資料庫尚未初始化，請先完成 Prisma 初始化。' }, { status: 503 });
    }
    return NextResponse.json({ message: '查詢失敗，請稍後再試。' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return NextResponse.json({ message: '送出次數過多，請稍後再試。' }, { status: 429 });
  }
  const bodyRaw = await request.json().catch(() => ({}));
  const body = typeof bodyRaw === 'object' && bodyRaw ? bodyRaw : {};
  const customerName = text(body.customerName);
  const phone = text(body.phone);
  const email = text(body.email);
  const department = text(body.department);
  const deviceType = text(body.deviceType);
  const issueType = text(body.issueType);
  const description = text(body.description);

  const validationError = validateNewOrder({ customerName, phone, email, department, deviceType, issueType, description });
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  try {
    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
      try {
        const created = await prisma.repairOrder.create({
          data: { orderNumber: newOrderNumber(), customerName, phone, email, department, deviceType, issueType, description }
        });
        return NextResponse.json({ orderNumber: created.orderNumber }, { status: 201 });
      } catch (createError) {
        const isDuplicate = createError instanceof Prisma.PrismaClientKnownRequestError && createError.code === 'P2002';
        if (!isDuplicate || attempt === MAX_ORDER_NUMBER_ATTEMPTS - 1) throw createError;
      }
    }
    return NextResponse.json({ message: '報修送出失敗，請稍後再試。' }, { status: 500 });
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

  const bodyRaw = await request.json().catch(() => ({}));
  const body = typeof bodyRaw === 'object' && bodyRaw ? bodyRaw : {};
  const orderNumber = text(body.orderNumber);
  const hasRawStatusInput = Object.prototype.hasOwnProperty.call(body, 'status');
  const status = text(body.status);
  const hasStatusInput = typeof body.status === 'string' && status.length > 0;
  const hasAssignedTechnicianInput = Object.prototype.hasOwnProperty.call(body, 'assignedTechnicianId');

  if (!orderNumber) {
    return NextResponse.json({ message: '案件編號為必填' }, { status: 400 });
  }
  if (!hasStatusInput && !hasAssignedTechnicianInput) {
    return NextResponse.json({ message: '請提供至少一項更新欄位' }, { status: 400 });
  }
  if (hasRawStatusInput && typeof body.status !== 'string') {
    return NextResponse.json({ message: '狀態值不正確' }, { status: 400 });
  }
  if (hasStatusInput && !isAllowedStatus(status)) {
    return NextResponse.json({ message: '狀態值不正確' }, { status: 400 });
  }

  let assignedTechnicianId: number | null | undefined;
  let assignmentChanged = false;
  if (hasAssignedTechnicianInput) {
    const parsedAssigned = parseAssignedTechnicianId(body.assignedTechnicianId);
    if (!parsedAssigned.ok) {
      return NextResponse.json({ message: '接單維修人員格式不正確' }, { status: 400 });
    }
    assignedTechnicianId = parsedAssigned.value;

    const [currentOrder, technician] = await Promise.all([
      prisma.repairOrder.findUnique({
        where: { orderNumber },
        select: { assignedTechnicianId: true }
      }),
      assignedTechnicianId === null
        ? Promise.resolve(null)
        : prisma.user.findUnique({
            where: { id: assignedTechnicianId },
            select: { id: true, role: true }
          })
    ]);

    if (!currentOrder) {
      return NextResponse.json({ message: '查無此案件' }, { status: 404 });
    }
    assignmentChanged = currentOrder.assignedTechnicianId !== assignedTechnicianId;

    if (assignedTechnicianId !== null) {
      if (!technician) {
        return NextResponse.json({ message: '查無指定維修人員' }, { status: 404 });
      }
      if (technician.role !== 'technician') {
        return NextResponse.json({ message: '只能指派 technician 角色使用者' }, { status: 400 });
      }
    }
  }

  const data: Prisma.RepairOrderUpdateInput = {};
  if (hasStatusInput) data.status = status;
  if (hasAssignedTechnicianInput && assignmentChanged) {
    if (assignedTechnicianId === null) {
      data.assignedTechnician = { disconnect: true };
      data.assignedAt = null;
    } else if (assignedTechnicianId !== undefined) {
      data.assignedTechnician = { connect: { id: assignedTechnicianId } };
      data.assignedAt = new Date();
    }
  }

  try {
    const updated = await prisma.repairOrder.update({
      where: { orderNumber },
      data,
      include: { assignedTechnician: { select: { id: true, username: true } } }
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
