import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/features/auth';
import { SystemReports } from '@/features/admin/components/SystemReports';

export default async function ReportesPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return <SystemReports />;
}