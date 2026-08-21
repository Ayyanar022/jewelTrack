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
  Check,
  Users,
  FileText,
  Building2,
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
    { duration: 12, label: 'Annual (12 Mos)', badge: '20% OFF 🌟' },
  ];

  if (subLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  const isTrial = subscription?.status === 'TRIAL';
  const isExpired = subscription?.is_expired;
  const daysLeft = subscription?.days_remaining ?? 0;
  const usage = subscription?.usage;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* 1. Compact Active Subscription Status Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-5 shadow-md border border-gold/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-gold inline flex-shrink-0" />
              <span>{subscription?.plan?.name || 'PRO'} Plan</span>
            </h2>
            <Badge
              variant="outline"
              className={`text-xs font-bold px-2.5 py-0.5 uppercase ${
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

          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <Clock className="w-4 h-4 text-gold flex-shrink-0" />
            {isExpired ? (
              <span className="text-rose-300 font-bold">Subscription Expired. Choose a plan below to continue.</span>
            ) : isTrial ? (
              <span>
                <strong className="text-gold font-bold">{daysLeft} Days</strong> left in free trial (Valid till:{' '}
                {new Date(subscription?.current_period_end).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                )
              </span>
            ) : (
              <span>
                Valid till{' '}
                {new Date(subscription?.current_period_end).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {/* Compact Usage Meters */}
        {usage && (
          <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl border border-white/10 text-xs flex-wrap">
            <div>
              <span className="text-slate-400">Staff: </span>
              <strong className="text-white font-bold">{usage.users_count} / {usage.max_users}</strong>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400">Bills/mo: </span>
              <strong className="text-white font-bold">{usage.monthly_bills_count} / {usage.max_invoices_per_month ?? '∞'}</strong>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400">Branch: </span>
              <strong className="text-emerald-400 font-bold">{usage.max_branches} Included</strong>
            </div>
          </div>
        )}
      </div>

      {/* 2. Compact Billing Duration Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Choose Subscription Tier</h3>
          <p className="text-xs text-slate-500">Pick a billing cycle to preview duration discounts.</p>
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 flex-wrap">
          {durationButtons.map(({ duration, label, badge }) => {
            const isSelected = selectedDuration === duration;
            return (
              <button
                key={duration}
                type="button"
                onClick={() => setSelectedDuration(duration)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{label}</span>
                {badge && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
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

      {/* 3. Space-Optimized Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {pricingPlans.map((plan) => {
          const pricingOption =
            plan.pricing_options?.find((opt: any) => opt.duration_months === selectedDuration) ||
            plan.pricing_options?.[0];

          const isCurrentPlan = subscription?.plan?.name === plan.name;
          const isPopular = plan.name === 'PRO';

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                isPopular
                  ? 'border-gold shadow-gold/15 ring-1 ring-gold/40'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {isPopular && (
                <div className="bg-gradient-to-r from-gold via-amber-500 to-gold text-white text-[11px] font-bold uppercase tracking-wider text-center py-1">
                  ★ Recommended for Showrooms
                </div>
              )}

              <div className="p-5 space-y-4 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-base font-black uppercase tracking-wide text-slate-900">
                    {plan.name}
                  </span>
                  {isCurrentPlan && (
                    <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold uppercase">
                      Current Plan
                    </Badge>
                  )}
                </div>

                {/* Price Display */}
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {pricingOption?.discount_percent > 0 && (
                      <span className="text-sm text-slate-400 line-through font-bold">
                        ₹{(plan.base_price_inr).toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-3xl font-black text-slate-900">
                      ₹{pricingOption?.monthly_equivalent_inr?.toLocaleString('en-IN') || plan.base_price_inr}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/ mo</span>
                  </div>

                  {selectedDuration > 1 && (
                    <div className="text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 flex items-center justify-between">
                      <span>₹{pricingOption?.offer_price_inr?.toLocaleString('en-IN')} for {selectedDuration} mos</span>
                      {pricingOption?.savings_inr > 0 && (
                        <span className="text-emerald-700 font-bold text-[10px]">
                          Save ₹{pricingOption.savings_inr.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Specs Checklist */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 flex-1 text-xs text-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gold flex-shrink-0" />
                    <span><strong>{plan.max_users}</strong> Staff Login {plan.max_users > 1 ? 'Accounts' : 'Account'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold flex-shrink-0" />
                    <span><strong>{plan.max_invoices_per_month ?? 'Unlimited'}</strong> Monthly Bills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gold flex-shrink-0" />
                    <span><strong>{plan.max_branches}</strong> Branch</span>
                  </div>

                  {Object.entries(plan.features || {}).map(([key, enabled]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                          enabled ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {enabled ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '×'}
                      </div>
                      <span className={enabled ? 'text-slate-800 font-medium' : 'text-slate-400 line-through'}>
                        {key.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Upgrade Button */}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() =>
                      setSelectedPlanForUpgrade({
                        ...plan,
                        selectedOption: pricingOption,
                      })
                    }
                    className={`w-full h-10 text-xs font-bold shadow-xs ${
                      isPopular
                        ? 'bg-gold hover:bg-gold/90 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{isCurrentPlan ? 'Renew Duration' : `Upgrade to ${plan.name}`}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedPlanForUpgrade} onOpenChange={(open) => !open && setSelectedPlanForUpgrade(null)}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gold" />
              Confirm Plan Activation
            </DialogTitle>
          </DialogHeader>

          {selectedPlanForUpgrade && (
            <div className="space-y-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Plan:</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedPlanForUpgrade.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedPlanForUpgrade.selectedOption.duration_months} Month(s)
                  </span>
                </div>
                {selectedPlanForUpgrade.selectedOption.discount_percent > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{selectedPlanForUpgrade.selectedOption.savings_inr.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-extrabold text-base">
                  <span>Total:</span>
                  <span className="text-gold text-lg">
                    ₹{selectedPlanForUpgrade.selectedOption.offer_price_inr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <DialogFooter className="pt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPlanForUpgrade(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={upgradeMutation.isPending}
                  onClick={() =>
                    upgradeMutation.mutate({
                      planId: selectedPlanForUpgrade.id,
                      duration: selectedPlanForUpgrade.selectedOption.duration_months,
                    })
                  }
                  className="bg-gold hover:bg-gold/90 text-white font-bold px-5"
                >
                  {upgradeMutation.isPending ? 'Activating...' : 'Activate Subscription'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
