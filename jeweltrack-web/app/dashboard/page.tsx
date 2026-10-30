'use client';

import Link from 'next/link';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import {
  Coins,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Clock,
  Receipt,
  Plus,
  TrendingUp,
  ChevronRight,
  FileText,
} from 'lucide-react';

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
    {
      label: "Today's Bills",
      value: totalBills,
      sub: 'invoices created',
      icon: <Receipt className="w-4 h-4 text-slate-700" />,
      accent: 'border-slate-200 bg-white',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      label: '22K Gold Rate',
      value: recentRate?.rate_22k ? `₹${recentRate.rate_22k.toLocaleString('en-IN')}` : '—',
      sub: 'per gram (916)',
      icon: <TrendingUp className="w-4 h-4 text-amber-600" />,
      accent: 'border-amber-200 bg-amber-50/30',
      badgeColor: 'bg-amber-100 text-amber-900',
    },
    {
      label: '18K Gold Rate',
      value: recentRate?.rate_18k ? `₹${recentRate.rate_18k.toLocaleString('en-IN')}` : '—',
      sub: 'per gram (750)',
      icon: <Coins className="w-4 h-4 text-amber-700" />,
      accent: 'border-amber-100 bg-white',
      badgeColor: 'bg-amber-50 text-amber-800',
    },
    {
      label: 'Silver Rate',
      value: recentRate?.rate_silver ? `₹${recentRate.rate_silver.toLocaleString('en-IN')}` : '—',
      sub: 'per gram (pure)',
      icon: <Sparkles className="w-4 h-4 text-slate-500" />,
      accent: 'border-slate-200 bg-white',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
  ];

  const isTrial = subscription?.status === 'TRIAL';
  const isExpired = subscription?.is_expired;
  const daysLeft = subscription?.days_remaining ?? 0;
  const isExpiringSoon = !isTrial && !isExpired && daysLeft <= 10 && daysLeft > 0;
  const billsUsed = subscription?.usage?.monthly_bills_count ?? 0;
  const maxBills = subscription?.usage?.max_invoices_per_month ?? 0;
  const isBillsNearLimit = maxBills > 0 && billsUsed >= maxBills * 0.85;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto pb-8">
      {/* Executive Welcome & Mobile Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-white px-3 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xs sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
            <span>Store Dashboard</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded-md">
              Overview
            </span>
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5 font-medium">
            Welcome to JewelTrack · Live POS & Jewellery Ledger
          </p>
        </div>

        {/* Quick Launch Buttons (Touch-friendly, compact & sleek for mobile counters) */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none py-0.5 -mx-1 px-1">
          <Link
            href="/dashboard/billing/new"
            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[10.5px] sm:text-xs font-bold h-6.5 sm:h-8 px-2 sm:px-3 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
            <span>New Bill</span>
          </Link>
          <Link
            href="/dashboard/loan"
            className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10.5px] sm:text-xs font-bold h-6.5 sm:h-8 px-2 sm:px-3 rounded-lg transition-all whitespace-nowrap shrink-0"
          >
            <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-700" />
            <span>Gold Loan</span>
          </Link>
          <Link
            href="/dashboard/rate"
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[10.5px] sm:text-xs font-bold h-6.5 sm:h-8 px-2 sm:px-3 rounded-lg transition-all whitespace-nowrap shrink-0"
          >
            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600" />
            <span>Today&apos;s Rate</span>
          </Link>
        </div>
      </div>

      {/* Subscription Expiry / Trial Notification Card for Store Owners */}
      {(isTrial || isExpired || isExpiringSoon || isBillsNearLimit) && subscription && (
        <div
          className={`border rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs ${
            isExpired
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : isExpiringSoon || isBillsNearLimit
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
                isExpired
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {isExpired ? <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : isTrial ? <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> : <Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 flex-wrap">
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
              <div className="text-xs sm:text-sm font-semibold mt-0.5 leading-relaxed">
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
            className="inline-flex items-center justify-center gap-1.5 text-xs font-black bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all w-full sm:w-auto shrink-0 cursor-pointer text-center"
          >
            <span>{isExpired ? 'Renew Plan Now' : isTrial ? 'Upgrade Plan' : 'Renew / Upgrade'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Top Stat Cards (Clean 2-col on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`border rounded-xl p-2.5 sm:p-4 shadow-xs transition-all hover:shadow-sm ${s.accent}`}
          >
            <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-1.5">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 truncate">
                {s.label}
              </span>
              <span className={`p-1 rounded-md shrink-0 ${s.badgeColor}`}>
                {s.icon}
              </span>
            </div>
            <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight tabular-nums truncate">
              {s.value}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-normal truncate mt-0.5">
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Today's Gold Loan Overview Tile */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-300/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center font-black shrink-0 shadow-xs">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-800" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
              <span>Today&apos;s Gold / Silver Loans</span>
              <span className="bg-amber-500/20 text-amber-950 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">
                Live
              </span>
            </div>
            {/* Responsive Metrics Bar */}
            <div className="mt-1.5 grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-4 text-xs">
              <div className="bg-white/80 border border-amber-200/80 rounded-md p-1.5 sm:p-0 sm:bg-transparent sm:border-0 text-center sm:text-left">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold block sm:inline sm:mr-1">
                  Active:
                </span>
                <span className="font-black text-slate-900 font-mono text-[11px] sm:text-xs">
                  {todayLoanStats?.active_loans_count ?? 0}
                </span>
              </div>
              <div className="bg-white/80 border border-amber-200/80 rounded-md p-1.5 sm:p-0 sm:bg-transparent sm:border-0 text-center sm:text-left">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold block sm:inline sm:mr-1">
                  Lent:
                </span>
                <span className="font-black text-emerald-800 font-mono text-[11px] sm:text-xs">
                  ₹{(todayLoanStats?.total_principal_lent ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white/80 border border-amber-200/80 rounded-md p-1.5 sm:p-0 sm:bg-transparent sm:border-0 text-center sm:text-left">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold block sm:inline sm:mr-1">
                  Pure Wt:
                </span>
                <span className="font-black text-amber-900 font-mono text-[11px] sm:text-xs">
                  {(todayLoanStats?.total_gold_weight_grams ?? 0).toFixed(2)}g
                </span>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/loan"
          className="inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold text-amber-950 hover:text-amber-900 bg-white border border-amber-300 h-7.5 sm:h-8.5 px-3 rounded-lg shadow-2xs transition-all hover:bg-amber-50 w-full sm:w-auto shrink-0"
        >
          <span>Open Loan Desk</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-800" />
        </Link>
      </div>

      {/* Recent Bills (Clean Mobile Cards on Small Screens, Full Table on Tablets/Desktop) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
              Recent Bills
            </h2>
          </div>
          <Link
            href="/dashboard/billing/estimate"
            className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {billList.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs sm:text-sm text-slate-500">
            No bills yet — create your first sales bill
          </div>
        ) : (
          <>
            {/* Mobile View: High-Density Responsive Bill Cards (< sm) */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {billList.slice(0, 5).map((b: any) => (
                <Link
                  key={b.id}
                  href={`/dashboard/billing/${b.id}`}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">
                        {b.bill_number}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(b.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 truncate">
                      {b.customer?.name || 'Walk-in Customer'}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-xs font-black font-mono text-slate-900">
                        ₹{Number(b.payableAmount || b.total_amount || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {b.is_gst_bill ? 'GST Bill' : 'Estimate'}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Tablet & Desktop View: Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 sm:px-5 py-3">Bill Number</th>
                    <th className="px-4 sm:px-5 py-3">Date</th>
                    <th className="px-4 sm:px-5 py-3">Customer</th>
                    <th className="px-4 sm:px-5 py-3 text-right">Total Amount</th>
                    <th className="px-4 sm:px-5 py-3 text-right">Payable</th>
                    <th className="px-4 sm:px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billList.slice(0, 5).map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 sm:px-5 py-3 font-mono font-bold text-slate-900">
                        {b.bill_number}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-slate-600 text-xs font-mono">
                        {new Date(b.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-slate-800 font-medium text-xs">
                        {b.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-right font-mono text-slate-600 text-xs">
                        ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-right font-mono font-black text-slate-900">
                        ₹{Number(b.payableAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-center">
                        <Link
                          href={`/dashboard/billing/${b.id}`}
                          className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 inline-block transition-colors"
                        >
                          View Bill
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}