import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/features/auth';
import { AdminDashboard } from '@/features/admin/components/AdminDashboard';

export default async function AdminPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return <AdminDashboard />;
}