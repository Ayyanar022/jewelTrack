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
import { Users, UserPlus, Shield, KeyRound, Power, CheckCircle, Clock, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
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
    if (!/^\d{10}$/.test(form.phone)) {
      toast.error('Valid 10 digit phone number is required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    addStaffMutation.mutate(form);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Settings</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-gold" />
            <span>Staff & User Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Add cashiers and managers for multi-counter billing. All bills and cash entries will record who created them.
          </p>
        </div>

        {/* Plan Quota Badge */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-right">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Plan Staff Limit</div>
            <div className="text-sm font-bold text-slate-900">
              <span className={isLimitReached ? 'text-amber-600' : 'text-emerald-600'}>{activeStaffCount}</span> /{' '}
              {maxUsers} {maxUsers === 1 ? 'user' : 'users'}
            </div>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            disabled={isLimitReached}
            className="bg-gold hover:bg-gold/90 text-white font-medium flex items-center gap-2 shadow-sm h-10 px-5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </Button>
        </div>
      </div>

      {/* Quota warning alert if limit reached */}
      {isLimitReached && (
        <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              You have reached the maximum staff limit ({maxUsers} users) for your <strong>{shop?.subscription_plan}</strong> plan.
            </span>
          </div>
          <Link
            href="/dashboard/settings"
            className="font-semibold text-amber-700 hover:text-amber-900 underline ml-2 flex-shrink-0"
          >
            Upgrade Plan →
          </Link>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-gold" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No staff members added yet</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Staff Member</th>
                <th className="px-6 py-3.5 font-semibold">Phone / Login</th>
                <th className="px-6 py-3.5 font-semibold">Role</th>
                <th className="px-6 py-3.5 font-semibold">Activity Created</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((staff) => {
                const isOwner = staff.role === 'SHOP_OWNER';
                return (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gold/15 text-gold font-bold flex items-center justify-center text-xs">
                        {staff.name?.charAt(0)}
                      </div>
                      <div>
                        <div>{staff.name}</div>
                        {staff.id === currentUser?.id && (
                          <span className="text-[10px] text-muted-foreground font-normal">(You)</span>
                        )}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">{staff.phone}</td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
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
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div>
                        <strong>{staff._count?.createdBills ?? 0}</strong> bills created
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium ${
                          staff.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {staff.is_active ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {isOwner ? (
                        <span className="text-xs text-slate-400 font-medium">Owner</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={toggleStatusMutation.isPending}
                          onClick={() => toggleStatusMutation.mutate(staff.id)}
                          className={`text-xs h-8 ${
                            staff.is_active
                              ? 'text-destructive hover:bg-destructive/10'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5 mr-1" />
                          {staff.is_active ? 'Deactivate' : 'Activate'}
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

      {/* Add Staff Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gold" />
              Add Shop Staff Member
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g. Suresh Kumar"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">10-Digit Mobile Number (Login ID)</Label>
              <Input
                id="phone"
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Login Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Assign Role</Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="CASHIER">CASHIER (Can create bills & view live gold rate)</option>
                <option value="MANAGER">MANAGER (Can create bills, manage inventory, view reports)</option>
              </select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addStaffMutation.isPending}
                className="bg-gold hover:bg-gold/90 text-white font-medium px-5"
              >
                {addStaffMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                  </span>
                ) : (
                  'Add Staff Member'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
