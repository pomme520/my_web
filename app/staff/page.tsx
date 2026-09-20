'use client';
import { useEffect, useState } from 'react';

type Role = 'admin' | 'technician' | 'viewer';
type PermissionKey = 'queryOrders' | 'updateStatus' | 'managePermissions';
type Settings = Record<Role, Record<PermissionKey, boolean>>;

type Order = {
  orderNumber: string;
  status: string;
  customerName: string;
  description: string;
};

const roleOrder: Role[] = ['admin', 'technician', 'viewer'];
const roleLabels: Record<Role, string> = {
  admin: '系統管理員',
  technician: '維修人員',
  viewer: '查詢人員'
};

const permissionLabels: Record<PermissionKey, string> = {
  queryOrders: '查詢報修案件',
  updateStatus: '更新案件狀態',
  managePermissions: '管理系統權限'
};

const defaultSettings: Settings = {
  admin: { queryOrders: true, updateStatus: true, managePermissions: true },
  technician: { queryOrders: true, updateStatus: true, managePermissions: false },
  viewer: { queryOrders: true, updateStatus: false, managePermissions: false }
};

const statusOptions = ['待確認', '處理中', '待使用者補充', '已完成', '已取消'];

export default function StaffPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [number, setNumber] = useState('');
  const [result, setResult] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [statusDraft, setStatusDraft] = useState('待確認');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);

  const hasPermission = (permission: PermissionKey) => Boolean(settings[selectedRole]?.[permission]);

  useEffect(() => {
    const boot = async () => {
      const savedRole = localStorage.getItem('staff-role') as Role | null;
      if (savedRole && roleOrder.includes(savedRole)) {
        setSelectedRole(savedRole);
      }

      try {
        const response = await fetch('/api/permissions', { credentials: 'same-origin' });
        const data = await response.json();
        if (data.currentRole && roleOrder.includes(data.currentRole)) {
          setSelectedRole(data.currentRole);
        }
        if (data.settings) {
          setSettings(data.settings);
        }
      } catch {
        // ignore and retain defaults
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, []);

  useEffect(() => {
    localStorage.setItem('staff-role', selectedRole);
    fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ role: selectedRole })
    }).catch(() => undefined);
  }, [selectedRole]);

  useEffect(() => {
    if (result) {
      setStatusDraft(result.status);
    }
  }, [result]);

  const search = async () => {
    setError('');
    setResult(null);

    if (!hasPermission('queryOrders')) {
      setError(`角色「${roleLabels[selectedRole]}」沒有查詢案件的權限。`);
      return;
    }

    if (!number.trim()) {
      setError('請輸入案件編號。');
      return;
    }

    const response = await fetch('/api/repair-orders?orderNumber=' + encodeURIComponent(number), {
      credentials: 'same-origin'
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || '查詢失敗');
      return;
    }

    setResult(data.order);
  };

  const saveSettings = async () => {
    setError('');
    setSaved('');

    const response = await fetch('/api/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ settings })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || '權限設定儲存失敗');
      return;
    }

    setSettings(data.settings);
    setSaved('權限設定已儲存。');
  };

  const updatePermission = (role: Role, permission: PermissionKey) => {
    setSettings((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [permission]: !current[role][permission]
      }
    }));
  };

  const updateStatus = async () => {
    if (!result) {
      setError('請先查詢案件。');
      return;
    }

    if (!hasPermission('updateStatus')) {
      setError(`角色「${roleLabels[selectedRole]}」沒有更新案件狀態的權限。`);
      return;
    }

    const response = await fetch('/api/repair-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ orderNumber: result.orderNumber, status: statusDraft })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || '狀態更新失敗');
      return;
    }

    setResult(data.order);
    setSaved('案件狀態已更新。');
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
      <div className="border-l-4 border-blue-700 pl-5">
        <p className="text-sm font-bold tracking-widest text-blue-700">STAFF CONSOLE</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">後台管理中心</h1>
        <p className="mt-4 text-slate-600">依角色檢查權限，進行案件查詢與維修狀態管控。</p>
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700">登入角色</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3 outline-none focus:border-blue-700 md:max-w-xs"
            >
              {roleOrder.map((role) => (
                <option key={role} value={role}>{roleLabels[role]}</option>
              ))}
            </select>
          </div>

          <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            目前權限：
            {hasPermission('queryOrders') ? '可查詢' : '不可查詢'} /
            {hasPermission('updateStatus') ? '可更新狀態' : '不可更新狀態'}
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-black text-slate-900">案件查詢</h2>
        <label className="mt-5 block text-sm font-bold text-slate-700">案件編號</label>
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
        <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
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

          <div className="border-t border-slate-200 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700">更新案件狀態</label>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 p-3 outline-none focus:border-blue-700"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={updateStatus}
                className="rounded-md bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-700"
              >
                更新狀態
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-bold tracking-widest text-blue-700">ACCESS CONTROL</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">系統設定權限</h2>
            <p className="mt-2 text-sm text-slate-600">設定每個角色可使用的後台功能。</p>
          </div>

          <button
            onClick={saveSettings}
            disabled={loading || selectedRole !== 'admin'}
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            儲存設定
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-3 font-bold text-slate-700">角色</th>
                {(Object.keys(permissionLabels) as PermissionKey[]).map((permission) => (
                  <th key={permission} className="p-3 font-bold text-slate-700">{permissionLabels[permission]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(roleLabels) as Role[]).map((role) => (
                <tr key={role} className="border-b border-slate-100">
                  <th className="p-3 font-bold text-slate-900">{roleLabels[role]}</th>
                  {(Object.keys(permissionLabels) as PermissionKey[]).map((permission) => (
                    <td key={permission} className="p-3">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings[role][permission]}
                          onChange={() => updatePermission(role, permission)}
                          className="h-4 w-4 accent-blue-700"
                          disabled={selectedRole !== 'admin'}
                        />
                        <span className="text-slate-600">{settings[role][permission] ? '允許' : '停用'}</span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {saved && <p className="mt-4 border border-green-200 bg-green-50 p-3 text-green-700">{saved}</p>}
        <p className="mt-4 text-xs leading-6 text-slate-500">
          此版本已接入後端權限檢查：只有具備權限的角色，才能查詢案件與更新狀態。管理員可保存權限設定。
        </p>
      </section>
    </div>
  );
}
