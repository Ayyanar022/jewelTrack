'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Plus,
  Search,
  BookOpen,
  Coins,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Calendar,
  Loader2,
  Phone,
  MapPin,
} from 'lucide-react';

import SchemeMetrics from '@/components/app_component/scheme/SchemeMetrics';
import CreateSchemeModal from '@/components/app_component/scheme/CreateSchemeModal';
import DepositSchemeModal from '@/components/app_component/scheme/DepositSchemeModal';
import ViewPassbookModal from '@/components/app_component/scheme/ViewPassbookModal';
import RedeemSchemeModal from '@/components/app_component/scheme/RedeemSchemeModal';
import LockedFeatureView from '@/components/app_component/common/LockedFeatureView';

export default function GoldSchemePage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REDEEMED' | 'CLOSED'>('ACTIVE');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForDeposit, setSelectedForDeposit] = useState<any>(null);
  const [selectedForPassbook, setSelectedForPassbook] = useState<string | null>(null);
  const [selectedForRedeem, setSelectedForRedeem] = useState<any>(null);

  // Check subscription feature permission for gold_schemes
  const { data: subscription } = useQuery({
    queryKey: ['shop-current-subscription'],
    queryFn: async () => {
      const res = await api.get('/subscription/current');
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  // 1. Fetch Summary Stats
  const { data: stats } = useQuery({
    queryKey: ['scheme-stats'],
    queryFn: async () => {
      const res = await api.get('/scheme/stats');
      return res.data;
    },
  });

  // 2. Fetch Schemes List
  const { data: schemeData, isLoading } = useQuery<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    today_rate_22k: number;
  }>({
    queryKey: ['schemes', statusFilter, search, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await api.get(`/scheme?${params.toString()}`);
      return res.data;
    },
  });

  // 3. Fetch Shop Profile (for print header)
  const { data: shopProfile } = useQuery({
    queryKey: ['shop-profile'],
    queryFn: async () => {
      const res = await api.get('/settings/shop-profile');
      return res.data;
    },
  });

  const schemes = schemeData?.items || [];
  const totalCount = schemeData?.total || 0;
  const totalPages = schemeData?.totalPages || 1;
  const todayRate22k = schemeData?.today_rate_22k || stats?.currentRate22k || 0;

  if (subscription?.plan?.features && subscription.plan.features.gold_schemes === false) {
    return (
      <LockedFeatureView
        title="Gold Savings Schemes (தங்க சேமிப்பு திட்டம்)"
        badge="Chits & Accumulation Module"
        requiredPlan="PRO"
        description="Launch custom monthly gold accumulation schemes for your customers with automated 916 conversion, physical passbook booklet printing, and WhatsApp share."
        benefits={[
          'Automated daily 916 gold gram calculation on every cash installment',
          'Physical Passbook Booklet and Statement printer support',
          'One-click WhatsApp passbook statement sharing with customers',
          'Flexible gold or jewellery redemption with customer gain calculation',
        ]}
      />
    );
  }

  return (
    <div className="space-y-3.5 pb-8">
      {/* 1. Sleek, Premium Header (Warm Luxury Gold Palette) */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center font-black shadow-2xs shrink-0 border border-amber-300/80">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
            <h1 className="text-xs sm:text-base font-bold text-slate-900 tracking-tight truncate">
              Gold Scheme <span className="text-xs font-semibold text-slate-400 font-sans hidden sm:inline">(தங்க சேமிப்பு)</span>
            </h1>
            {todayRate22k > 0 && (
              <span className="text-[10px] sm:text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-full inline-flex items-center gap-1 font-mono shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>22K:</span>
                <strong className="text-slate-900">₹{todayRate22k.toLocaleString('en-IN')}/g</strong>
              </span>
            )}
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-[11px] sm:text-xs h-7.5 sm:h-8 px-2.5 sm:px-3.5 rounded-lg shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1" />
          <span className="hidden sm:inline">Open New Scheme</span>
          <span className="sm:hidden">New Scheme</span>
        </Button>
      </div>

      {/* 2. Compact 1-Row Metrics Ribbon */}
      <SchemeMetrics stats={stats || null} />

      {/* 3. Unified Table Card with Integrated Toolbar Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-h-[360px] flex flex-col justify-between">
        {/* Integrated Filter & Search Toolbar */}
        <div className="p-2 sm:px-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Mobile Status Dropdown (Gives room to breathe on mobile phones) */}
          <div className="sm:hidden w-full relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full h-8 pl-3 pr-8 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 appearance-none shadow-2xs cursor-pointer"
            >
              <option value="ACTIVE">Active Schemes {stats?.activeAccounts !== undefined ? `(${stats.activeAccounts})` : ''}</option>
              <option value="REDEEMED">Redeemed Schemes {stats?.redeemedAccounts !== undefined ? `(${stats.redeemedAccounts})` : ''}</option>
              <option value="CLOSED">Closed Schemes</option>
              <option value="ALL">All Schemes {stats?.totalAccounts !== undefined ? `(${stats.totalAccounts})` : ''}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none text-slate-500" />
          </div>

          {/* Desktop Status Filter Tabs */}
          <div className="hidden sm:inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold w-auto">
            {[
              { id: 'ACTIVE', label: 'Active', count: stats?.activeAccounts },
              { id: 'REDEEMED', label: 'Redeemed', count: stats?.redeemedAccounts },
              { id: 'CLOSED', label: 'Closed' },
              { id: 'ALL', label: 'All', count: stats?.totalAccounts },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setPage(1);
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-md transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-amber-950 shadow-xs font-bold border-b-2 border-amber-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      statusFilter === tab.id
                        ? 'bg-amber-100 text-amber-900 border border-amber-300/60'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <Input
              placeholder="Search customer, phone, or A/c #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 text-xs border-slate-200 bg-white rounded-lg w-full focus-visible:ring-amber-500"
            />
          </div>
        </div>

        {/* Table / Cards Content */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2 flex-1">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            <span className="text-xs">Loading gold savings accounts...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Mobile View: High-Density Responsive Cards (< md) */}
            <div className="block md:hidden flex-1 min-h-[260px]">
              {schemes.length === 0 ? (
                <div className="py-16 px-4 text-center text-slate-400 flex flex-col items-center justify-center min-h-[240px]">
                  <Coins className="w-10 h-10 text-amber-400/80 mb-2 stroke-1" />
                  <div className="text-sm font-bold text-slate-700">No Gold Schemes Found</div>
                  <div className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">
                    {search
                      ? `No schemes match "${search}". Try clearing search.`
                      : 'Enroll your customers into monthly gold savings plans.'}
                  </div>
                  {!search && (
                    <Button
                      onClick={() => setIsCreateOpen(true)}
                      size="sm"
                      className="mt-3.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                    >
                      + Open First Scheme
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {schemes.map((acc: any) => {
                    const goldGrams = acc.total_gold_grams || 0;
                    const redeemedGrams = acc.total_gold_redeemed || 0;
                    const totalSavedGrams = Math.round((goldGrams + redeemedGrams) * 1000) / 1000;
                    const cashPaid = acc.total_cash_deposited || 0;
                    const marketVal = acc.current_market_value || 0;

                    return (
                      <div key={acc.id} className="p-3 space-y-2.5 bg-white hover:bg-slate-50/50 transition-colors">
                        {/* Top Row: Account & Date & Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {acc.account_number}
                            </span>
                            <Badge
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 ${
                                acc.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : acc.status === 'REDEEMED'
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {acc.status}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(acc.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate text-xs capitalize">
                              {acc.customer?.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <span>{acc.customer?.phone || '—'}</span>
                              {acc.customer?.village && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{acc.customer?.village}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 3-Column Mini Metrics Tile */}
                        <div className="grid grid-cols-3 gap-1.5 bg-slate-50/80 p-2 rounded-lg border border-slate-100 text-center">
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">916 Gold</div>
                            <div className="font-mono font-black text-amber-950 text-xs mt-0.5">
                              {goldGrams.toFixed(3)} <span className="text-[10px] font-bold text-amber-700">g</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Paid</div>
                            <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                              ₹{cashPaid.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Valuation</div>
                            <div className="font-mono font-black text-emerald-900 text-xs mt-0.5">
                              ₹{marketVal.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                          {acc.status === 'ACTIVE' && (
                            <button
                              onClick={() => setSelectedForDeposit(acc)}
                              className="flex-1 h-7 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-[0.98]"
                            >
                              <Coins size={13} className="text-amber-200" />
                              <span>Deposit</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedForPassbook(acc.id)}
                            className="flex-1 h-7 px-2 rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <BookOpen size={13} className="text-slate-500" />
                            <span>Passbook</span>
                          </button>

                          {acc.status === 'ACTIVE' && goldGrams > 0 && (
                            <button
                              onClick={() => setSelectedForRedeem(acc)}
                              className="h-7 px-2.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shrink-0"
                            >
                              <span>Redeem</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop View: Full Table (md+) Always Preserves Column Structure */}
            <div className="hidden md:block overflow-x-auto flex-1 min-h-[280px]">
              <table className="w-full text-xs text-left min-w-[700px] h-full">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3.5 w-28">Account #</th>
                    <th className="py-2.5 px-3.5 w-44">Customer</th>
                    <th className="py-2.5 px-3.5 text-right font-black text-slate-900">916 Gold Balance</th>
                    <th className="py-2.5 px-3.5 text-right font-bold text-slate-700">Cash Paid</th>
                    <th className="py-2.5 px-3.5 text-right font-bold text-emerald-800">
                      <span>Valuation</span>
                      {todayRate22k > 0 && (
                        <span className="block text-[9px] font-normal text-slate-400 font-mono">
                          @₹{todayRate22k.toLocaleString('en-IN')}/g
                        </span>
                      )}
                    </th>
                    <th className="py-2.5 px-3.5 text-center w-20">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schemes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-slate-400">
                        <Coins className="w-10 h-10 mx-auto text-amber-300/80 mb-2 stroke-1" />
                        <div className="text-sm font-bold text-slate-700">No Gold Schemes Found</div>
                        <div className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                          {search
                            ? `No schemes match "${search}". Try clearing search.`
                            : 'Click "Open New Gold Scheme" above to enroll your first customer.'}
                        </div>
                        {!search && (
                          <Button
                            onClick={() => setIsCreateOpen(true)}
                            size="sm"
                            className="mt-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                          >
                            + Open First Scheme
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    schemes.map((acc: any) => {
                      const goldGrams = acc.total_gold_grams || 0;
                      const redeemedGrams = acc.total_gold_redeemed || 0;
                      const totalSavedGrams = Math.round((goldGrams + redeemedGrams) * 1000) / 1000;
                      const cashPaid = acc.total_cash_deposited || 0;
                      const marketVal = acc.current_market_value || 0;
                      const gain = acc.customer_gain_amount || 0;

                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Account # & Date */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-900 font-mono text-xs">{acc.account_number}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(acc.created_at).toLocaleDateString('en-IN')}
                            </div>
                          </td>

                          {/* Customer Info (Clean & Space-conscious) */}
                          <td className="py-2.5 px-3.5">
                            <div className="font-bold text-slate-900 text-xs capitalize truncate max-w-[150px]">
                              {acc.customer?.name}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-medium">{acc.customer?.phone}</span>
                              {acc.customer?.village && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[90px]">{acc.customer?.village}</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* 916 Gold: Available, Total Saved & Redeemed */}
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 font-black text-amber-950 text-xs font-mono shadow-2xs">
                              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{goldGrams.toFixed(3)} g</span>
                              <span className="text-[9px] font-bold text-amber-800 uppercase tracking-tight">Available</span>
                            </div>

                            <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center justify-end gap-1.5">
                              <span>Total: <strong className="text-slate-700 font-mono">{totalSavedGrams.toFixed(3)}g</strong></span>
                              {redeemedGrams > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-purple-700 font-semibold font-mono">Redeemed: <strong>{redeemedGrams.toFixed(3)}g</strong></span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Cash Paid */}
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono">
                            <div className="font-bold text-slate-800">₹{cashPaid.toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-slate-400 font-sans">
                              {acc._count?.payments || 0} deposits
                            </div>
                          </td>

                          {/* Compact Valuation */}
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono">
                            <div className="font-black text-emerald-900">
                              ₹{marketVal.toLocaleString('en-IN')}
                            </div>
                            {gain > 0 && (
                              <div className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-0.5 font-sans">
                                <TrendingUp className="w-2.5 h-2.5" />
                                +₹{gain.toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                            <Badge
                              className={`text-[9px] font-bold uppercase px-2 py-0.2 ${
                                acc.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : acc.status === 'REDEEMED'
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {acc.status}
                            </Badge>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {acc.status === 'ACTIVE' && (
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedForDeposit(acc)}
                                  className="h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer"
                                >
                                  <Coins className="w-3 h-3 mr-1 text-amber-200" /> Deposit
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedForPassbook(acc.id)}
                                className="h-7 px-2.5 text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
                              >
                                <BookOpen className="w-3 h-3 mr-1 text-slate-500" /> Passbook
                              </Button>

                              {acc.status === 'ACTIVE' && goldGrams > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedForRedeem(acc)}
                                  className="h-7 px-2.5 text-xs font-bold text-purple-700 border-purple-300 hover:bg-purple-50 cursor-pointer"
                                >
                                  Redeem
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compact Pagination Bar */}
        {schemes.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-700">{schemes.length}</span> of{' '}
              <span className="font-bold text-slate-700">{totalCount}</span> accounts
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="font-bold text-slate-700 text-xs">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 px-2 text-xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateSchemeModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        todayRate22k={todayRate22k}
      />

      <DepositSchemeModal
        open={!!selectedForDeposit}
        onOpenChange={(open) => !open && setSelectedForDeposit(null)}
        account={selectedForDeposit}
        todayRate22k={todayRate22k}
      />

      <ViewPassbookModal
        open={!!selectedForPassbook}
        onOpenChange={(open) => !open && setSelectedForPassbook(null)}
        accountId={selectedForPassbook}
        shopProfile={shopProfile}
      />

      <RedeemSchemeModal
        open={!!selectedForRedeem}
        onOpenChange={(open) => !open && setSelectedForRedeem(null)}
        account={selectedForRedeem}
        todayRate22k={todayRate22k}
      />
    </div>
  );
}
