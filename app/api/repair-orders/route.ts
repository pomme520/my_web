import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { hasPermission, getUserFromRequest } from '@/lib/auth';
import { PermissionName } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function newOrderNumber() {
  return `R-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = text(url.searchParams.get('orderNumber'));
  if (!orderNumber) return NextResponse.json({ message: '請提供案件編號' }, { status: 400 });

  try {
    const user = await getUserFromRequest(request);
    if (await hasPermission(user, PermissionName.queryOrders)) {
      const order = await prisma.repairOrder.findUnique({
        where: { orderNumber },
        select: { orderNumber: true, status: true, customerName: true, department: true, description: true }
      });
      if (!order) return NextResponse.json({ message: '查無此案件' }, { status: 404 });
      return NextResponse.json({ order });
    }

    const phone = text(url.searchParams.get('phone'));
    if (!phone) return NextResponse.json({ message: '查詢進度需提供聯絡電話' }, { status: 400 });
    const order = await prisma.repairOrder.findFirst({
      where: { orderNumber, phone },
      select: { orderNumber: true, status: true, description: true }
    });
    if (!order) return NextResponse.json({ message: '查無符合資料，請確認案件編號與聯絡電話' }, { status: 404 });
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
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const created = await prisma.repairOrder.create({
          data: { orderNumber: newOrderNumber(), customerName, phone, email, department, deviceType, issueType, description }
        });
        return NextResponse.json({ orderNumber: created.orderNumber }, { status: 201 });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
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
