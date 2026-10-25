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
      {/* 1. Sleek, Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Gold Savings Scheme <span className="text-xs font-semibold text-slate-500 font-sans">(தங்க சேமிப்பு)</span>
            </h1>
            {todayRate22k > 0 && (
              <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md hidden md:inline-flex items-center gap-1 font-mono">
                Today's 22K: ₹{todayRate22k.toLocaleString('en-IN')}/g
              </span>
            )}
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8.5 px-3.5 rounded-lg shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Open New Gold Scheme
        </Button>
      </div>

      {/* 2. Compact 1-Row Metrics Ribbon (Saves ~100px height) */}
      <SchemeMetrics stats={stats || null} />

      {/* 3. Unified Table Card with Integrated Toolbar Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Integrated Filter & Search Toolbar */}
        <div className="p-2.5 sm:px-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Status Filter Tabs with Counts */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold w-full md:w-auto">
            {[
              { id: 'ACTIVE', label: 'Active', count: stats?.activeAccounts },
              { id: 'REDEEMED', label: 'Redeemed', count: stats?.redeemedAccounts },
              { id: 'CLOSED', label: 'Closed' },
              { id: 'ALL', label: 'All Accounts', count: stats?.totalAccounts },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setPage(1);
                }}
                className={`flex-1 md:flex-none px-3 py-1 rounded-md transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      statusFilter === tab.id
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <Input
              placeholder="Search customer, phone, or A/c #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 text-xs border-slate-200 bg-white rounded-lg w-full"
            />
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Loading gold savings accounts...</span>
          </div>
        ) : schemes.length === 0 ? (
          <div className="py-14 text-center text-slate-400">
            <Coins className="w-9 h-9 mx-auto text-slate-300 mb-2 stroke-1" />
            <div className="text-sm font-bold text-slate-700">No Gold Schemes Found</div>
            <div className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
              {search
                ? `No schemes match "${search}". Try clearing search.`
                : 'Click "Open New Gold Scheme" above to enroll your first customer.'}
            </div>
            {!search && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                variant="outline"
                size="sm"
                className="mt-3 text-xs font-bold text-amber-700 border-amber-300"
              >
                + Open First Scheme
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3.5 w-28">Account #</th>
                  <th className="py-2.5 px-3.5 w-44">Customer</th>
                  <th className="py-2.5 px-3.5 text-right font-black text-amber-900">916 Gold Balance</th>
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
                {schemes.map((acc: any) => {
                  const goldGrams = acc.total_gold_grams || 0;
                  const redeemedGrams = acc.total_gold_redeemed || 0;
                  const totalSavedGrams = Math.round((goldGrams + redeemedGrams) * 1000) / 1000;
                  const cashPaid = acc.total_cash_deposited || 0;
                  const marketVal = acc.current_market_value || 0;
                  const gain = acc.customer_gain_amount || 0;

                  return (
                    <tr key={acc.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* Account # & Date */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="font-black text-amber-900 font-mono text-xs">{acc.account_number}</div>
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

                      {/* 916 Gold: Available (Highlighted), Total Saved & Redeemed */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        {/* Available Gold (Prominent Highlighted Font) */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-300 font-black text-amber-950 text-xs font-mono shadow-2xs">
                          <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{goldGrams.toFixed(3)} g</span>
                          <span className="text-[9px] font-bold text-amber-800 uppercase tracking-tight">Available</span>
                        </div>

                        {/* Total Saved & Redeemed Breakdown */}
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
                          className={`text-[9px] font-black uppercase px-2 py-0.2 ${
                            acc.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : acc.status === 'REDEEMED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {acc.status}
                        </Badge>
                      </td>

                      {/* Actions: Right-aligned flush with header */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Deposit Cash */}
                          {acc.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedForDeposit(acc)}
                              className="h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer"
                            >
                              <Coins className="w-3 h-3 mr-1" /> Deposit
                            </Button>
                          )}

                          {/* View Passbook */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedForPassbook(acc.id)}
                            className="h-7 px-2.5 text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3 mr-1 text-slate-500" /> Passbook
                          </Button>

                          {/* Redeem Gold */}
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
                })}
              </tbody>
            </table>
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
