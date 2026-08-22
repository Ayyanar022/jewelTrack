'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Plan } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, Power, Check, Users, FileText, Building2, Sparkles, Loader2, ShieldCheck, Clock } from 'lucide-react';

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form state for Create / Edit
  const [form, setForm] = useState({
    name: '',
    price: '', // in Rupees for user input
    max_users: 1,
    max_invoices_per_month: '', // empty for unlimited
    max_branches: 1,
    note: '',
    features: {
      billing: true,
      gst_reports: true,
      inventory: false,
      gold_loans: false,
      multi_branch: false,
    },
  });

  // Fetch Global Default Trial Days
  const { data: trialDays = 14 } = useQuery<number>({
    queryKey: ['admin-trial-days'],
    queryFn: async () => {
      const res = await api.get('/subscription/config/trial-days');
      return res.data;
    },
  });

  // Fetch Global Default Trial Plan Tier (e.g. "PRO")
  const { data: trialPlan = 'PRO' } = useQuery<string>({
    queryKey: ['admin-trial-plan'],
    queryFn: async () => {
      const res = await api.get('/subscription/config/trial-plan');
      return res.data;
    },
  });

  // Update Trial Days Mutation
  const updateTrialDaysMutation = useMutation({
    mutationFn: async (days: number) => {
      return api.patch('/subscription/config/trial-days', { days });
    },
    onSuccess: (_, days) => {
      toast.success(`Default free trial updated to ${days} days!`);
      queryClient.invalidateQueries({ queryKey: ['admin-trial-days'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update trial days');
    },
  });

  // Update Trial Plan Mutation
  const updateTrialPlanMutation = useMutation({
    mutationFn: async (planName: string) => {
      return api.patch('/subscription/config/trial-plan', { plan_name: planName });
    },
    onSuccess: (_, planName) => {
      toast.success(`Default trial plan updated to ${planName}!`);
      queryClient.invalidateQueries({ queryKey: ['admin-trial-plan'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update trial plan');
    },
  });

  // Fetch all plans (including inactive ones)
  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const res = await api.get('/plans/all');
      return res.data;
    },
  });

  // Create Plan Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/plans', payload);
    },
    onSuccess: () => {
      toast.success('Plan created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create plan');
    },
  });

  // Update Plan Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.patch(`/plans/${id}`, data);
    },
    onSuccess: () => {
      toast.success('Plan updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      setEditingPlan(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update plan');
    },
  });

  // Toggle Plan Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (plan: Plan) => {
      return api.patch(`/plans/${plan.id}`, { is_active: !plan.is_active });
    },
    onSuccess: (_, plan) => {
      toast.success(`Plan ${plan.name} ${plan.is_active ? 'deactivated' : 'activated'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to change plan status');
    },
  });

  const resetForm = () => {
    setForm({
      name: '',
      price: '',
      max_users: 1,
      max_invoices_per_month: '',
      max_branches: 1,
      note: '',
      features: {
        billing: true,
        gst_reports: true,
        inventory: false,
        gold_loans: false,
        multi_branch: false,
      },
    });
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    const feats = (plan.features as any) || {};
    setForm({
      name: plan.name,
      price: String(plan.price / 100),
      max_users: plan.max_users,
      max_invoices_per_month: plan.max_invoices_per_month ? String(plan.max_invoices_per_month) : '',
      max_branches: plan.max_branches,
      note: plan.note || '',
      features: {
        billing: feats.billing ?? true,
        gst_reports: feats.gst_reports ?? true,
        inventory: feats.inventory ?? false,
        gold_loans: feats.gold_loans ?? false,
        multi_branch: feats.multi_branch ?? false,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const payload = {
      name: form.name.toUpperCase().trim(),
      price: Math.round(priceNum * 100), // convert to paise
      max_users: Number(form.max_users) || 1,
      max_invoices_per_month: form.max_invoices_per_month ? Number(form.max_invoices_per_month) : null,
      max_branches: Number(form.max_branches) || 1,
      note: form.note.trim() || null,
      features: form.features,
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <span>Subscription Plans</span>
            <Badge variant="outline" className="text-xs bg-slate-100 text-slate-800 border-slate-300">
              {plans.length} Plans
            </Badge>
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Configure pricing, quotas (max users, monthly bills), and feature permissions for SaaS tenants.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 shadow-sm h-10 px-5 rounded-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </Button>
      </div>

      {/* Free Trial Platform Settings Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">New Store Registration Trial Policy</h2>
          </div>
          <p className="text-xs text-slate-500">
            Configure the subscription tier and duration automatically assigned to newly registered jewellery stores.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          {/* Trial Plan Tier */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700">1. Assigned Trial Tier:</span>
            {['BASIC', 'PRO', 'ENTERPRISE'].map((planName) => {
              const isSelected = trialPlan === planName;
              return (
                <button
                  key={planName}
                  type="button"
                  disabled={updateTrialPlanMutation.isPending}
                  onClick={() => updateTrialPlanMutation.mutate(planName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {planName}
                </button>
              );
            })}
          </div>

          {/* Trial Duration */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700">2. Trial Duration:</span>
            {[7, 14, 30, 60, 90].map((days) => {
              const isSelected = trialDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  disabled={updateTrialDaysMutation.isPending}
                  onClick={() => updateTrialDaysMutation.mutate(days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {days === 30 ? '1 Month (30d)' : days === 90 ? '3 Months (90d)' : `${days} Days`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isPending = toggleStatusMutation.isPending;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  plan.is_active ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-75 bg-slate-50/50'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-300">
                      {plan.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold px-2 py-0.5 ${
                        plan.is_active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black font-mono text-slate-900">
                      ₹{(plan.price / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-medium text-slate-500">/ month</span>
                  </div>

                  {plan.note && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{plan.note}</p>}
                </div>

                {/* Card Limits */}
                <div className="p-5 space-y-3 bg-slate-50/50 flex-1">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Tenant Limits
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span className="flex items-center gap-2 text-slate-600 font-medium">
                      <Users className="w-4 h-4 text-slate-400" /> Max Staff Users:
                    </span>
                    <span className="font-bold text-slate-900 font-mono">{plan.max_users} users</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span className="flex items-center gap-2 text-slate-600 font-medium">
                      <FileText className="w-4 h-4 text-slate-400" /> Monthly Invoices:
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {plan.max_invoices_per_month ? `${plan.max_invoices_per_month} bills` : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span className="flex items-center gap-2 text-slate-600 font-medium">
                      <Building2 className="w-4 h-4 text-slate-400" /> Max Branches:
                    </span>
                    <span className="font-bold text-slate-900 font-mono">{plan.max_branches} branch</span>
                  </div>

                  {/* Feature Checklist */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Included Modules
                    </div>
                    {Object.entries(plan.features || {}).map(([key, enabled]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                            enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {enabled ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '×'}
                        </div>
                        <span className={enabled ? 'text-slate-800 font-bold' : 'text-slate-400 line-through'}>
                          {key.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(plan)}
                    className="flex-1 text-xs h-9 border-slate-300 hover:bg-slate-50 text-slate-800 font-bold cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                    Edit Plan
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => toggleStatusMutation.mutate(plan)}
                    className={`text-xs h-9 font-bold cursor-pointer ${
                      plan.is_active
                        ? 'text-rose-700 hover:bg-rose-50 hover:text-rose-800'
                        : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5 mr-1.5" />
                    {plan.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Plan Dialog */}
      <Dialog
        open={isCreateOpen || !!editingPlan}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingPlan(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-slate-800" />
              {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Subscription Plan'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Name & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-bold text-slate-800">Plan Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. ENTERPRISE"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 text-sm font-bold border-slate-300"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-bold text-slate-800">Monthly Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g. 1999"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="h-10 text-sm font-bold font-mono border-slate-300"
                  required
                />
              </div>
            </div>

            {/* Quotas */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="max_users" className="text-xs font-bold text-slate-800">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  min={1}
                  value={form.max_users}
                  onChange={(e) => setForm({ ...form, max_users: Number(e.target.value) || 1 })}
                  className="h-10 text-sm font-bold border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max_invoices" className="text-xs font-bold text-slate-800">Monthly Bills</Label>
                <Input
                  id="max_invoices"
                  type="number"
                  placeholder="Unlimited"
                  value={form.max_invoices_per_month}
                  onChange={(e) => setForm({ ...form, max_invoices_per_month: e.target.value })}
                  className="h-10 text-sm font-bold border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max_branches" className="text-xs font-bold text-slate-800">Branches</Label>
                <Input
                  id="max_branches"
                  type="number"
                  min={1}
                  value={form.max_branches}
                  onChange={(e) => setForm({ ...form, max_branches: Number(e.target.value) || 1 })}
                  className="h-10 text-sm font-bold border-slate-300"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <Label className="text-sm font-bold text-slate-800">Included Feature Permissions</Label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'billing', label: 'GST & Non-GST Billing' },
                  { key: 'gst_reports', label: 'Tax & GST Reports' },
                  { key: 'inventory', label: 'Safe Vault Inventory' },
                  { key: 'gold_loans', label: 'Gold & Silver Loans' },
                  { key: 'multi_branch', label: 'Multi-Branch Support' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={(form.features as any)[key]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          features: { ...form.features, [key]: e.target.checked },
                        })
                      }
                      className="rounded text-slate-900 w-4 h-4"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-sm font-bold text-slate-800">Description / Marketing Note</Label>
              <Input
                id="note"
                placeholder="e.g. Best for growing retail jewellery stores"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="h-10 text-sm border-slate-300"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingPlan(null);
                }}
                className="h-10 text-sm font-bold border-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-6 text-sm"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving Plan...'
                  : editingPlan
                  ? 'Update Plan'
                  : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
