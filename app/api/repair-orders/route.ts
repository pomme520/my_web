import { NextResponse } from 'next/server';
import { PermissionName } from '@prisma/client';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const statuses = ['待確認', '處理中', '待使用者補充', '已完成', '已取消'];
const publicOrder = (o: any) => ({ orderNumber: o.orderNumber, customerName: o.customerName, phone: o.phone, email: o.email, deviceType: o.deviceType, issueType: o.issueType, description: o.description, status: o.status, createdAt: o.createdAt });

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const required = ['customerName', 'phone', 'email', 'deviceType', 'issueType', 'description'];
  if (required.some((key) => !body[key])) return NextResponse.json({ message: '請完整填寫必填欄位' }, { status: 400 });
  const order = await prisma.repairOrder.create({ data: { orderNumber: `R-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10)}`, customerName: String(body.customerName), phone: String(body.phone), email: String(body.email), deviceType: String(body.deviceType), issueType: String(body.issueType), description: String(body.description) } });
  return NextResponse.json({ orderNumber: order.orderNumber, order: publicOrder(order) }, { status: 201 });
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (!(await hasPermission(user, PermissionName.queryOrders))) return NextResponse.json({ message: '沒有查詢案件權限' }, { status: 403 });
  const number = new URL(request.url).searchParams.get('orderNumber');
  const orders = number ? [await prisma.repairOrder.findUnique({ where: { orderNumber: number } })] : await prisma.repairOrder.findMany({ orderBy: { createdAt: 'desc' } });
  if (number && !orders[0]) return NextResponse.json({ message: '找不到此案件' }, { status: 404 });
  return NextResponse.json(number ? { order: publicOrder(orders[0]) } : { orders: orders.map(publicOrder) });
}

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: '未登入' }, { status: 401 });
  if (!(await hasPermission(user, PermissionName.updateStatus))) return NextResponse.json({ message: '沒有更新案件狀態權限' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!statuses.includes(body.status)) return NextResponse.json({ message: '無效的案件狀態' }, { status: 400 });
  const existing = await prisma.repairOrder.findUnique({ where: { orderNumber: String(body.orderNumber) } });
  if (!existing) return NextResponse.json({ message: '找不到此案件' }, { status: 404 });
  const order = await prisma.repairOrder.update({ where: { orderNumber: existing.orderNumber }, data: { status: body.status } });
  return NextResponse.json({ order: publicOrder(order) });
}
