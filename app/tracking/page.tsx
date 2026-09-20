'use client';
import { useState } from 'react';

type Order = {
  orderNumber: string;
  status: string;
  customerName: string;
  description: string;
};

export default function TrackingPage() {
  const [number, setNumber] = useState('');
  const [result, setResult] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const search = async () => {
    setError('');
    setResult(null);
    if (!number.trim()) {
      setError('請輸入案件編號。');
      return;
    }

    const res = await fetch('/api/repair-orders?orderNumber=' + encodeURIComponent(number));
    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      return;
    }
    setResult(data.order);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
      <div className="border-l-4 border-blue-700 pl-5">
        <p className="text-sm font-bold tracking-widest text-blue-700">REQUEST STATUS</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">電腦報修進度查詢</h1>
        <p className="mt-4 text-slate-600">請輸入送出報修單後取得的案件編號。</p>
      </div>

      <div className="mt-10 border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <label className="block text-sm font-bold text-slate-700">案件編號</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="例如 R-123456"
            className="min-w-0 flex-1 rounded-md border border-slate-300 p-3 outline-none focus:border-blue-700"
          />
          <button onClick={search} className="rounded-md bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800">
            查詢案件
          </button>
        </div>
        {error && <p className="mt-4 border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      </div>

      {result && (
        <div className="mt-6 border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">案件編號</p>
              <p className="text-2xl font-black text-slate-900">{result.orderNumber}</p>
            </div>
            <span className="w-fit rounded-full bg-blue-100 px-4 py-2 font-bold text-blue-800">{result.status}</span>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">申請人</p>
              <p className="mt-1 font-bold">{result.customerName}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-slate-500">問題描述</p>
              <p className="mt-1 leading-7 text-slate-700">{result.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
