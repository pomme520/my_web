'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@/lib/permissions';

const STATUS_OPTIONS = ['待確認', '處理中', '已完成', '已取消'] as const;
const ROLE_OPTIONS: Role[] = [Role.admin, Role.technician, Role.viewer];
const ROLE_LABELS: Record<Role, string> = {
  [Role.admin]: '管理員',
  [Role.technician]: '技術人員',
  [Role.viewer]: '檢視者'
};

type OrderStatus = (typeof STATUS_OPTIONS)[number];
type TechnicianOption = { id: number; username: string };

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
  assignedTechnician?: TechnicianOption | null;
  createdAt: string;
  updatedAt: string;
};

type StaffPermissions = {
  updateStatus: boolean;
  managePermissions: boolean;
};

type CurrentUser = {
  id: number;
  username: string;
  role: Role;
};

type StaffUser = {
  id: number;
  username: string;
  role: Role;
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

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function downloadCsv(orders: RepairOrder[], statusFilter: string) {
  const headers = ['案件編號', '狀態', '申請人', '電話', 'Email', '部門', '設備類型', '問題類型', '接單維修人員', '問題描述', '建立時間', '更新時間'];
  const rows = orders.map((order) => [
    order.orderNumber,
    order.status,
    order.customerName,
    order.phone,
    order.email,
    order.department,
    order.deviceType,
    order.issueType,
    order.assignedTechnician?.username ?? '',
    order.description,
    formatDateTime(order.createdAt),
    formatDateTime(order.updatedAt)
  ]);
  const content = `\uFEFF${[headers, ...rows].map((row) => row.map((value) => csvCell(String(value ?? ''))).join(',')).join('\r\n')}`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `案件清單${statusFilter ? `-${statusFilter}` : '-全部'}-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function StaffPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigningTechnician, setAssigningTechnician] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [permissions, setPermissions] = useState<StaffPermissions>({ updateStatus: false, managePermissions: false });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>(Role.viewer);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.orderNumber === selectedOrderNumber) ?? null,
    [orders, selectedOrderNumber]
  );

  const applyStaffDashboardData = useCallback((data: Record<string, unknown>, keepSelection: boolean) => {
    const nextOrders = Array.isArray(data.orders) ? (data.orders as RepairOrder[]) : [];
    setPermissions({
      updateStatus:
        !!data.permissions &&
        typeof data.permissions === 'object' &&
        (data.permissions as StaffPermissions).updateStatus === true,
      managePermissions:
        !!data.permissions &&
        typeof data.permissions === 'object' &&
        (data.permissions as StaffPermissions).managePermissions === true
    });
    setCurrentUser(
      data.currentUser &&
        typeof data.currentUser === 'object' &&
        typeof (data.currentUser as CurrentUser).id === 'number' &&
        typeof (data.currentUser as CurrentUser).username === 'string' &&
        typeof (data.currentUser as CurrentUser).role === 'string'
        ? (data.currentUser as CurrentUser)
        : null
    );
    setOrders(nextOrders);
    setTechnicians(Array.isArray(data.technicians) ? (data.technicians as TechnicianOption[]) : []);
    setSelectedOrderNumber((currentOrderNumber) => {
      if (keepSelection && nextOrders.some((order) => order.orderNumber === currentOrderNumber)) {
        return currentOrderNumber;
      }
      return nextOrders[0]?.orderNumber ?? '';
    });
  }, []);

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
      applyStaffDashboardData(data as Record<string, unknown>, keepSelection);
    } catch (loadError) {
      setOrders([]);
      setSelectedOrderNumber('');
      setCurrentUser(null);
      setTechnicians([]);
      setPermissions({ updateStatus: false, managePermissions: false });
      setError(loadError instanceof Error ? loadError.message : '讀取案件失敗');
    } finally {
      setLoading(false);
    }
  }, [applyStaffDashboardData, router, statusFilter]);

  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  useEffect(() => {
    setSelectedTechnicianId(selectedOrder?.assignedTechnician?.id ? String(selectedOrder.assignedTechnician.id) : '');
  }, [selectedOrder]);

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

  const createUser = async () => {
    setCreatingUser(true);
    setError('');
    setActionMessage('');

    try {
      const response = await fetch('/api/staff/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          role: newRole
        })
      });
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.message || '新增使用者失敗');
      }

      setActionMessage(`使用者 ${newUsername.trim()} 已建立`);
      setNewUsername('');
      setNewPassword('');
      setNewRole(Role.viewer);
      setShowCreateUserForm(false);
      if (showUsersList) {
        await fetchUsers();
      }
      await fetchOrders(true);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '新增使用者失敗');
    } finally {
      setCreatingUser(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/staff/users', { cache: 'no-store' });
      if (response.status === 401) {
        setUsers([]);
        router.push('/login');
        return;
      }
      const data = await readJsonSafe(response);
      if (!response.ok) {
        setUsers([]);
        throw new Error(data.message || '讀取使用者失敗');
      }
      setUsers(Array.isArray(data.users) ? (data.users as StaffUser[]) : []);
    } catch (error) {
      setUsers([]);
      throw error;
    } finally {
      setLoadingUsers(false);
    }
  }, [router]);

  const toggleUsersList = async () => {
    setError('');
    setActionMessage('');
    if (showUsersList) {
      setShowUsersList(false);
      return;
    }
    try {
      await fetchUsers();
      setShowUsersList(true);
    } catch (usersError) {
      setShowUsersList(false);
      setError(usersError instanceof Error ? usersError.message : '讀取使用者失敗');
    }
  };

  const saveAssignedTechnician = async () => {
    if (!selectedOrder || !permissions.updateStatus) return;
    const parsedTechnicianId = selectedTechnicianId ? Number(selectedTechnicianId) : null;
    if (
      parsedTechnicianId !== null &&
      (!Number.isFinite(parsedTechnicianId) || !Number.isInteger(parsedTechnicianId) || parsedTechnicianId <= 0)
    ) {
      setError('接單維修人員格式不正確');
      return;
    }
    const nextAssignedTechnicianId = parsedTechnicianId;
    const currentAssignedTechnicianId = selectedOrder.assignedTechnician?.id ?? null;
    if (nextAssignedTechnicianId === currentAssignedTechnicianId) return;

    setAssigningTechnician(true);
    setError('');
    setActionMessage('');

    try {
      const response = await fetch('/api/repair-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: selectedOrder.orderNumber, assignedTechnicianId: nextAssignedTechnicianId })
      });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.message || '更新接單維修人員失敗');
      }
      await fetchOrders(true);
      setActionMessage(nextAssignedTechnicianId ? '接單維修人員已更新' : '已清除接單維修人員');
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : '更新接單維修人員失敗');
    } finally {
      setAssigningTechnician(false);
    }
  };

  const deleteUser = async (user: StaffUser) => {
    if (deletingUserId !== null) return;
    const confirmed = window.confirm(`確定要刪除使用者「${user.username}」嗎？此操作會同步清除其登入 session。`);
    if (!confirmed) return;

    setDeletingUserId(user.id);
    setError('');
    setActionMessage('');

    try {
      const response = await fetch('/api/staff/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id })
      });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.message || '刪除使用者失敗');
      }
      setActionMessage(data.message || `已刪除使用者 ${user.username}`);
      await fetchUsers();

      try {
        const searchParams = new URLSearchParams({ staff: '1' });
        if (statusFilter) searchParams.set('status', statusFilter);
        const ordersResponse = await fetch(`/api/repair-orders?${searchParams.toString()}`, { cache: 'no-store' });
        if (ordersResponse.status === 401) {
          router.push('/login');
          return;
        }
        const ordersData = await readJsonSafe(ordersResponse);
        if (!ordersResponse.ok) {
          throw new Error(ordersData.message || '重新整理案件資料失敗');
        }
        applyStaffDashboardData(ordersData as Record<string, unknown>, true);
      } catch (refreshError) {
        setError(refreshError instanceof Error ? `使用者已刪除，但案件資料重新整理失敗：${refreshError.message}` : '使用者已刪除，但案件資料重新整理失敗');
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '刪除使用者失敗');
    } finally {
      setDeletingUserId(null);
    }
  };

  const exportOrders = async () => {
    if (loading || orders.length === 0) return;

    setExporting(true);
    setError('');
    setActionMessage('');

    try {
      downloadCsv(orders, statusFilter);
      setActionMessage(`已匯出 ${orders.length} 筆案件`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : '匯出失敗');
    } finally {
      setExporting(false);
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
        <div className="flex flex-col items-start gap-3 sm:items-end">
          {currentUser && (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
              目前登入：<span className="font-bold text-slate-900">{currentUser.username}</span>
              <span className="mx-2 text-slate-300">|</span>
              角色：<span className="font-bold text-slate-900">{ROLE_LABELS[currentUser.role] ?? currentUser.role}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {permissions.managePermissions && (
              <button
                onClick={() => setShowCreateUserForm((current) => !current)}
                disabled={creatingUser || loading}
                className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showCreateUserForm ? '取消新增使用者' : '新增使用者'}
              </button>
            )}
            {permissions.managePermissions && (
              <button
                onClick={toggleUsersList}
                disabled={loading || loadingUsers}
                className="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showUsersList ? '關閉使用者列表' : '檢視使用者'}
              </button>
            )}
            <button
              onClick={exportOrders}
              disabled={loading || exporting || orders.length === 0}
              className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? '匯出中...' : '匯出'}
            </button>
            <button
              onClick={() => fetchOrders(true)}
              disabled={loading || updatingStatus || creatingUser}
              aria-busy={loading}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '載入中...' : '重新整理'}
            </button>
            <button
              onClick={logout}
              disabled={loggingOut || loading || updatingStatus || creatingUser || deletingUserId !== null}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loggingOut ? '登出中...' : '登出'}
            </button>
          </div>
        </div>
      </div>

      {permissions.managePermissions && showCreateUserForm && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">新增使用者</h2>
              <p className="mt-1 text-sm text-slate-600">建立新使用者並套用角色預設權限。</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm font-semibold text-slate-700">
                帳號
                <input
                  value={newUsername}
                  onChange={(event) => setNewUsername(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
                  autoComplete="username"
                  aria-label="新增使用者帳號"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                密碼
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
                  autoComplete="new-password"
                  aria-label="新增使用者密碼"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                角色
                <select
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value as Role)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
                  aria-label="新增使用者角色"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={createUser}
                disabled={creatingUser || !newUsername.trim() || !newPassword}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingUser ? '建立中...' : '建立使用者'}
              </button>
              <button
                onClick={() => {
                  setShowCreateUserForm(false);
                  setNewUsername('');
                  setNewPassword('');
                  setNewRole(Role.viewer);
                }}
                disabled={creatingUser}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                取消
              </button>
            </div>
          </div>
        </section>
      )}

      {permissions.managePermissions && showUsersList && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">使用者列表</h2>
              <p className="mt-1 text-sm text-slate-600">僅顯示帳號、角色與時間資訊，不含密碼與 session。</p>
            </div>
            <button
              onClick={() => {
                fetchUsers().catch((usersError) => {
                  setError(usersError instanceof Error ? usersError.message : '讀取使用者失敗');
                });
              }}
              disabled={loadingUsers}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingUsers ? '載入中...' : '重新整理'}
            </button>
          </div>
          {loadingUsers ? (
            <p className="text-sm text-slate-500">載入中...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500">目前沒有可顯示的使用者。</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-600">
                    <th className="border border-slate-200 px-3 py-2">帳號</th>
                    <th className="border border-slate-200 px-3 py-2">角色</th>
                    <th className="border border-slate-200 px-3 py-2">建立時間</th>
                    <th className="border border-slate-200 px-3 py-2">更新時間</th>
                    <th className="border border-slate-200 px-3 py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="text-slate-700">
                      <td className="border border-slate-200 px-3 py-2 font-semibold">{user.username}</td>
                      <td className="border border-slate-200 px-3 py-2">{ROLE_LABELS[user.role] ?? user.role}</td>
                      <td className="border border-slate-200 px-3 py-2">{formatDateTime(user.createdAt)}</td>
                      <td className="border border-slate-200 px-3 py-2">{formatDateTime(user.updatedAt)}</td>
                      <td className="border border-slate-200 px-3 py-2">
                        {currentUser?.id === user.id ? (
                          <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-500">
                            目前登入中
                          </span>
                        ) : (
                          <button
                            onClick={() => deleteUser(user)}
                            disabled={deletingUserId !== null}
                            aria-label={`刪除使用者 ${user.username}`}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingUserId === user.id ? '刪除中...' : '刪除'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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
                <p>
                  <span className="text-slate-500">接單維修人員：</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.assignedTechnician?.username || '未指派'}</span>
                </p>
              </div>

              <div>
                <p className="text-slate-500">問題描述：</p>
                <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-700">{selectedOrder.description}</p>
              </div>

              <div>
                <p className="mb-2 text-slate-500">變更狀態：</p>
                {!permissions.updateStatus && <p className="mb-2 text-sm text-slate-500">您目前只有查詢權限，無法更新案件狀態。</p>}
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
                        disabled={updatingStatus || !permissions.updateStatus}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {status}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-slate-500">接單維修人員：</p>
                {!permissions.updateStatus && <p className="mb-2 text-sm text-slate-500">您目前沒有指派維修人員權限。</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedTechnicianId}
                    onChange={(event) => setSelectedTechnicianId(event.target.value)}
                    disabled={!permissions.updateStatus || assigningTechnician}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="接單維修人員"
                  >
                    <option value="">未指派</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.username}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={saveAssignedTechnician}
                    disabled={!permissions.updateStatus || assigningTechnician}
                    className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {assigningTechnician ? '儲存中...' : '儲存接單維修人員'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
