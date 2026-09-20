'use client';

import { useEffect, useMemo, useState } from 'react';

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

const statuses = ['全部', '待確認', '處理中', '待使用者補充', '已完成', '已取消'];

export default function StaffDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    const response = await fetch('/api/repair-orders', { cache: 'no-store' });
    const data = await response.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesStatus = filter === '全部' || order.status === filter;
    const text = `${order.orderNumber} ${order.customerName} ${order.issueType}`.toLowerCase();
    return matchesStatus && text.includes(keyword.toLowerCase());
  }), [filter, keyword, orders]);

  const updateStatus = async (orderNumber: string, status: string) => {
    const response = await fetch('/api/repair-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber, status })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message ?? '更新失敗');
      return;
    }
    setOrders((current) => current.map((order) => order.orderNumber === orderNumber ? data.order : order));
    setMessage(`案件 ${orderNumber} 已更新為「${status}」`);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
      <div className="border-l-4 border-blue-700 pl-5">
        <p className="text-sm font-bold tracking-widest text-blue-700">STAFF CONSOLE</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">維修人員後台</h1>
        <p className="mt-4 text-slate-600">查看所有報修案件、搜尋問題，並更新處理進度。</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">案件總數</p><p className="mt-2 text-3xl font-black">{orders.length}</p></div>
        <div className="border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">待處理</p><p className="mt-2 text-3xl font-black text-amber-600">{orders.filter((order) => order.status === '待確認').length}</p></div>
        <div className="border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">已完成</p><p className="mt-2 text-3xl font-black text-emerald-700">{orders.filter((order) => order.status === '已完成').length}</p></div>
      </div>

      <div className="mt-8 border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜尋案件編號、申請人或問題類型" className="min-w-0 flex-1 rounded-md border border-slate-300 p-3 outline-none focus:border-blue-600" />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white p-3 outline-none focus:border-blue-600">
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <button onClick={loadOrders} className="rounded-md border border-blue-700 px-5 py-3 font-bold text-blue-700 hover:bg-blue-50">重新整理</button>
        </div>
        {message && <p className="mt-4 bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
      </div>

      <div className="mt-6 space-y-4">
        {loading && <div className="border border-slate-200 bg-white p-8 text-center text-slate-500">載入案件中…</div>}
        {!loading && filteredOrders.length === 0 && <div className="border border-slate-200 bg-white p-8 text-center text-slate-500">目前沒有符合條件的案件。</div>}
        {filteredOrders.map((order) => (
          <article key={order.orderNumber} className="border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-black text-slate-900">{order.orderNumber}</h2><span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">{order.status}</span></div>
                <p className="mt-3 text-sm text-slate-600">申請人：{order.customerName}｜電話：{order.phone}｜設備：{order.deviceType}</p>
                <p className="mt-1 text-sm text-slate-600">問題類型：{order.issueType}｜建立時間：{new Date(order.createdAt).toLocaleString('zh-TW')}</p>
              </div>
              <select value={order.status} onChange={(event) => updateStatus(order.orderNumber, event.target.value)} className="rounded-md border border-slate-300 bg-white p-3 text-sm font-semibold outline-none focus:border-blue-600">
                {statuses.slice(1).map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-sm font-bold text-slate-500">問題描述</p><p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{order.description}</p></div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-xs leading-6 text-slate-500">測試版提醒：目前案件資料儲存在伺服器記憶體中，重新啟動 Next.js 後資料會清空；此頁面尚未加入正式身分驗證。</p>
    </div>
  );
}
