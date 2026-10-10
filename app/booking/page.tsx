'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

const emptyForm = {
  customerName: '',
  phone: '',
  email: '',
  department: '',
  deviceType: '',
  issueType: '',
  description: ''
};

const deviceTypeOptions = ['桌上型電腦', '筆記型電腦', '螢幕', '印表機', '其他'];
const issueTypeOptions = ['無法開機', '網路問題', '軟體問題', '硬體問題', '其他'];

const PHONE_PATTERN = /^[0-9+\-()#\s]{6,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: typeof emptyForm) {
  if (!form.customerName.trim() || !form.phone.trim() || !form.department.trim() || !form.deviceType || !form.issueType || !form.description.trim()) {
    return '請完整填寫必填欄位。';
  }
  if (!PHONE_PATTERN.test(form.phone.trim())) return '聯絡電話格式不正確，請輸入 6 至 30 碼的電話號碼。';
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) return '電子信箱格式不正確。';
  if (form.description.trim().length > 2000) return '問題描述不可超過 2000 字。';
  return '';
}

export default function BookingPage() {
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setNotice('');
    setOrderNumber('');
    setError('');

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);

    try {
      const response = await fetch('/api/repair-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          department: form.department.trim(),
          deviceType: form.deviceType.trim(),
          issueType: form.issueType.trim(),
          description: form.description.trim()
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '報修送出失敗，請稍後再試。');
      setOrderNumber(data.orderNumber);
      setNotice(`報修單已送出，案件編號：${data.orderNumber}，請妥善保存以便查詢進度。`);
      setForm(emptyForm);
    } catch (submitError) {
      setError(submitError instanceof TypeError ? '網路異常，報修送出失敗，請檢查連線後再試。' : submitError instanceof Error ? submitError.message : '報修送出失敗');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'mt-2 w-full rounded-md border border-slate-300 p-3 font-normal outline-none focus:border-blue-700';

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-sm font-bold tracking-widest text-blue-700">ONLINE REPAIR</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">線上報修</h1>
      <p className="mt-3 text-slate-600">請填寫以下資料，送出後可使用案件編號查詢進度。</p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            申請人姓名（必填）
            <input required maxLength={50} value={form.customerName} onChange={(event) => update('customerName', event.target.value)} className={inputClass} />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            聯絡電話（必填）
            <input required type="tel" maxLength={30} value={form.phone} onChange={(event) => update('phone', event.target.value)} className={inputClass} />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            電子信箱（非必填）
            <input type="email" maxLength={120} value={form.email} onChange={(event) => update('email', event.target.value)} className={inputClass} />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            部門（必填）
            <input
              required
              maxLength={80}
              value={form.department}
              onChange={(event) => update('department', event.target.value)}
              placeholder="請輸入部門名稱"
              className={inputClass}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            設備類型（必填）
            <select required value={form.deviceType} onChange={(event) => update('deviceType', event.target.value)} className={`${inputClass} bg-white`}>
              <option value="">請選擇設備類型</option>
              {deviceTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700 md:col-span-2">
            問題類型（必填）
            <select required value={form.issueType} onChange={(event) => update('issueType', event.target.value)} className={`${inputClass} bg-white`}>
              <option value="">請選擇問題類型</option>
              {issueTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          問題描述（必填）
          <textarea required maxLength={2000} rows={6} value={form.description} onChange={(event) => update('description', event.target.value)} className={`${inputClass} resize-none`} />
        </label>

        {notice && (
          <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}{' '}
            <Link href={`/tracking?orderNumber=${encodeURIComponent(orderNumber)}`} className="font-bold underline">前往查詢進度</Link>
          </p>
        )}
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={submitting} className="rounded-md bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? '送出中...' : '送出報修'}
        </button>
      </form>
    </section>
  );
}
