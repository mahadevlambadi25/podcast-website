'use client';

import React from 'react';
import { UsersView } from './UsersView';
import { ToastProvider } from '../../ui/toast';
import { PageHeader } from '../../layout/PageHeader';
import { Shield } from 'lucide-react';

export const UsersListView: React.FC = () => {
  return (
    <ToastProvider>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
        <PageHeader
          title="Team & Access Control"
          description="Manage editorial portal members, assign administrative privileges, and review team roles."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1B2D] text-[#C9A24B] border border-[#C9A24B]/30 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-[#C9A24B]" />
              Role-Based Access
            </span>
          }
        />
        <UsersView />
      </div>
    </ToastProvider>
  );
};

export default UsersListView;
