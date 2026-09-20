'use client';
import { useState } from 'react';

export default function Booking() {
  const [sent, setSent] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/repair-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setSent(data.orderNumber);
      e.currentTarget.reset();
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
      <div className="border-l-4 border-blue-700 pl-5">
        <p className="text-sm font-bold tracking-widest text-blue-700">ONLINE REQUEST</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">線上電腦報修</h1>
        <p className="mt-4 text-slate-600">請填寫以下資料。送出後系統會產生案件編號，請妥善保存以便查詢。</p>
      </div>

      <form onSubmit={submit} className="mt-10 border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-7 border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-900">一、申請人與設備資料</h2>
          <p className="mt-1 text-sm text-slate-500">標示「*」的欄位為必填。</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">申請人姓名 *<input required name="customerName" className="mt-2 w-full rounded-md border border-slate-300 p-3 font-normal outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" /></label>
          <label className="text-sm font-semibold text-slate-700">聯絡電話 *<input required name="phone" className="mt-2 w-full rounded-md border border-slate-300 p-3 font-normal outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" /></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">電子信箱 *<input required type="email" name="email" className="mt-2 w-full rounded-md border border-slate-300 p-3 font-normal outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" /></label>
          <label className="text-sm font-semibold text-slate-700">設備類型<select name="deviceType" className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3 font-normal outline-none focus:border-blue-600"><option>桌上型電腦</option><option>筆記型電腦</option><option>其他設備</option></select></label>
          <label className="text-sm font-semibold text-slate-700">問題類型<select name="issueType" className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3 font-normal outline-none focus:border-blue-600"><option>無法開機</option><option>系統錯誤</option><option>速度變慢</option><option>硬體升級</option><option>網路或周邊設備</option><option>其他</option></select></label>
        </div>

        <div className="mb-3 mt-8 border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-900">二、問題內容</h2>
        </div>
        <label className="text-sm font-semibold text-slate-700">問題描述 *<textarea required name="description" className="mt-2 min-h-36 w-full rounded-md border border-slate-300 p-3 font-normal outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="請描述設備名稱、錯誤訊息、發生時間及已嘗試的處理方式" /></label>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button disabled={loading} className="rounded-md bg-blue-700 px-7 py-3 font-bold text-white transition hover:bg-blue-800 disabled:opacity-50">{loading ? '送出中…' : '送出報修單'}</button>
          <span className="text-sm text-slate-500">送出後請記下案件編號。</span>
        </div>

        {sent && <div className="mt-6 border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">報修單已送出，案件編號為：<strong className="text-lg">{sent}</strong>。請至「進度查詢」查看處理狀態。</div>}
      </form>
    </div>
  );
}
