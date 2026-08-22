'use client';

import Link from 'next/link';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { Coins, ArrowRight, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { data: recentRate } = useQuery({
    queryKey: ['recent-rate'],
    queryFn: () => api.get('/rate/recent-rate').then((r) => r.data),
  });

  const { data: bills } = useQuery({
    queryKey: ['bills'],
    queryFn: () => api.get('/bill/all').then((r) => r.data),
  });

  // Fetch Today's Gold Loan Summary
  const { data: todayLoanStats } = useQuery({
    queryKey: ['loan-stats-today'],
    queryFn: () => api.get('/loan/stats?period=TODAY').then((r) => r.data),
  });

  const stats = [
    { label: "Today's Bills", value: bills?.length ?? 0, sub: 'total created' },
    { label: '22K Rate', value: recentRate ? `₹${recentRate.rate_22k}` : '—', sub: 'per gram' },
    { label: '18K Rate', value: recentRate ? `₹${recentRate.rate_18k}` : '—', sub: 'per gram' },
    { label: 'Silver Rate', value: recentRate ? `₹${recentRate.rate_silver}` : '—', sub: 'per gram' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome to JewelTrack</p>
      </div>

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
        {bills?.length === 0 || !bills ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No bills yet — create your first bill
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-600 uppercase">
              <tr>
                <th className="text-left px-5 py-3">Bill No</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills?.slice(0, 5).map((bill: any) => (
                <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-slate-900">{bill.bill_number}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{bill.customer?.name}</td>
                  <td className="px-5 py-3 font-bold text-slate-900">₹{bill.total_amount.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        bill.is_gst_bill
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {bill.is_gst_bill ? 'GST' : 'Normal'}
                    </span>
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