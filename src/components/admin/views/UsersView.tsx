'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Trash2,
  Edit2,
  MoreVertical,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Mail,
  Shield,
  KeyRound,
  Calendar,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Sheet } from '../../ui/sheet';
import { ConfirmDialog } from '../../ui/confirm-dialog';
import { TableSkeleton } from '../../ui/skeleton';
import { EmptyState } from '../../ui/empty-state';
import { useToast } from '../../ui/toast';

interface UserDoc {
  id: string | number;
  email: string;
  role: 'admin' | 'editor';
  createdAt: string;
  updatedAt: string;
}

export const UsersView: React.FC = () => {
  const { success, error } = useToast();

  const [users, setUsers] = useState<UserDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'editor'>('all');
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<'email' | 'role' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modals / Slide-over State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDoc | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserDoc | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    role: 'editor' as 'admin' | 'editor',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users from Payload API
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users?limit=100&depth=0');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.docs || []);
    } catch (err: any) {
      error('Failed to load users', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Format date helper: "11 Oct 2026, 10:55 PM"
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const datePart = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart}, ${timePart}`;
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  // Filtered & Sorted Users
  const processedUsers = useMemo(() => {
    let result = [...users];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((u) => u.email.toLowerCase().includes(q));
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'createdAt') {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, roleFilter, sortField, sortDirection]);

  // Paginated Users
  const totalPages = Math.ceil(processedUsers.length / perPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * perPage;
    return processedUsers.slice(start, start + perPage);
  }, [processedUsers, page, perPage]);

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedUsers.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSort = (field: 'email' | 'role' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please provide a valid email format';
    }

    if (!editingUser) {
      if (!formData.password) {
        errors.password = 'Initial password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      }
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'New password must be at least 8 characters long';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      if (editingUser) {
        // Update
        const payloadBody: any = {
          role: formData.role,
        };
        if (formData.password) {
          payloadBody.password = formData.password;
        }

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadBody),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.errors?.[0]?.message || 'Failed to update user');
        }

        success('User Updated', `Updated permissions for ${editingUser.email}`);
      } else {
        // Create
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.toLowerCase().trim(),
            password: formData.password,
            role: formData.role,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.errors?.[0]?.message || 'Failed to create user');
        }

        success('User Created', `Successfully invited ${formData.email}`);
      }

      setIsCreateOpen(false);
      setEditingUser(null);
      setFormData({ email: '', role: 'editor', password: '' });
      await fetchUsers();
    } catch (err: any) {
      error('Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/users/${deleteTargetUser.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete user');

      success('User Removed', `Account ${deleteTargetUser.email} has been deleted.`);
      setDeleteTargetUser(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTargetUser.id));
      await fetchUsers();
    } catch (err: any) {
      error('Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    try {
      setIsSubmitting(true);
      for (const id of selectedIds) {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
      }
      success('Bulk Action Complete', `Removed ${selectedIds.length} users.`);
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      await fetchUsers();
    } catch (err: any) {
      error('Bulk Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar: Search, Filters, Refresh, + Create Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search team members by email..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Role Filter Dropdown */}
          <div className="relative flex items-center">
            <SlidersHorizontal className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setPage(1);
              }}
              className="pl-8 pr-8 py-2 rounded-xl text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] appearance-none cursor-pointer transition-colors"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="editor">Editors</option>
            </select>
          </div>

          {/* Refresh button */}
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={fetchUsers}
            title="Refresh user list"
            aria-label="Refresh user list"
          />

          {/* Primary Action: Create / Invite User */}
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setEditingUser(null);
              setFormData({ email: '', role: 'editor', password: '' });
              setFormErrors({});
              setIsCreateOpen(true);
            }}
          >
            Invite User
          </Button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0F1B2D] text-white shadow-lg border border-[#C9A24B]/30 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#C9A24B] text-[#0F1B2D] text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium text-slate-200">
              user{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              icon={Trash2}
              onClick={() => setIsBulkDeleteOpen(true)}
            >
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="text-slate-300 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Surface */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : processedUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Users Found"
            description={
              searchQuery
                ? `No users match "${searchQuery}". Clear your search query or role filter to view all team members.`
                : 'No editorial accounts have been registered yet. Create your first team member to collaborate.'
            }
            actionLabel={searchQuery ? 'Clear Filters' : 'Invite User'}
            onAction={
              searchQuery
                ? () => {
                    setSearchQuery('');
                    setRoleFilter('all');
                  }
                : () => setIsCreateOpen(true)
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              {/* Sticky Table Header */}
              <thead>
                <tr className="border-b border-slate-200 bg-[#F7F3EC]/80 text-slate-700 select-none">
                  <th className="w-12 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all visible users"
                      checked={
                        paginatedUsers.length > 0 &&
                        selectedIds.length === paginatedUsers.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded-md border-slate-300 text-[#C9A24B] focus:ring-[#C9A24B] cursor-pointer"
                    />
                  </th>
                  <th
                    onClick={() => toggleSort('email')}
                    className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>User &amp; Email</span>
                      {sortField === 'email' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#C9A24B]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#C9A24B]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('role')}
                    className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Role &amp; Permissions</span>
                      {sortField === 'role' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#C9A24B]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#C9A24B]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('createdAt')}
                    className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Registered Date</span>
                      {sortField === 'createdAt' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#C9A24B]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#C9A24B]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="w-24 px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Rows with Hover & Selection States */}
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((userDoc) => {
                  const isSelected = selectedIds.includes(userDoc.id);
                  const initials = userDoc.email
                    ? userDoc.email.slice(0, 2).toUpperCase()
                    : 'US';

                  return (
                    <tr
                      key={userDoc.id}
                      className={`group transition-colors ${
                        isSelected
                          ? 'bg-[#F8F5EE] hover:bg-[#F4EFE5]'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select user ${userDoc.email}`}
                          checked={isSelected}
                          onChange={() => handleSelectRow(userDoc.id)}
                          className="w-4 h-4 rounded-md border-slate-300 text-[#C9A24B] focus:ring-[#C9A24B] cursor-pointer"
                        />
                      </td>

                      {/* User Avatar + Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DFBF7C] via-[#C9A24B] to-[#9E7E38] text-[#0F1B2D] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-white">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-[#C9A24B] transition-colors">
                              {userDoc.email}
                            </p>
                            <span className="text-[11px] text-slate-400">ID #{userDoc.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Pill Badge with Tooltip */}
                      <td className="px-4 py-3">
                        <Badge
                          variant={userDoc.role === 'admin' ? 'admin' : 'editor'}
                          showTooltip={true}
                        >
                          {userDoc.role === 'admin' ? 'Administrator' : 'Editor'}
                        </Badge>
                      </td>

                      {/* Formatted Date & Relative Time Hover */}
                      <td className="px-4 py-3">
                        <div
                          className="text-xs text-slate-600 flex flex-col"
                          title={getRelativeTime(userDoc.createdAt)}
                        >
                          <span className="font-medium text-slate-700">
                            {formatDate(userDoc.createdAt)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {getRelativeTime(userDoc.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Row Actions Menu */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Edit user details"
                            onClick={() => {
                              setEditingUser(userDoc);
                              setFormData({
                                email: userDoc.email,
                                role: userDoc.role,
                                password: '',
                              });
                              setFormErrors({});
                              setIsCreateOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete user"
                            onClick={() => setDeleteTargetUser(userDoc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {processedUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong>{(page - 1) * perPage + 1}</strong> to{' '}
                <strong>{Math.min(page * perPage, processedUsers.length)}</strong> of{' '}
                <strong>{processedUsers.length}</strong> user{processedUsers.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium focus:ring-1 focus:ring-[#C9A24B]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <div className="px-2.5 py-1 text-slate-700 font-semibold">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Sheet for Create / Edit User */}
      <Sheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={editingUser ? 'Edit Team Member' : 'Invite Team Member'}
        description={
          editingUser
            ? `Update role permissions or reset credentials for ${editingUser.email}.`
            : 'Grant portal access to a new team member with explicit role-based access control.'
        }
      >
        <form onSubmit={handleSaveUser} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                disabled={Boolean(editingUser)}
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="editor@uncharteredpodcast.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                  formErrors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200'
                } ${editingUser ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
            {formErrors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.email}</p>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              The official email address used for portal authentication.
            </p>
          </div>

          {/* Role Selector with Descriptions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Role &amp; Permission Level <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {/* Administrator Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.role === 'admin'
                    ? 'border-[#C9A24B] bg-amber-50/30 ring-1 ring-[#C9A24B]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="user-role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={() => setFormData((prev) => ({ ...prev, role: 'admin' }))}
                  className="mt-0.5 text-[#C9A24B] focus:ring-[#C9A24B]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Administrator</span>
                    <Badge variant="admin" showTooltip={false}>Full Access</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Full control over security, user invitations, URL redirects, and site settings.
                  </p>
                </div>
              </label>

              {/* Editor Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.role === 'editor'
                    ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="user-role"
                  value="editor"
                  checked={formData.role === 'editor'}
                  onChange={() => setFormData((prev) => ({ ...prev, role: 'editor' }))}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Editor</span>
                    <Badge variant="editor" showTooltip={false}>Editorial Desk</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Draft, curate, and publish podcast episodes, leader profiles, transcripts, and media.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {editingUser ? 'Reset Password (optional)' : 'Initial Password'}{' '}
              {!editingUser && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder={editingUser ? 'Leave blank to keep existing password' : '••••••••••••'}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                  formErrors.password ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200'
                }`}
              />
            </div>
            {formErrors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.password}</p>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              Must be at least 8 characters long with letters, numbers, and special characters.
            </p>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {editingUser ? 'Save Changes' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </Sheet>

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetUser)}
        onClose={() => setDeleteTargetUser(null)}
        onConfirm={handleDeleteUser}
        title="Remove Team Member"
        message={`Are you sure you want to delete ${deleteTargetUser?.email}? They will immediately lose access to the Unchartered Editorial Portal.`}
        confirmLabel="Delete User"
        isDestructive={true}
        isLoading={isSubmitting}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Users"
        message={`Are you sure you want to delete ${selectedIds.length} users? This destructive action cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.length} Users`}
        isDestructive={true}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default UsersView;
