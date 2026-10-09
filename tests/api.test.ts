import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';

const valid = { customerName: '王小明', phone: '0912-345678', department: '資訊處', deviceType: '筆電', issueType: '無法開機', description: '無法開機' };
const post = (body: unknown) => new Request('http://x/api/repair-orders', { method: 'POST', body: JSON.stringify(body) });

test('booking persists in DB and tracking hides contact data', async () => {
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', { stdio: 'ignore', env: process.env });
  const { POST, GET, PATCH } = await import('../app/api/repair-orders/route');

  assert.equal((await POST(post({ ...valid, phone: 'abc' }))).status, 400);
  assert.equal((await POST(post({ ...valid, description: '' }))).status, 400);

  const res = await POST(post({ ...valid, email: 'a@b.co' }));
  assert.equal(res.status, 201);
  const { orderNumber } = await res.json();

  const found = await GET(new Request(`http://x/api/repair-orders?orderNumber=${orderNumber}`));
  const { order } = await found.json();
  assert.equal(order.status, '待確認');
  assert.equal(order.phone, undefined);
  assert.equal(order.email, undefined);

  assert.equal((await GET(new Request('http://x/api/repair-orders?orderNumber=nope'))).status, 404);
  assert.equal((await GET(new Request('http://x/api/repair-orders?staff=1'))).status, 401);
  const patch = new Request('http://x/api/repair-orders', { method: 'PATCH', body: JSON.stringify({ orderNumber, status: '已完成' }) });
  assert.equal((await PATCH(patch)).status, 401);
});
