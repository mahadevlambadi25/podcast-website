'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  User,
  Clock,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface AuditLogItem {
  id: number;
  user_email?: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

export default function ActivityLogsPage() {
  const { error: toastError } = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/activity?page=${page}&limit=25`);
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setLogs(data.docs || []);
      setTotalDocs(data.totalDocs || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      toastError('Load Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, toastError]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'update':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delete':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'publish':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'unpublish':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            System Activity & Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable audit record of administrative actions, publishes, and catalog modifications.
          </p>
        </div>

        <button
          onClick={() => fetchLogs()}
          title="Refresh Logs"
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 border-b text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity Type</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C9A24B]" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No activity logs recorded yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Administrative mutations will appear here automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                      {log.user_email || 'System / Automated'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold capitalize text-slate-700">
                      {log.entity}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-md">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * 25 + (logs.length > 0 ? 1 : 0)} to{' '}
            {Math.min(page * 25, totalDocs)} of {totalDocs} audit records
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
