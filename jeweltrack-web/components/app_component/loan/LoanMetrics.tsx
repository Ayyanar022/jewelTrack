'use client';

import { Coins, Scale } from 'lucide-react';

interface LoanMetricsProps {
  stats: {
    active_loans_count?: number;
    total_principal_lent?: number;
    monthly_accruing_interest?: number;
    total_gold_weight_grams?: number;
    total_silver_weight_grams?: number;
  } | null;
  period: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
  onPeriodChange: (p: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH') => void;
}

export default function LoanMetrics({ stats, period, onPeriodChange }: LoanMetricsProps) {
  return (
    <div className="space-y-3">
      {/* Period Filter Tabs */}
      <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <span>Overview Period:</span>
        </div>
        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'TODAY', label: 'Today' },
            { id: 'WEEK', label: 'This Week' },
            { id: 'MONTH', label: 'This Month' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriodChange(p.id as any)}
              className={`px-3 py-1 rounded-md transition-all ${
                period === p.id
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Pledges */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-gold flex items-center justify-center font-black">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">Active Pledges</div>
            <div className="text-xl font-black text-slate-900">{stats?.active_loans_count ?? 0} Loans</div>
          </div>
        </div>

        {/* Principal Lent */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-lg">
            ₹
          </div>
          <div>
            <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">Principal Lent (அசல்)</div>
            <div className="text-xl font-black text-emerald-800">
              ₹{(stats?.total_principal_lent ?? 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Monthly Accruing Interest */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-lg">
            %
          </div>
          <div>
            <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">Monthly Interest</div>
            <div className="text-xl font-black text-blue-800">
              ₹{(stats?.monthly_accruing_interest ?? 0).toLocaleString('en-IN')}/mo
            </div>
          </div>
        </div>

        {/* Safe Gold & Silver Vault Weights */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Safe Vault Weights</span>
            <Scale className="w-4 h-4 text-gold" />
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="font-bold text-amber-900 flex items-center gap-1">
              <span>🪙 Gold:</span>
            </span>
            <span className="font-black text-slate-900 text-sm">
              {(stats?.total_gold_weight_grams ?? 0).toFixed(2)} g
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <span>⚪ Silver:</span>
            </span>
            <span className="font-black text-slate-900 text-sm">
              {(stats?.total_silver_weight_grams ?? 0).toFixed(2)} g
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
