import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function newOrderNumber() {
  return `R-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;
}

export async function GET(request: Request) {
  const orderNumber = text(new URL(request.url).searchParams.get('orderNumber'));
  if (!orderNumber) return NextResponse.json({ message: '請提供案件編號' }, { status: 400 });

  try {
    const order = await prisma.repairOrder.findUnique({
      where: { orderNumber },
      select: { orderNumber: true, status: true, customerName: true, department: true, description: true }
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
