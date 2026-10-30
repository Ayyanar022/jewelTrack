'use client';

import { Sparkles, Coins, CheckCircle2, Gift } from 'lucide-react';

interface SchemeMetricsProps {
  stats: {
    totalAccounts?: number;
    activeAccounts?: number;
    redeemedAccounts?: number;
    totalActiveCash?: number;
    totalActiveGrams?: number;
    totalRedeemedGrams?: number;
    currentRate22k?: number;
    currentMarketValue?: number;
  } | null;
}

export default function SchemeMetrics({ stats }: SchemeMetricsProps) {
  const activeGrams = stats?.totalActiveGrams ?? 0;
  const activeCash = stats?.totalActiveCash ?? 0;
  const marketVal = stats?.currentMarketValue ?? 0;
  const currentRate = stats?.currentRate22k ?? 0;
  const redeemedGrams = stats?.totalRedeemedGrams ?? 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-2 sm:p-3.5 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-0 sm:divide-x sm:divide-slate-200">
      {/* 1. Active Accounts */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0 sm:px-3 bg-slate-50/70 sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
          <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
            Active Accounts
          </div>
          <div className="text-xs sm:text-base font-black text-slate-900 leading-none mt-0.5 truncate">
            {stats?.activeAccounts ?? 0}{' '}
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">
              / {stats?.totalAccounts ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Total 916 Gold Held (Active Liability) */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0 sm:px-3 lg:pl-4 bg-slate-50/70 sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-700 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
            916 Gold Held
          </div>
          <div className="text-xs sm:text-base font-black text-slate-900 leading-none mt-0.5 truncate font-mono">
            {activeGrams.toFixed(3)}{' '}
            <span className="text-[10px] sm:text-xs font-bold text-amber-700">g</span>
          </div>
        </div>
      </div>

      {/* 3. Current Valuation @ Live 22K Rate */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0 sm:px-3 lg:pl-4 bg-slate-50/70 sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 truncate">
            <span>Valuation</span>
            {currentRate > 0 && (
              <span className="text-[8px] sm:text-[9px] bg-emerald-100/80 text-emerald-800 px-1 py-0.2 rounded font-black font-mono">
                @₹{currentRate}
              </span>
            )}
          </div>
          <div className="text-xs sm:text-base font-black text-slate-900 leading-none mt-0.5 truncate font-mono">
            ₹{marketVal.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* 4. Total Gold Redeemed or Total Cash */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0 sm:px-3 lg:pl-4 bg-slate-50/70 sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 border border-indigo-200/70 text-indigo-700 flex items-center justify-center shrink-0">
          <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
            {redeemedGrams > 0 ? 'Redeemed' : 'Deposited'}
          </div>
          <div className="text-xs sm:text-base font-black text-slate-900 leading-none mt-0.5 truncate font-mono">
            {redeemedGrams > 0 ? (
              <>
                {redeemedGrams.toFixed(3)}{' '}
                <span className="text-[10px] sm:text-xs font-bold text-indigo-700">g</span>
              </>
            ) : (
              `₹${activeCash.toLocaleString('en-IN')}`
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
