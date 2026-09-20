import { NextResponse } from 'next/server';

type Order = {
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  deviceType: string;
  issueType: string;
  description: string;
  status: string;
  createdAt: string;
};

const orders: Order[] = [];
const statuses = ['待確認', '處理中', '待使用者補充', '已完成', '已取消'];

function number() {
  return `R-${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.customerName || !body.phone || !body.email || !body.description) {
    return NextResponse.json({ message: '請完整填寫必填欄位' }, { status: 400 });
  }

  let orderNumber = number();
  while (orders.some((order) => order.orderNumber === orderNumber)) orderNumber = number();

  const order: Order = {
    orderNumber,
    customerName: body.customerName,
    phone: body.phone,
    email: body.email,
    deviceType: body.deviceType,
    issueType: body.issueType,
    description: body.description,
    status: '待確認',
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  return NextResponse.json({ orderNumber, order }, { status: 201 });
}

export async function GET(request: Request) {
  const orderNumber = new URL(request.url).searchParams.get('orderNumber');
  if (!orderNumber) return NextResponse.json({ orders: [...orders].reverse() });

  const order = orders.find((item) => item.orderNumber.toLowerCase() === orderNumber.toLowerCase());
  if (!order) return NextResponse.json({ message: '找不到此案件，請確認案件編號' }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const order = orders.find((item) => item.orderNumber === body.orderNumber);

  if (!order) return NextResponse.json({ message: '找不到此案件' }, { status: 404 });
  if (!statuses.includes(body.status)) return NextResponse.json({ message: '無效的案件狀態' }, { status: 400 });

  order.status = body.status;
  return NextResponse.json({ order });
}
