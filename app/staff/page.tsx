import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import StaffClient from './staff-client';

export default async function StaffPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <StaffClient />;
}
