'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { User, Role } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Users, UserPlus, Shield, Power, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function StaffManagementPage() {
  const queryClient = useQueryClient();
  const { user: currentUser, shop } = useAuthStore();
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
      toast.error('Valid 10 digit phone number is required');
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

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header — Single compact row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            <h1 className="text-base font-bold text-slate-900">Staff & Roles</h1>
          </div>

          {/* Quota Badge */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-medium">Plan Quota:</span>
            <strong className={`font-bold ${isLimitReached ? 'text-amber-700' : 'text-emerald-700'}`}>
              {activeStaffCount} / {maxUsers} Active
            </strong>
          </div>

          {isLimitReached && (
            <Link
              href="/dashboard/settings?tab=subscription"
              className="text-xs font-bold text-amber-700 hover:text-amber-900 underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade to Add More</span>
            </Link>
          )}
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          disabled={isLimitReached}
          className="bg-gold hover:bg-gold/90 text-white font-semibold text-xs flex items-center gap-1.5 h-9 px-4 shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Staff Member</span>
        </Button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-gold" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-1">
            <Users className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-sm font-medium">No staff members added yet</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-bold">Staff Member</th>
                <th className="px-5 py-3 font-bold">Mobile / Login</th>
                <th className="px-5 py-3 font-bold">Role</th>
                <th className="px-5 py-3 font-bold">Bills Recorded</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((staff) => {
                const isOwner = staff.role === 'SHOP_OWNER';
                return (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {staff.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold">{staff.name}</span>
                        {staff.id === currentUser?.id && (
                          <span className="text-xs text-slate-400 font-normal">(You)</span>
                        )}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-3 font-mono text-sm font-medium text-slate-800">{staff.phone}</td>

                    {/* Role */}
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                          staff.role === 'SHOP_OWNER'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : staff.role === 'MANAGER'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {staff.role.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Activity */}
                    <td className="px-5 py-3 text-sm text-slate-700">
                      <span className="font-bold text-slate-900">{staff._count?.createdBills ?? 0}</span> bills
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold px-2.5 py-0.5 uppercase ${
                          staff.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-300'
                        }`}
                      >
                        {staff.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      {isOwner ? (
                        <span className="text-xs text-slate-400 font-semibold uppercase">Owner</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={toggleStatusMutation.isPending}
                          onClick={() => toggleStatusMutation.mutate(staff.id)}
                          className={`h-8 px-3 text-xs font-semibold rounded-lg ${
                            staff.is_active
                              ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                              : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5 mr-1" />
                          <span>{staff.is_active ? 'Deactivate' : 'Activate'}</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Dialog Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gold" />
              Add New Staff Member
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Staff Full Name</Label>
              <Input
                placeholder="e.g. Suresh Kumar"
                value={form.name}
                className="h-10 text-sm"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">10-Digit Mobile Number (Login ID)</Label>
              <Input
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                maxLength={10}
                className="h-10 text-sm"
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Login Password</Label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                className="h-10 text-sm"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Role Permission</Label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full h-10 px-3 rounded-lg border border-input text-sm bg-white font-medium focus:ring-1 focus:ring-gold"
              >
                <option value="CASHIER">CASHIER (Can create bills & accept payments)</option>
                <option value="MANAGER">MANAGER (Can view reports, inventory, & create bills)</option>
              </select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addStaffMutation.isPending}
                className="bg-gold hover:bg-gold/90 text-white font-bold px-5"
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
