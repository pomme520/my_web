'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = ['待確認', '處理中', '已完成', '已取消'] as const;

type OrderStatus = (typeof STATUS_OPTIONS)[number];

type RepairOrder = {
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  email: string;
  department: string;
  deviceType: string;
  issueType: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

async function readJsonSafe(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return {};
  return response.json().catch(() => ({}));
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-TW');
}

export default function StaffPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const selectedOrder = useMemo(
    () => orders.find((order) => order.orderNumber === selectedOrderNumber) ?? null,
    [orders, selectedOrderNumber]
  );

  const fetchOrders = useCallback(async (keepSelection = true) => {
    setError('');
    setActionMessage('');
    setLoading(true);

    try {
      const searchParams = new URLSearchParams({ staff: '1' });
      if (statusFilter) searchParams.set('status', statusFilter);

      const response = await fetch(`/api/repair-orders?${searchParams.toString()}`, { cache: 'no-store' });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.message || '讀取案件失敗');
      }

      const nextOrders = Array.isArray(data.orders) ? (data.orders as RepairOrder[]) : [];
      setOrders(nextOrders);

      setSelectedOrderNumber((currentOrderNumber) => {
        if (keepSelection && nextOrders.some((order) => order.orderNumber === currentOrderNumber)) {
          return currentOrderNumber;
        }
        return nextOrders[0]?.orderNumber ?? '';
      });
    } catch (loadError) {
      setOrders([]);
      setSelectedOrderNumber('');
      setError(loadError instanceof Error ? loadError.message : '讀取案件失敗');
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter]);

  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  const updateStatus = async (status: OrderStatus) => {
    if (!selectedOrder || selectedOrder.status === status) return;

    setUpdatingStatus(true);
    setError('');
    setActionMessage('');

    try {
      const response = await fetch('/api/repair-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: selectedOrder.orderNumber, status })
      });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.message || '更新案件狀態失敗');
      }

      setActionMessage('案件狀態已更新');
      await fetchOrders(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : '更新案件狀態失敗');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    setError('');
    setActionMessage('');

    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
      setLoggingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-12">
      <div className="flex flex-col gap-4 border-l-4 border-blue-700 pl-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold tracking-widest text-blue-700">STAFF DASHBOARD</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">案件處理後台</h1>
          <p className="mt-3 text-slate-600">查看所有報修案件、檢視細節並更新處理狀態。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchOrders(true)}
            disabled={loading || updatingStatus}
            aria-busy={loading}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '載入中...' : '重新整理'}
          </button>
          <button
            onClick={logout}
            disabled={loggingOut || loading || updatingStatus}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loggingOut ? '登出中...' : '登出'}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="status-filter" className="text-sm font-semibold text-slate-700">
            狀態篩選
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700"
          >
            <option value="">全部</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {actionMessage && <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{actionMessage}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">案件列表</div>
          <div className="max-h-[520px] overflow-auto">
            {loading ? (
              <p className="p-4 text-sm text-slate-500">載入中...</p>
            ) : orders.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">目前沒有符合條件的案件</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <li key={order.orderNumber}>
                    <button
                      onClick={() => setSelectedOrderNumber(order.orderNumber)}
                      aria-pressed={selectedOrderNumber === order.orderNumber}
                      className={`w-full p-4 text-left transition hover:bg-slate-50 ${
                        selectedOrderNumber === order.orderNumber ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="font-bold text-slate-900">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {order.customerName}｜{order.department}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{order.deviceType}</p>
                      <p className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {order.status}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">案件詳情</div>
          {!selectedOrder ? (
            <p className="p-4 text-sm text-slate-500">請從左側選擇案件</p>
          ) : (
            <div className="space-y-4 p-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <p>
                  <span className="text-slate-500">案件編號：</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.orderNumber}</span>
                </p>
                <p>
                  <span className="text-slate-500">狀態：</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.status}</span>
                </p>
                <p>
                  <span className="text-slate-500">申請人：</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.customerName}</span>
                </p>
                <p>
                  <span className="text-slate-500">部門：</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.department}</span>
                </p>
                <p>
                  <span className="text-slate-500">設備：</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.deviceType}</span>
                </p>
                <p>
                  <span className="text-slate-500">問題類型：</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.issueType}</span>
                </p>
                <p>
                  <span className="text-slate-500">電話：</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.phone}</span>
                </p>
                <p>
                  <span className="text-slate-500">Email：</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.email || '-'}</span>
                </p>
                <p>
                  <span className="text-slate-500">建立時間：</span>
                  <span className="font-semibold text-slate-900">{formatDateTime(selectedOrder.createdAt)}</span>
                </p>
                <p>
                  <span className="text-slate-500">更新時間：</span>
                  <span className="font-semibold text-slate-900">{formatDateTime(selectedOrder.updatedAt)}</span>
                </p>
              </div>

              <div>
                <p className="text-slate-500">問題描述：</p>
                <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-700">{selectedOrder.description}</p>
              </div>

              <div>
                <p className="mb-2 text-slate-500">變更狀態：</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) =>
                    selectedOrder.status === status ? (
                      <span
                        key={status}
                        aria-current="true"
                        className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
                      >
                        {status}（目前）
                      </span>
                    ) : (
                      <button
                        key={status}
                        onClick={() => updateStatus(status)}
                        disabled={updatingStatus}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {status}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
