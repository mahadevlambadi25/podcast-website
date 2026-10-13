import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-[#F7F3EB] text-slate-800">
      {/* Editorial Left Sidebar */}
      <AdminSidebar currentUser={user} />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editorial Top Bar */}
        <AdminHeader currentUser={user} />

        {/* Workspace Canvas */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
