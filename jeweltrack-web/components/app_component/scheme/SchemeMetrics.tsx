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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-3.5 sm:px-4 py-2.5 sm:py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2 sm:divide-x divide-slate-100">
      {/* 1. Active Accounts */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Coins className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Active Accounts
          </div>
          <div className="text-base font-black text-slate-900 leading-none mt-0.5">
            {stats?.activeAccounts ?? 0}{' '}
            <span className="text-xs font-semibold text-slate-400">
              / {stats?.totalAccounts ?? 0} total
            </span>
          </div>
        </div>
      </div>

      {/* 2. Total 916 Gold Held (Active Liability) */}
      <div className="flex items-center gap-3 px-2 lg:pl-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
            916 Gold Held (Liability)
          </div>
          <div className="text-base font-black text-amber-950 leading-none mt-0.5">
            {activeGrams.toFixed(3)}{' '}
            <span className="text-xs font-bold text-amber-700">grams</span>
          </div>
        </div>
      </div>

      {/* 3. Current Valuation @ Live 22K Rate */}
      <div className="flex items-center gap-3 px-2 lg:pl-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>Market Valuation</span>
            {currentRate > 0 && (
              <span className="text-[9px] bg-emerald-100/80 text-emerald-800 px-1 py-0.2 rounded font-black font-mono">
                @₹{currentRate}/g
              </span>
            )}
          </div>
          <div className="text-base font-black text-emerald-950 leading-none mt-0.5">
            ₹{marketVal.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* 4. Total Gold Redeemed or Total Cash */}
      <div className="flex items-center gap-3 px-2 lg:pl-4">
        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Gift className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-purple-800 font-bold uppercase tracking-wider">
            {redeemedGrams > 0 ? 'Gold Redeemed' : 'Cash Deposited'}
          </div>
          <div className="text-base font-black text-purple-950 leading-none mt-0.5">
            {redeemedGrams > 0 ? (
              <>
                {redeemedGrams.toFixed(3)}{' '}
                <span className="text-xs font-bold text-purple-700">grams</span>
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
