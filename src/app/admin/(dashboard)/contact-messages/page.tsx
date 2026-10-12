'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Trash2,
  RefreshCw,
  X,
  Mail,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

interface ContactMessageItem {
  id: number;
  name: string;
  email: string;
  message: string;
  consent?: boolean;
  created_at: string;
}

export default function ContactMessagesPage() {
  const { success, error: toastError } = useToast();
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Message Detail Drawer
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [msgToDelete, setMsgToDelete] = useState<ContactMessageItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/contact-messages?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load contact messages');
      const data = await res.json();
      setMessages(data.docs || []);
      setTotalDocs(data.totalDocs || 0);
    } catch (err: any) {
      toastError('Load Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, toastError]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleDelete = async () => {
    if (!msgToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${msgToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete message');
      success('Message Deleted', `Message from "${msgToDelete.name}" was deleted.`);
      setDeleteModalOpen(false);
      setMsgToDelete(null);
      if (selectedMessage?.id === msgToDelete.id) setSelectedMessage(null);
      fetchMessages();
    } catch (err: any) {
      toastError('Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Audience Inquiries & Feedback Inbox
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review listener questions, sponsorship proposals, and feedback messages.
          </p>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by sender name, email, or message..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
          />
        </div>

        <button
          onClick={() => fetchMessages()}
          title="Refresh Inbox"
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Messages List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 border-b text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Sender</th>
                <th className="py-3.5 px-4">Message Preview</th>
                <th className="py-3.5 px-4">Received</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C9A24B]" />
                    <span>Loading inquiries...</span>
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Inbox is clear</p>
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr
                    key={msg.id}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedMessage(msg)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{msg.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{msg.email}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-lg">
                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                        {msg.message}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1 justify-end">
                        <a
                          href={`mailto:${msg.email}?subject=Re:%20Unchartered%20Podcast%20Inquiry`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                          title="Reply via Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setMsgToDelete(msg);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                          title="Delete Message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Reader Drawer */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-lg bg-white h-full min-h-screen shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-serif font-bold text-slate-900">
                  Message Details
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message Header */}
              <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase">From:</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedMessage.name}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Email:</span>
                  <p className="text-slate-800 mt-0.5 font-mono">{selectedMessage.email}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Received:</span>
                  <p className="text-slate-600 mt-0.5">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Body */}
              <div className="py-2">
                <span className="text-xs font-semibold uppercase text-slate-500 block mb-2">Message Content:</span>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setMsgToDelete(selectedMessage);
                  setDeleteModalOpen(true);
                }}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <a
                href={`mailto:${selectedMessage.email}?subject=Re:%20Unchartered%20Podcast%20Inquiry`}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] text-xs font-semibold shadow-md"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Reply by Email</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Contact Message"
        description={`Are you sure you want to delete this inquiry from "${msgToDelete?.name}"?`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Message'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
