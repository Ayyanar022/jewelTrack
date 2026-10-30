'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Role } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Users, UserPlus, Shield, Power, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function StaffManagementPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'CASHIER' as Role,
    email: '',
  });

  // Fetch staff users
  const { data: staffList = [], isLoading } = useQuery<any[]>({
    queryKey: ['shop-staff'],
    queryFn: async () => {
      const res = await api.get('/users/staff');
      return res.data;
    },
  });

  // Fetch current subscription for max_users limit
  const { data: subscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await api.get('/subscription/current');
      return res.data;
    },
    retry: false,
  });

  const maxUsers = subscription?.plan?.max_users ?? 1;
  const activeStaffCount = staffList.filter((s) => s.is_active).length;
  const isLimitReached = activeStaffCount >= maxUsers;

  // Add Staff Mutation
  const addStaffMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      return api.post('/users/staff', payload);
    },
    onSuccess: () => {
      toast.success('Staff member added successfully');
      queryClient.invalidateQueries({ queryKey: ['shop-staff'] });
      setIsAddOpen(false);
      setForm({ name: '', phone: '', password: '', role: 'CASHIER', email: '' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add staff member');
    },
  });

  // Toggle Staff Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return api.patch(`/users/staff/${staffId}/toggle-status`);
    },
    onSuccess: () => {
      toast.success('Staff status updated');
      queryClient.invalidateQueries({ queryKey: ['shop-staff'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update staff status');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Staff name is required');
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      toast.error('Valid 10-digit phone number is required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const payload: any = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      password: form.password,
      role: form.role,
    };

    if (form.email && form.email.trim()) {
      payload.email = form.email.trim();
    }

    addStaffMutation.mutate(payload);
  };

  const inputClass =
    'h-9 sm:h-10 text-xs sm:text-sm font-semibold text-slate-900 border-slate-300 focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-200 transition-all rounded-xl';

  return (
    <div className="flex flex-col gap-3 sm:gap-4 max-w-7xl mx-auto w-full px-2.5 sm:px-4 lg:px-8 pb-16">
      {/* Header Bar — Slim single row on mobile */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
            <h1 className="text-xs sm:text-base font-bold text-slate-900 truncate">Staff & Roles</h1>
            <span className="hidden sm:inline text-xs text-slate-400 font-normal">(பணியாளர்கள் & அனுமதிகள்)</span>
          </div>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
            Manage showroom employee access, operational roles, and login credentials.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {isLimitReached && (
            <Link
              href="/dashboard/settings?tab=subscription"
              className="text-[10px] sm:text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span className="hidden sm:inline">Upgrade Plan</span>
            </Link>
          )}

          <Button
            onClick={() => setIsAddOpen(true)}
            disabled={isLimitReached}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 h-7.5 sm:h-9 px-2.5 sm:px-4 rounded-lg sm:rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff</span>
          </Button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Staff</div>
          <div className="text-sm sm:text-xl font-mono font-black text-slate-900 mt-0.5">{staffList.length}</div>
        </div>

        <div className="bg-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Plan Quota</div>
          <div className="text-sm sm:text-xl font-mono font-black text-slate-900 mt-0.5">
            <span className={isLimitReached ? 'text-amber-700' : 'text-emerald-700'}>{activeStaffCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-normal"> / {maxUsers} Active</span>
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Cashiers</div>
          <div className="text-sm sm:text-xl font-mono font-black text-slate-900 mt-0.5">
            {staffList.filter((s) => s.role === 'CASHIER').length}
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Managers & Owners</div>
          <div className="text-sm sm:text-xl font-mono font-black text-slate-900 mt-0.5">
            {staffList.filter((s) => s.role === 'MANAGER' || s.role === 'SHOP_OWNER').length}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
            <p className="text-xs sm:text-sm font-semibold text-slate-600">No staff members added yet</p>
            <p className="text-[11px] text-slate-400">Click &ldquo;Add Staff Member&rdquo; above to create employee logins.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[580px]">
              <thead className="bg-slate-50 text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 sm:px-4 py-2.5 sm:py-3 font-bold sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                    Staff Member
                  </th>
                  <th className="px-3.5 sm:px-4 py-2.5 sm:py-3 font-bold">Mobile / Login</th>
                  <th className="px-3.5 sm:px-4 py-2.5 sm:py-3 font-bold">Role</th>
                  <th className="px-3.5 sm:px-4 py-2.5 sm:py-3 font-bold">Bills Recorded</th>
                  <th className="px-3.5 sm:px-4 py-2.5 sm:py-3 font-bold">Status</th>
                  <th className="px-3.5 sm:px-4 py-2.5 sm:py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((staff) => {
                  const isOwner = staff.role === 'SHOP_OWNER';
                  return (
                    <tr key={staff.id} className="group hover:bg-slate-50/70 transition-colors">
                      {/* Name — sticky on mobile so name stays anchored */}
                      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 font-semibold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center gap-2">
                          <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-lg bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[11px] sm:text-xs shrink-0 border border-amber-200">
                            {staff.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-900">{staff.name}</span>
                              {staff.id === currentUser?.id && (
                                <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            {staff.email && (
                              <div className="text-[10px] sm:text-[11px] text-slate-400 font-normal truncate max-w-[140px] sm:max-w-[200px]">
                                {staff.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 font-mono text-xs sm:text-sm font-semibold text-slate-800">
                        {staff.phone}
                      </td>

                      {/* Role */}
                      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3">
                        <span
                          className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                            staff.role === 'SHOP_OWNER'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : staff.role === 'MANAGER'
                              ? 'bg-purple-50 text-purple-900 border-purple-200'
                              : 'bg-blue-50 text-blue-900 border-blue-200'
                          }`}
                        >
                          {staff.role === 'SHOP_OWNER' && '👑'}
                          {staff.role === 'MANAGER' && '🛡️'}
                          {staff.role === 'CASHIER' && '💳'}
                          <span>{staff.role.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Activity */}
                      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-700">
                        <span className="font-bold font-mono text-slate-900">{staff._count?.createdBills ?? 0}</span>
                        <span className="text-[10px] sm:text-[11px] text-slate-400"> bills</span>
                      </td>

                      {/* Status */}
                      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 uppercase ${
                            staff.is_active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}
                        >
                          {staff.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 text-right">
                        {isOwner ? (
                          <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Owner
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={toggleStatusMutation.isPending}
                            onClick={() => toggleStatusMutation.mutate(staff.id)}
                            className={`h-7 sm:h-7.5 px-2 sm:px-2.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors border cursor-pointer ${
                              staff.is_active
                                ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                                : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            <Power className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                            <span>{staff.is_active ? 'Deactivate' : 'Activate'}</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Permissions Guide Card */}
      <div className="bg-slate-50/90 rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-4 text-xs text-slate-600 space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
          <span>Role Permissions Overview (அணுகல் அனுமதிகள்)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] sm:text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1">
              <span>👑 Shop Owner</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Full showroom control, accounting, gold schemes, staff management, shop profile, and plan subscriptions.
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-purple-900 flex items-center gap-1">
              <span>🛡️ Manager</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Access to sales reports, vault inventory movements, loan management, and bill generation.
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-blue-900 flex items-center gap-1">
              <span>💳 Cashier</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Quick bill creation, customer search, accepting cash/UPI/card payments, and scheme deposits.
            </p>
          </div>
        </div>
      </div>

      {/* Add Staff Dialog Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] p-4 sm:p-5 max-h-[90dvh] overflow-y-auto rounded-2xl">
          <DialogHeader className="border-b border-slate-100 pb-2.5">
            <DialogTitle className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              Add New Staff Member
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                Staff Full Name *
              </Label>
              <Input
                placeholder="e.g. Suresh Kumar"
                value={form.name}
                className={inputClass}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                10-Digit Mobile Number (Login ID) *
              </Label>
              <Input
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                maxLength={10}
                className={inputClass}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                Login Password *
              </Label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                className={inputClass}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                Role Permission *
              </Label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full h-9 sm:h-10 px-3 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer"
              >
                <option value="CASHIER">CASHIER (Bills, Payments & Scheme)</option>
                <option value="MANAGER">MANAGER (Reports, Inventory, Loans & Bills)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Email Address (Optional)
              </Label>
              <Input
                type="email"
                placeholder="e.g. suresh@example.com"
                value={form.email}
                className={inputClass}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2 flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-8.5 sm:h-9 text-xs font-bold rounded-xl flex-1 sm:flex-initial"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addStaffMutation.isPending}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-8.5 sm:h-9 px-4 text-xs rounded-xl shadow-xs flex-1 sm:flex-initial cursor-pointer"
              >
                {addStaffMutation.isPending ? 'Saving...' : 'Add Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
