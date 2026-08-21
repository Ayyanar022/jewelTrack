'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Sparkles,
  Check,
  Zap,
  Users,
  FileText,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Crown,
  Loader2,
} from 'lucide-react';

export default function ShopSubscription() {
  const queryClient = useQueryClient();
  const { user, setShop, shop } = useAuthStore();

  const [selectedDuration, setSelectedDuration] = useState<number>(12); // Default to 12 months (Best Value)
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<any>(null);

  // 1. Fetch current subscription & usage stats
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['shop-current-subscription'],
    queryFn: async () => {
      const res = await api.get('/subscription/current');
      return res.data;
    },
  });

  // 2. Fetch pricing table with duration discounts
  const { data: pricingPlans = [], isLoading: plansLoading } = useQuery<any[]>({
    queryKey: ['pricing-table'],
    queryFn: async () => {
      const res = await api.get('/subscription/pricing-table');
      return res.data;
    },
  });

  // Upgrade Plan Mutation
  const upgradeMutation = useMutation({
    mutationFn: async ({ planId, duration }: { planId: string; duration: number }) => {
      return api.post('/subscription', {
        plan_id: planId,
        duration_months: duration,
      });
    },
    onSuccess: (res) => {
      toast.success(`Successfully upgraded to ${res.data?.plan?.name || 'new'} plan!`);
      queryClient.invalidateQueries({ queryKey: ['shop-current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['shop-staff'] });
      setSelectedPlanForUpgrade(null);
      if (res.data?.plan) {
        setShop({
          ...(shop as any),
          subscription_plan: res.data.plan.name,
          subscription_status: 'ACTIVE',
        });
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to upgrade plan');
    },
  });

  const durationButtons = [
    { duration: 1, label: '1 Month', badge: null },
    { duration: 3, label: '3 Months', badge: '5% OFF' },
    { duration: 6, label: '6 Months', badge: '10% OFF' },
    { duration: 12, label: 'Annual (12 Months)', badge: '20% OFF 🌟' },
  ];

  if (subLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
      </div>
    );
  }

  const isTrial = subscription?.status === 'TRIAL';
  const isExpired = subscription?.is_expired;
  const daysLeft = subscription?.days_remaining ?? 0;
  const usage = subscription?.usage;

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4">
      {/* 1. Current Active Plan Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-8 lg:p-10 shadow-2xl border border-gold/40">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-gold/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs uppercase tracking-widest font-extrabold text-gold px-3.5 py-1.5 rounded-full bg-gold/20 border border-gold/40">
                Current Subscription
              </span>
              <Badge
                variant="outline"
                className={`text-xs font-bold px-3.5 py-1 uppercase tracking-wide ${
                  isTrial
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                    : isExpired
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/50'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                }`}
              >
                {isTrial ? 'Free Trial' : subscription?.status}
              </Badge>
            </div>

            <div className="flex items-baseline gap-4 flex-wrap">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <Crown className="w-8 h-8 text-gold inline flex-shrink-0" />
                <span>{subscription?.plan?.name || 'PRO'} Plan</span>
              </h2>
              <span className="text-base text-slate-300 font-medium">
                {isTrial
                  ? '(14-Day Full Feature Preview)'
                  : `₹${(subscription?.amount_paid / 100).toLocaleString('en-IN')} paid`}
              </span>
            </div>

            {/* Countdown / Expiration */}
            <div className="flex items-center gap-2.5 text-base text-slate-200 pt-1">
              <Clock className="w-5 h-5 text-gold flex-shrink-0" />
              {isExpired ? (
                <span className="text-rose-300 font-bold">Subscription Expired. Please choose a plan below to continue.</span>
              ) : isTrial ? (
                <span>
                  <strong className="text-gold font-extrabold text-lg">{daysLeft} Days</strong> remaining in your free trial (Valid till:{' '}
                  <strong>
                    {new Date(subscription?.current_period_end).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                  )
                </span>
              ) : (
                <span>
                  Active until{' '}
                  <strong>
                    {new Date(subscription?.current_period_end).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </span>
              )}
            </div>
          </div>

          {/* Live Usage Meters */}
          {usage && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/15 min-w-[320px]">
              <div className="space-y-1.5">
                <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gold" /> Staff Logins
                </div>
                <div className="text-xl font-extrabold text-white">
                  {usage.users_count} <span className="text-slate-400 text-sm font-normal">/ {usage.max_users}</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gold h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usage.users_count / usage.max_users) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gold" /> Month Bills
                </div>
                <div className="text-xl font-extrabold text-white">
                  {usage.monthly_bills_count}{' '}
                  <span className="text-slate-400 text-sm font-normal">/ {usage.max_invoices_per_month ?? '∞'}</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gold h-full rounded-full transition-all"
                    style={{
                      width: usage.max_invoices_per_month
                        ? `${Math.min(100, (usage.monthly_bills_count / usage.max_invoices_per_month) * 100)}%`
                        : '25%',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gold" /> Showroom
                </div>
                <div className="text-xl font-extrabold text-white">{usage.max_branches} Branch</div>
                <div className="text-xs text-emerald-400 font-bold">✓ Included</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Pricing & Upgrade Section Header */}
      <div className="text-center space-y-4 pt-2">
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
          Choose a Subscription Plan
        </h3>
        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Unlock multi-staff billing, comprehensive GST reporting, and automated inventory management.
        </p>

        {/* Duration / Billing Cycle Switcher */}
        <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-300 shadow-inner mt-4">
          {durationButtons.map(({ duration, label, badge }) => {
            const isSelected = selectedDuration === duration;
            return (
              <button
                key={duration}
                type="button"
                onClick={() => setSelectedDuration(duration)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-md border border-slate-300 scale-102 ring-1 ring-gold/40'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{label}</span>
                {badge && (
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
        {pricingPlans.map((plan) => {
          const pricingOption =
            plan.pricing_options?.find((opt: any) => opt.duration_months === selectedDuration) ||
            plan.pricing_options?.[0];

          const isCurrentPlan = subscription?.plan?.name === plan.name;
          const isPopular = plan.name === 'PRO';

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-md hover:shadow-2xl ${
                isPopular
                  ? 'border-gold shadow-gold/20 ring-2 ring-gold/50 scale-102 z-10'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              {/* Popular Ribbon */}
              {isPopular && (
                <div className="bg-gradient-to-r from-gold via-amber-500 to-gold text-white text-xs font-black uppercase tracking-widest text-center py-2 shadow-sm">
                  ★ Most Popular for Showrooms
                </div>
              )}

              <div className="p-8 space-y-6 flex-1 flex flex-col">
                {/* Plan Header */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black uppercase tracking-wide text-slate-900">
                      {plan.name} Plan
                    </span>
                    {isCurrentPlan && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold uppercase px-2.5 py-1">
                        Active Plan
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed min-h-[44px]">{plan.note}</p>
                </div>

                {/* Pricing & Strikethrough Display */}
                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    {/* Strikethrough regular price if discount applies */}
                    {pricingOption?.discount_percent > 0 && (
                      <span className="text-lg text-slate-400 line-through font-bold">
                        ₹{(plan.base_price_inr).toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-4xl font-black text-slate-900 tracking-tight">
                      ₹{pricingOption?.monthly_equivalent_inr?.toLocaleString('en-IN') || plan.base_price_inr}
                    </span>
                    <span className="text-sm font-bold text-slate-500">/ month</span>
                  </div>

                  {/* Total billed & Savings */}
                  {selectedDuration > 1 && (
                    <div className="text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span>Billed ₹{pricingOption?.offer_price_inr?.toLocaleString('en-IN')} for {selectedDuration} mos</span>
                      {pricingOption?.savings_inr > 0 && (
                        <span className="text-emerald-800 font-black bg-emerald-100 px-2 py-0.5 rounded text-xs">
                          Save ₹{pricingOption.savings_inr.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quotas & Features */}
                <div className="space-y-4 pt-4 border-t border-slate-200 flex-1">
                  <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Plan Specifications & Quotas
                  </div>

                  <div className="space-y-3 text-sm text-slate-800">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gold flex-shrink-0" />
                      <span>
                        <strong>{plan.max_users}</strong> Staff Login {plan.max_users > 1 ? 'Accounts' : 'Account'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gold flex-shrink-0" />
                      <span>
                        <strong>{plan.max_invoices_per_month ?? 'Unlimited'}</strong> Monthly Invoices
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gold flex-shrink-0" />
                      <span>
                        <strong>{plan.max_branches}</strong> Showroom Branch
                      </span>
                    </div>

                    {/* Features checklist */}
                    {Object.entries(plan.features || {}).map(([key, enabled]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                            enabled ? 'bg-emerald-100 text-emerald-800 font-black' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {enabled ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '×'}
                        </div>
                        <span className={enabled ? 'text-slate-800 font-semibold' : 'text-slate-400 line-through'}>
                          {key.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade Button */}
                <div className="pt-6">
                  <Button
                    type="button"
                    onClick={() =>
                      setSelectedPlanForUpgrade({
                        ...plan,
                        selectedOption: pricingOption,
                      })
                    }
                    className={`w-full h-12 text-sm font-extrabold tracking-wide transition-all shadow-md ${
                      isPopular
                        ? 'bg-gold hover:bg-gold/90 text-white shadow-gold/30 hover:scale-102'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{isCurrentPlan ? 'Renew / Change Duration' : `Upgrade to ${plan.name}`}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Upgrade Confirmation Dialog */}
      <Dialog open={!!selectedPlanForUpgrade} onOpenChange={(open) => !open && setSelectedPlanForUpgrade(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-gold" />
              Confirm Plan Activation
            </DialogTitle>
          </DialogHeader>

          {selectedPlanForUpgrade && (
            <div className="space-y-5 pt-3">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-base">
                  <span className="text-slate-600 font-medium">Selected Plan:</span>
                  <span className="font-extrabold text-slate-900 uppercase text-lg">{selectedPlanForUpgrade.name}</span>
                </div>
                <div className="flex justify-between items-center text-base">
                  <span className="text-slate-600 font-medium">Duration:</span>
                  <span className="font-bold text-slate-900">
                    {selectedPlanForUpgrade.selectedOption.duration_months} Month(s)
                  </span>
                </div>
                {selectedPlanForUpgrade.selectedOption.discount_percent > 0 && (
                  <div className="flex justify-between items-center text-base text-emerald-700 font-bold">
                    <span>Discount Applied ({selectedPlanForUpgrade.selectedOption.discount_percent}%):</span>
                    <span>-₹{selectedPlanForUpgrade.selectedOption.savings_inr.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-lg font-black text-slate-900">
                  <span>Total Payable:</span>
                  <span className="text-gold text-2xl">
                    ₹{selectedPlanForUpgrade.selectedOption.offer_price_inr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-sm text-slate-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
                ⚡ <strong>Instant Activation:</strong> Your shop subscription and feature quotas will be updated
                immediately upon confirmation.
              </div>

              <DialogFooter className="pt-3 flex gap-2">
                <Button variant="outline" className="h-11 px-5 text-sm font-semibold" onClick={() => setSelectedPlanForUpgrade(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={upgradeMutation.isPending}
                  onClick={() =>
                    upgradeMutation.mutate({
                      planId: selectedPlanForUpgrade.id,
                      duration: selectedPlanForUpgrade.selectedOption.duration_months,
                    })
                  }
                  className="bg-gold hover:bg-gold/90 text-white font-extrabold h-11 px-6 text-sm shadow-md"
                >
                  {upgradeMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Activating...
                    </span>
                  ) : (
                    'Activate Subscription'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
