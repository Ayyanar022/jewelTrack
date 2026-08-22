'use client';

import Link from 'next/link';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { Coins, ArrowRight, Sparkles, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const { data: recentRate } = useQuery({
    queryKey: ['recent-rate'],
    queryFn: () => api.get('/rate/recent-rate').then((r) => r.data),
  });

  const { data: billsData } = useQuery({
    queryKey: ['bills'],
    queryFn: () => api.get('/bill/all?limit=5').then((r) => r.data),
  });

  const billList = Array.isArray(billsData) ? billsData : (billsData?.items || []);
  const totalBills = billsData?.total ?? billList.length;

  // Fetch Today's Gold Loan Summary
  const { data: todayLoanStats } = useQuery({
    queryKey: ['loan-stats-today'],
    queryFn: () => api.get('/loan/stats?period=TODAY').then((r) => r.data),
  });

  // Fetch Subscription & Quotas
  const { data: subscription } = useQuery({
    queryKey: ['shop-current-subscription'],
    queryFn: () => api.get('/subscription/current').then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const stats = [
    { label: "Today's Bills", value: totalBills, sub: 'total created' },
    { label: '22K Rate', value: recentRate?.rate_22k ? `₹${recentRate.rate_22k.toLocaleString('en-IN')}` : '—', sub: 'per gram' },
    { label: '18K Rate', value: recentRate?.rate_18k ? `₹${recentRate.rate_18k.toLocaleString('en-IN')}` : '—', sub: 'per gram' },
    { label: 'Silver Rate', value: recentRate?.rate_silver ? `₹${recentRate.rate_silver.toLocaleString('en-IN')}` : '—', sub: 'per gram' },
  ];

  const isTrial = subscription?.status === 'TRIAL';
  const isExpired = subscription?.is_expired;
  const daysLeft = subscription?.days_remaining ?? 0;
  const isExpiringSoon = !isTrial && !isExpired && daysLeft <= 10 && daysLeft > 0;
  const billsUsed = subscription?.usage?.monthly_bills_count ?? 0;
  const maxBills = subscription?.usage?.max_invoices_per_month ?? 0;
  const isBillsNearLimit = maxBills > 0 && billsUsed >= maxBills * 0.85;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome to JewelTrack</p>
      </div>

      {/* Subscription Expiry / Trial Notification Card for Store Owners */}
      {(isTrial || isExpired || isExpiringSoon || isBillsNearLimit) && subscription && (
        <div
          className={`border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
            isExpired
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : isExpiringSoon || isBillsNearLimit
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
                isExpired
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {isExpired ? <AlertCircle className="w-5 h-5" /> : isTrial ? <Sparkles className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span>{subscription.plan?.name || 'Subscription Plan'}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isExpired
                      ? 'bg-rose-200 text-rose-900'
                      : isTrial
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {isExpired ? 'Expired' : isTrial ? 'Free Trial' : 'Active Plan'}
                </span>
              </div>
              <div className="text-sm font-semibold mt-0.5">
                {isExpired ? (
                  <span>Your subscription period has expired. Renew your plan to continue uninterrupted billing & inventory.</span>
                ) : isTrial ? (
                  <span>
                    Free trial active: <strong>{daysLeft} days remaining</strong> (Valid until {new Date(subscription.current_period_end).toLocaleDateString('en-IN')})
                  </span>
                ) : (
                  <span>
                    Valid until <strong>{new Date(subscription.current_period_end).toLocaleDateString('en-IN')}</strong> ({daysLeft} days left) · Monthly Bills: <strong>{billsUsed}/{maxBills || 'Unlimited'}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/settings?tab=subscription"
            className="inline-flex items-center gap-1.5 text-xs font-black bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-xs transition-all self-start sm:self-auto flex-shrink-0 cursor-pointer"
          >
            <span>{isExpired ? 'Renew Plan Now' : isTrial ? 'Upgrade Plan' : 'Renew / Upgrade'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-2xl font-black text-slate-900 mb-1">{s.value}</div>
            <div className="text-xs text-slate-400 font-medium">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Today's Gold Loan Overview Tile */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-gold flex items-center justify-center font-black">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Today&apos;s Gold / Silver Loans (இன்றைய அடகு)</span>
              <span className="bg-amber-500/20 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                Live
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5 flex items-center gap-3">
              <span>{todayLoanStats?.active_loans_count ?? 0} Pledges</span>
              <span className="text-sm font-semibold text-slate-500">•</span>
              <span className="text-emerald-800">
                ₹{(todayLoanStats?.total_principal_lent ?? 0).toLocaleString('en-IN')} Lent
              </span>
              <span className="text-sm font-semibold text-slate-500">•</span>
              <span className="text-xs font-bold text-amber-900">
                🪙 {(todayLoanStats?.total_gold_weight_grams ?? 0).toFixed(2)}g Pure Gold
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/loan"
          className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 hover:text-amber-950 bg-white border border-amber-300 px-4 py-2 rounded-xl shadow-2xs transition-all hover:bg-amber-50 self-start sm:self-auto"
        >
          <span>Open Loan Desk</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Recent Bills */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-foreground">Recent Bills</h2>
          <Link href="/dashboard/billing/estimate" className="text-xs font-bold text-gold hover:underline">
            View All Bills
          </Link>
        </div>
        {billList.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No bills yet — create your first bill
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-600 uppercase">
              <tr>
                <th className="text-left px-5 py-3">Bill Number</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Total Amount</th>
                <th className="text-left px-5 py-3">Payable</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {billList.slice(0, 5).map((b: any) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-foreground">{b.bill_number}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">₹{Number(b.total_amount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3 font-semibold text-foreground">₹{Number(b.payableAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/billing/${b.id}`} className="text-xs font-bold text-gold hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}