'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const inputClass = 'mt-2 w-full rounded-md border border-slate-300 p-3 outline-none focus:border-blue-700';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '登入失敗');
      }

      router.push('/staff');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登入失敗');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold tracking-widest text-blue-700">STAFF LOGIN</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">維修後台登入</h1>
        <p className="mt-3 text-sm text-slate-600">請登入後使用案件查詢與維修管理功能。</p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            帳號
            <input
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={inputClass}
              autoComplete="username"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            密碼
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </label>

          {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? '登入中...' : '登入'}
          </button>
        </form>

        <p className="mt-6 rounded-md bg-slate-50 p-3 text-xs leading-6 text-slate-600">
          測試帳號：admin<br />
          測試密碼：請使用 seed 設定的密碼
        </p>
      </section>
    </div>
  );
}
