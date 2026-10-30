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
      {/* Header Bar with Period Filter Tabs — Consistent with all modules */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 shrink-0" />
            <h1 className="text-xs sm:text-base font-bold text-slate-900 truncate">
              Gold Loans <span className="hidden sm:inline text-xs text-slate-400 font-normal">(தங்க அடகு)</span>
            </h1>
          </div>
        </div>
        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px] sm:text-xs font-semibold overflow-x-auto no-scrollbar scrollbar-none shrink-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'TODAY', label: 'Today' },
            { id: 'WEEK', label: 'Week' },
            { id: 'MONTH', label: 'Month' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriodChange(p.id as any)}
              className={`px-2 sm:px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
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

      {/* 4 Metrics Cards (2x2 on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Active Pledges */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black flex-shrink-0">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">Active Pledges</div>
            <div className="text-sm sm:text-xl font-black font-mono text-slate-900 truncate">{stats?.active_loans_count ?? 0} Loans</div>
          </div>
        </div>

        {/* Principal Lent */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm sm:text-base flex-shrink-0">
            ₹
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">Principal Lent</div>
            <div className="text-sm sm:text-xl font-black font-mono text-emerald-800 truncate">
              ₹{(stats?.total_principal_lent ?? 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Monthly Accruing Interest */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-sm sm:text-base flex-shrink-0">
            %
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">Monthly Interest</div>
            <div className="text-sm sm:text-xl font-black font-mono text-blue-800 truncate">
              ₹{(stats?.monthly_accruing_interest ?? 0).toLocaleString('en-IN')}/m
            </div>
          </div>
        </div>

        {/* Safe Gold & Silver Vault Weights */}
        <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">Safe Vault Wt</span>
            <Scale className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          </div>
          <div className="flex items-center justify-between text-xs pt-0.5 border-t border-slate-100">
            <span className="font-bold text-amber-900 text-[10px] sm:text-xs">🪙 Gold:</span>
            <span className="font-black font-mono text-slate-900 text-[11px] sm:text-sm">
              {(stats?.total_gold_weight_grams ?? 0).toFixed(2)} g
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 text-[10px] sm:text-xs">⚪ Silver:</span>
            <span className="font-black font-mono text-slate-900 text-[11px] sm:text-sm">
              {(stats?.total_silver_weight_grams ?? 0).toFixed(2)} g
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
