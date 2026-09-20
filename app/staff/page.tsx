import { redirect } from 'next/navigation';
import { PermissionName } from '@/lib/permissions';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import StaffClient from './staff-client';

export default async function StaffPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await hasPermission(user, PermissionName.queryOrders))) redirect('/');
  return <StaffClient />;
}
