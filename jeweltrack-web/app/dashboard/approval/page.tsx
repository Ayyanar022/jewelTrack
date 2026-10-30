'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ClipboardList,
  Plus,
  Search,
  CornerDownLeft,
  Printer,
  Store,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  BarChart3,
  Receipt,
  Coins,
  History,
  Phone,
  MapPin,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import CreateApprovalModal from '@/components/app_component/approval/CreateApprovalModal';
import ReturnApprovalModal from '@/components/app_component/approval/ReturnApprovalModal';
import PrintApprovalSlipModal from '@/components/app_component/approval/PrintApprovalSlipModal';
import CreateDealerModal from '@/components/app_component/dealers/CreateDealerModal';
import RecordSettlementModal from '@/components/app_component/dealers/RecordSettlementModal';
import WeeklyStatementModal from '@/components/app_component/dealers/WeeklyStatementModal';
import DealerPaymentHistoryModal from '@/components/app_component/dealers/DealerPaymentHistoryModal';
import LockedFeatureView from '@/components/app_component/common/LockedFeatureView';

export function formatPurityTouch(purity?: string, touch?: number): string {
  const p = purity === 'K18' ? 'K18' : purity === 'K24' ? 'K24' : 'K22';
  const t = Number(touch) || 0;
  return `${p} - ${t}%`;
}

export default function ApprovalPage() {
  // Check subscription feature permission for dealer_approval
  const { data: subscription } = useQuery({
    queryKey: ['shop-current-subscription'],
    queryFn: async () => {
      const res = await api.get('/subscription/current');
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'APPROVALS' | 'DEALERS' | 'STATS'>('APPROVALS');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'dealers') setActiveTab('DEALERS');
      else if (tab === 'stats') setActiveTab('STATS');
    }
  }, []);

  // Approvals Tab Filters & Pagination
  const [search, setSearch] = useState('');
  const [dealerFilter, setDealerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [period, setPeriod] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Dealers Tab State
  const [dealerSearch, setDealerSearch] = useState('');
  const [dealerPage, setDealerPage] = useState(1);
  const [dealerLimit, setDealerLimit] = useState(15);

  // Modals state - Approvals
  const [createApprovalOpen, setCreateApprovalOpen] = useState(false);
  const [selectedMemoForReturn, setSelectedMemoForReturn] = useState<any>(null);
  const [selectedMemoForPrint, setSelectedMemoForPrint] = useState<any>(null);

  // Modals state - Dealers
  const [createDealerOpen, setCreateDealerOpen] = useState(false);
  const [dealerToEdit, setDealerToEdit] = useState<any>(null);
  const [selectedDealerForSettlement, setSelectedDealerForSettlement] = useState<any>(null);
  const [selectedDealerForStatement, setSelectedDealerForStatement] = useState<any>(null);
  const [selectedDealerForHistory, setSelectedDealerForHistory] = useState<any>(null);

  // Tab 3 Settlements State
  const [settlementSearch, setSettlementSearch] = useState('');
  const [settlementDealerFilter, setSettlementDealerFilter] = useState('ALL');

  // 1. Fetch Partner Dealers (for dropdown filter and Dealers Tab)
  const { data: allDealersData } = useQuery({
    queryKey: ['dealers-all'],
    queryFn: () => api.get('/dealer?limit=100').then((r) => r.data),
  });
  const allDealers = allDealersData?.items || [];

  // 2. Fetch Approval Memos
  const { data: memoData, isLoading: isApprovalsLoading } = useQuery({
    queryKey: ['approvals', search, dealerFilter, statusFilter, period, page, limit],
    queryFn: () =>
      api
        .get(
          `/approval/all?search=${encodeURIComponent(search)}&dealer_id=${dealerFilter}&status=${statusFilter}&period=${period}&page=${page}&limit=${limit}`,
        )
        .then((r) => r.data),
  });

  const memos = memoData?.items || [];
  const totalMemos = memoData?.total || 0;
  const totalPages = memoData?.totalPages || 1;

  // 3. Fetch Dealers Paginated (for Tab 2)
  const { data: dealersData, isLoading: isDealersLoading } = useQuery({
    queryKey: ['dealers', dealerSearch, dealerPage, dealerLimit],
    queryFn: () =>
      api
        .get(`/dealer?search=${encodeURIComponent(dealerSearch)}&page=${dealerPage}&limit=${dealerLimit}`)
        .then((r) => r.data),
  });
  const dealers = dealersData?.items || [];
  const totalDealers = dealersData?.total || 0;
  const totalDealerPages = dealersData?.totalPages || 1;

  // 4. Fetch Overall Approval & Pure Gold Stats
  const { data: stats } = useQuery({
    queryKey: ['approval-stats'],
    queryFn: () => api.get('/approval/stats').then((r) => r.data),
  });

  // 5. Fetch Settlements for Tab 3 (All partner metal receipts)
  const { data: allSettlementsData, isLoading: isSettlementsLoading } = useQuery({
    queryKey: ['all-dealer-settlements', settlementDealerFilter],
    queryFn: () =>
      api
        .get(
          `/dealer/settlements${
            settlementDealerFilter !== 'ALL' ? `?dealer_id=${settlementDealerFilter}` : ''
          }`,
        )
        .then((r) => r.data),
    enabled: activeTab === 'STATS',
  });
  const allSettlements = allSettlementsData || [];

  if (subscription?.plan?.features && subscription.plan.features.dealer_approval === false) {
    return (
      <LockedFeatureView
        title="Dealer Approvals & Jangat Memos"
        badge="B2B Consignment Module"
        requiredPlan="ENTERPRISE"
        description="Manage jewelry sent on approval or memo to dealers, karigars, and artisans with piece and weight tracking, reconciliation, and automated settlement."
        benefits={[
          'Official Jangat Outward memo generation with print slip',
          'Real-time weight and piece return reconciliation',
          'Automatic loss, stone, and net gold deduction ledger',
          'Complete B2B dealer partner balance & payment history',
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-7xl mx-auto px-0 pb-12">
      {/* 1. Header with Tab Navigation (Compact Space-Optimized) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 bg-white px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-800 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Approval Consignment</span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Peer-shop outward jewellery lending, inward returns & pure gold ledger
            </p>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="overflow-x-auto max-w-full pb-1">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-1 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setActiveTab('APPROVALS')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap ${
                activeTab === 'APPROVALS'
                  ? 'bg-white text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-700" />
              <span>1. Outward & Returns</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DEALERS')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap ${
                activeTab === 'DEALERS'
                  ? 'bg-white text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-700" />
              <span>2. Partner Shops / Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('STATS')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap ${
                activeTab === 'STATS'
                  ? 'bg-white text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-700" />
              <span>3. Metal Payments (வரவு விபரம்)</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: APPROVALS MAIN FAST ENTRY & DETAILED ITEMS TABLE
          ========================================================================= */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-3 animate-in fade-in-50 duration-200 ease-out min-h-[520px]">
          {/* Quick Filter & Search Bar (Compact Single-Row Toolbar) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            {/* Search + Partner Shop Dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-0 max-w-2xl">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search voucher #, jewel, partner..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8.5 h-8.5 text-xs font-medium border-slate-200 rounded-lg bg-slate-50/70 focus:bg-white"
                />
              </div>

              {/* Partner Shop Filter Dropdown */}
              <select
                value={dealerFilter}
                onChange={(e) => {
                  setDealerFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8.5 px-2.5 text-xs font-bold bg-slate-50/70 hover:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 max-w-[190px] cursor-pointer text-slate-800 shadow-2xs"
              >
                <option value="ALL">👥 All Partner Shops</option>
                {allDealers.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.shop_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Compact Filters & Action */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8.5 px-2.5 text-xs font-bold bg-slate-50/70 hover:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer text-slate-800 shadow-2xs"
              >
                <option value="ALL">Status: All</option>
                <option value="OUTWARD">Outward (Open)</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {/* Date Period Filter Dropdown */}
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  setPage(1);
                }}
                className="h-8.5 px-2.5 text-xs font-bold bg-slate-50/70 hover:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer text-slate-800 shadow-2xs"
              >
                <option value="ALL">Period: All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
              </select>

              {/* Compact Fast Action: + New Outward */}
              <Button
                onClick={() => setCreateApprovalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-8.5 px-3 text-xs flex items-center gap-1 shadow-2xs cursor-pointer rounded-lg shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ New Outward</span>
              </Button>
            </div>
          </div>

          {/* Main Items Table (Row per Jewel Sent) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {isApprovalsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : memos.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <ClipboardList className="w-10 h-10 mx-auto opacity-30 text-amber-700" />
                <p className="text-sm font-bold text-slate-700">No approval consignment items found</p>
                <p className="text-xs text-slate-400">Click &quot;+ New Outward&quot; to issue jewellery on approval.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[960px]">
                  <thead className="bg-slate-100 uppercase tracking-wider text-slate-700 font-bold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-2 py-2.5 w-10 text-center border-r border-slate-200">#</th>
                      <th className="px-2.5 py-2.5 w-24 border-r border-slate-200">Date</th>
                      <th className="px-3 py-2.5 w-40 min-w-[130px] border-r border-slate-200">Partner Shop</th>
                      <th className="px-3 py-2.5 min-w-[140px] border-r border-slate-200">Jewellery Item</th>
                      <th className="px-2 py-2.5 text-right w-22 font-bold text-slate-700 border-r border-slate-200">Hallmark</th>
                      <th className="px-3 py-2.5 text-right w-28 bg-slate-50/80 font-bold text-slate-900 border-r border-slate-200">Sent (Out)</th>
                      <th className="px-3 py-2.5 text-right w-28 bg-emerald-50/60 font-bold text-emerald-950 border-r border-slate-200">Returned (In)</th>
                      <th className="px-3 py-2.5 text-right w-28 font-bold text-slate-900 border-r border-slate-200">Sold / Balance</th>
                      <th className="px-3 py-2.5 text-right w-32 bg-amber-100/70 font-black text-amber-950 border-r border-slate-200">Pure Gold (g)</th>
                      <th className="px-2.5 py-2.5 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {memos.flatMap((memo: any, memoIdx: number) => {
                      const items = memo.items && memo.items.length > 0 ? memo.items : [null];

                      return items.map((it: any, itemIdx: number) => {
                        const isFirstOfMemo = itemIdx === 0;
                        const isMemoCompleted = memo.status === 'COMPLETED';
                        const isItemResolved = it?.status === 'RETURNED' || it?.status === 'SOLD';

                        const touchRate = Number(it?.touch) || 0;
                        const soldNetWeight = Number(it?.sold_net_weight) || 0;
                        const hallmarkVal = Number(it?.hallmark_charge) || 0;
                        const rawPure = (soldNetWeight * touchRate) / 100;
                        const calculatedPure = Number(
                          (
                            Number(it?.pure_weight) ||
                            (rawPure + (soldNetWeight > 0 ? hallmarkVal : 0)) ||
                            0
                          ).toFixed(3),
                        );

                        return (
                          <tr
                            key={`${memo.id}-${it?.id || itemIdx}`}
                            className={`hover:bg-amber-50/40 transition-colors ${
                              isFirstOfMemo && memoIdx > 0 ? 'border-t-2 border-slate-300' : ''
                            }`}
                          >
                            {/* Row Index */}
                            <td className="px-2 py-2.5 text-center font-bold text-slate-400 border-r border-slate-200">
                              {isFirstOfMemo ? memoIdx + 1 : ''}
                            </td>

                            {/* 1. Date Only (No voucher clutter) */}
                            <td className="px-2.5 py-2.5 border-r border-slate-200">
                              {isFirstOfMemo ? (
                                <span className="font-bold text-slate-800 text-xs whitespace-nowrap">
                                  {memo.date ? new Date(memo.date).toLocaleDateString('en-IN') : '—'}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">〃</span>
                              )}
                            </td>

                            {/* 2. Partner Shop Name Only */}
                            <td className="px-3 py-2.5 border-r border-slate-200">
                              {isFirstOfMemo ? (
                                <div className="font-black text-slate-950 text-sm">
                                  {memo.dealer?.shop_name}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">〃</span>
                              )}
                            </td>

                            {/* 3. Jewellery Item & Clean Purity Tag */}
                            <td className="px-3 py-2.5 border-r border-slate-200">
                              {it ? (
                                <div className="space-y-1">
                                  <div className="font-black text-slate-950 text-sm sm:text-base">
                                    {it.item_name}
                                  </div>
                                  <div>
                                    <span className="bg-amber-100 text-amber-950 font-black px-2 py-0.5 rounded text-xs border border-amber-300/80 inline-block">
                                      {formatPurityTouch(it.purity, it.touch)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No item details</span>
                              )}
                            </td>

                            {/* 4. Optional Hallmark Pure Gold (Low Space, Compact Column) */}
                            <td className="px-2 py-2.5 text-right border-r border-slate-200">
                              {it && Number(it.hallmark_charge) > 0 ? (
                                <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300/80 inline-block">
                                  +{Number(it.hallmark_charge).toFixed(3)} g
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-xs">—</span>
                              )}
                            </td>

                            {/* 5. Sent / Out (Big & Clear Numbers) */}
                            <td className="px-3 py-2.5 text-right bg-slate-50/50 border-r border-slate-200">
                              {it ? (
                                <div>
                                  <div className="font-mono font-black text-slate-950 text-sm sm:text-base">
                                    {Number(it.net_weight_out || it.gross_weight_out || 0).toFixed(3)} g
                                  </div>
                                  <div className="text-xs font-bold text-slate-500">
                                    {it.pieces_out} pcs
                                  </div>
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>

                            {/* 6. Returned / In (Big & Clear Green Numbers) */}
                            <td className="px-3 py-2.5 text-right bg-emerald-50/40 border-r border-slate-200">
                              {it && Number(it.net_weight_in) > 0 ? (
                                <div>
                                  <div className="font-mono font-black text-emerald-800 text-sm sm:text-base">
                                    {Number(it.net_weight_in).toFixed(3)} g
                                  </div>
                                  <div className="text-xs font-bold text-emerald-700">
                                    {it.pieces_in} pcs ret
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300 font-mono text-sm">—</span>
                              )}
                            </td>

                            {/* 7. Sold / Balance (Big & Clear Numbers) */}
                            <td className="px-3 py-2.5 text-right border-r border-slate-200">
                              {it && (Number(it.sold_net_weight) > 0 || isItemResolved) ? (
                                <div>
                                  <div className="font-mono font-black text-slate-950 text-sm sm:text-base">
                                    {Number(it.sold_net_weight || 0).toFixed(3)} g
                                  </div>
                                  <div className="text-xs font-bold text-slate-500">
                                    {it.sold_pieces || 0} pcs sold
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300 font-mono text-sm">—</span>
                              )}
                            </td>

                            {/* 8. Converted Pure Gold (Including Hallmark Pure Gold) */}
                            <td className="px-3 py-2.5 text-right bg-amber-50/50 border-r border-slate-200">
                              {it && calculatedPure > 0 ? (
                                <div className="font-mono font-black text-amber-950 text-sm sm:text-base bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-400 shadow-xs inline-block">
                                  +{calculatedPure.toFixed(3)} g
                                </div>
                              ) : (
                                <span className="text-slate-300 font-mono text-xs">0.000 g</span>
                              )}
                            </td>

                            {/* 9. Compact Action Column */}
                            <td className="px-2.5 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {!isMemoCompleted ? (
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedMemoForReturn(memo)}
                                    className="h-8 text-xs font-black bg-slate-900 hover:bg-slate-800 text-white gap-1 px-3 shadow-xs cursor-pointer rounded-lg"
                                  >
                                    <CornerDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Return</span>
                                  </Button>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={() => setSelectedMemoForPrint(memo)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Print memo slip"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalMemos} total vouchers)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs font-bold gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 text-xs font-bold gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PARTNER SHOPS & PURE GOLD LEDGER (DEALERS)
          ========================================================================= */}
      {activeTab === 'DEALERS' && (
        <div className="space-y-3 animate-in fade-in-50 duration-200 ease-out min-h-[520px]">
          {/* Dealers Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search partner shop, contact name, phone, city..."
                value={dealerSearch}
                onChange={(e) => {
                  setDealerSearch(e.target.value);
                  setDealerPage(1);
                }}
                className="pl-8.5 h-9 text-xs font-medium border-slate-300 rounded-lg"
              />
            </div>

            <Button
              onClick={() => {
                setDealerToEdit(null);
                setCreateDealerOpen(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 px-3.5 text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Add Partner Shop</span>
            </Button>
          </div>

          {/* Dealers Ledger Main Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {isDealersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : dealers.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <Store className="w-10 h-10 mx-auto opacity-30 text-amber-700" />
                <p className="text-sm font-bold text-slate-700">No partner dealers registered</p>
                <p className="text-xs text-slate-400">Click &quot;+ Add Partner Shop&quot; to register your first peer dealer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                  <thead className="bg-slate-100 uppercase tracking-wider text-slate-700 font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 w-8 text-center">#</th>
                      <th className="px-3 py-2.5 min-w-[180px]">Shop / Business Name</th>
                      <th className="px-3 py-2.5 min-w-[150px]">Contact Person & Phone</th>
                      <th className="px-3 py-2.5 text-center">On Approval</th>
                      <th className="px-3 py-2.5 text-right font-bold text-amber-900">Sold Pure (g)</th>
                      <th className="px-3 py-2.5 text-right font-bold text-emerald-800">Received Pure (g)</th>
                      <th className="px-3 py-2.5 text-right bg-amber-50/70 font-black text-amber-950">Net Pure Due</th>
                      <th className="px-3 py-2.5 text-center w-52">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dealers.map((d: any, idx: number) => {
                      const netDue = Number(d.stats?.net_pending_pure_gold ?? d.opening_pure_balance ?? 0);
                      const activePieces = Number(d.stats?.pending_outward_pieces ?? 0);
                      const activeWeight = Number(d.stats?.pending_outward_net_weight ?? 0);
                      const soldPure = Number(d.stats?.total_sold_pure_grams ?? 0);
                      const receivedPure = Number(d.stats?.total_pure_received ?? 0);

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-2.5 text-center font-bold text-slate-400">
                            {(dealerPage - 1) * dealerLimit + idx + 1}
                          </td>

                          <td className="px-3 py-2.5">
                            <div className="font-black text-slate-900 text-sm">{d.shop_name}</div>
                            {d.city && <div className="text-[11px] text-slate-500 font-medium">{d.city}</div>}
                          </td>

                          <td className="px-3 py-2.5">
                            <div className="font-bold text-slate-800">{d.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{d.phone}</div>
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            {activePieces > 0 ? (
                              <div className="inline-block bg-amber-50 border border-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold text-[11px]">
                                {activePieces} pcs • {activeWeight.toFixed(3)}g
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">None</span>
                            )}
                          </td>

                          <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-950">
                            +{soldPure.toFixed(3)} g
                          </td>

                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                            -{receivedPure.toFixed(3)} g
                          </td>

                          <td className="px-3 py-2.5 text-right bg-amber-50/50">
                            <span
                              className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg border shadow-xs inline-block ${
                                netDue > 0
                                  ? 'bg-amber-400 text-slate-950 border-amber-500 font-black'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {netDue.toFixed(3)} g
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => setSelectedDealerForSettlement(d)}
                                className="h-7 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1 px-2 cursor-pointer shadow-xs"
                                title="Record Pure Gold or Cash Settlement"
                              >
                                <Coins className="w-3 h-3 text-slate-950" />
                                <span>Settle</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedDealerForHistory(d)}
                                className="h-7 text-[11px] font-bold gap-1 px-2 text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer"
                                title="View Metal Payments Given by Partner"
                              >
                                <History className="w-3 h-3 text-emerald-600" />
                                <span>History</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedDealerForStatement(d)}
                                className="h-7 text-[11px] font-bold gap-1 px-2 text-slate-800 border-slate-300 hover:bg-slate-100 cursor-pointer"
                                title="View & Print Weekly Statement"
                              >
                                <Receipt className="w-3 h-3 text-amber-700" />
                                <span>Bill</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setDealerToEdit(d);
                                  setCreateDealerOpen(true);
                                }}
                                className="h-7 text-[11px] font-bold px-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                              >
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalDealerPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">
                  Page <strong>{dealerPage}</strong> of <strong>{totalDealerPages}</strong> ({totalDealers} dealers)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={dealerPage <= 1}
                    onClick={() => setDealerPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs font-bold gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={dealerPage >= totalDealerPages}
                    onClick={() => setDealerPage((p) => p + 1)}
                    className="h-8 text-xs font-bold gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: METAL PAYMENTS & SETTLEMENTS LEDGER (வரவு விபரம்)
          ========================================================================= */}
      {activeTab === 'STATS' && (
        <div className="space-y-3 animate-in fade-in-50 duration-200 ease-out min-h-[520px]">
          {/* Calm, Clean 3-Box Top Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Sold Pure Gold
              </span>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                +{stats?.total_pure_sold_all_time?.toFixed(3) || '0.000'} g
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">All outward sales touch converted</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Total Metal Received (Paid)
              </span>
              <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                -{stats?.total_pure_received_all_time?.toFixed(3) || '0.000'} g
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Pure gold metal credited to date</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Net Pure Balance Due
              </span>
              <div className="text-xl font-black text-amber-600 font-mono mt-1">
                {stats?.net_pending_pure_gold_overall?.toFixed(3) || '0.000'} g
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Total receivable from all partner shops</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search by partner shop or receipt #..."
                    value={settlementSearch}
                    onChange={(e) => setSettlementSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-white border-slate-200"
                  />
                </div>

                <select
                  value={settlementDealerFilter}
                  onChange={(e) => setSettlementDealerFilter(e.target.value)}
                  className="h-8 px-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                >
                  <option value="ALL">All Partner Shops</option>
                  {allDealers.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.shop_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Total Receipts: <strong className="text-slate-800">{(allSettlements || []).length}</strong>
              </div>
            </div>

            {/* Table */}
            {isSettlementsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
              </div>
            ) : (allSettlements || []).length === 0 ? (
              <div className="text-center py-14 text-slate-400 space-y-1">
                <Coins className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
                <p className="text-xs font-semibold text-slate-600">No payment records found</p>
                <p className="text-[11px] text-slate-400">
                  Payments recorded via Tab 2 &quot;Settle&quot; will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                  <thead className="bg-slate-100 uppercase tracking-wider text-slate-700 font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 w-8 text-center">#</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Partner Shop</th>
                      <th className="px-3 py-2.5">Receipt #</th>
                      <th className="px-3 py-2.5">Payment Mode</th>
                      <th className="px-3 py-2.5 text-right font-bold text-emerald-800 bg-emerald-50/50">
                        Pure Metal Received (g)
                      </th>
                      <th className="px-3 py-2.5">Remarks / Notes</th>
                      <th className="px-3 py-2.5 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(allSettlements || [])
                      .filter((s: any) => {
                        if (!settlementSearch) return true;
                        const q = settlementSearch.toLowerCase();
                        return (
                          s.settlement_number?.toLowerCase().includes(q) ||
                          s.dealer?.shop_name?.toLowerCase().includes(q) ||
                          s.dealer?.name?.toLowerCase().includes(q) ||
                          s.notes?.toLowerCase().includes(q)
                        );
                      })
                      .map((stl: any, idx: number) => {
                        const pureWeight = Number(stl.pure_weight_received || 0);
                        return (
                          <tr key={stl.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 py-2 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>

                            <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">
                              {new Date(stl.date).toLocaleDateString('en-IN')}
                            </td>

                            <td className="px-3 py-2">
                              <div className="font-bold text-slate-900">{stl.dealer?.shop_name || '—'}</div>
                              <div className="text-[11px] text-slate-500">
                                {stl.dealer?.name} {stl.dealer?.city ? `• ${stl.dealer.city}` : ''}
                              </div>
                            </td>

                            <td className="px-3 py-2 font-mono font-bold text-slate-800">
                              {stl.settlement_number}
                            </td>

                            <td className="px-3 py-2 text-slate-700">
                              {stl.payment_mode === 'PURE_GOLD'
                                ? 'Pure 24K Bar'
                                : stl.payment_mode === 'CASH'
                                ? 'Cash Settlement'
                                : 'Scrap Gold'}
                            </td>

                            <td className="px-3 py-2 text-right font-mono font-black text-emerald-700 bg-emerald-50/30">
                              -{pureWeight.toFixed(3)} g
                            </td>

                            <td className="px-3 py-2 text-slate-600 text-[11px]">
                              {stl.notes || '—'}
                            </td>

                            <td className="px-3 py-2 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (stl.dealer) setSelectedDealerForHistory(stl.dealer);
                                }}
                                className="h-6 text-[10px] font-bold px-2 text-slate-700 hover:text-slate-950 cursor-pointer"
                                title="View this partner's full payment history"
                              >
                                Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      {/* 1. Create Outward Memo */}
      <CreateApprovalModal
        open={createApprovalOpen}
        onOpenChange={setCreateApprovalOpen}
      />

      {/* 2. Process Return Modal */}
      {selectedMemoForReturn && (
        <ReturnApprovalModal
          open={!!selectedMemoForReturn}
          onOpenChange={(op) => !op && setSelectedMemoForReturn(null)}
          memo={selectedMemoForReturn}
        />
      )}

      {/* 3. Print Slip Modal */}
      {selectedMemoForPrint && (
        <PrintApprovalSlipModal
          open={!!selectedMemoForPrint}
          onOpenChange={(op) => !op && setSelectedMemoForPrint(null)}
          memo={selectedMemoForPrint}
        />
      )}

      {/* 4. Create / Edit Dealer Modal */}
      <CreateDealerModal
        open={createDealerOpen}
        onOpenChange={setCreateDealerOpen}
        dealerToEdit={dealerToEdit}
      />

      {/* 5. Record Settlement Modal */}
      {selectedDealerForSettlement && (
        <RecordSettlementModal
          open={!!selectedDealerForSettlement}
          onOpenChange={(op) => !op && setSelectedDealerForSettlement(null)}
          dealer={selectedDealerForSettlement}
        />
      )}

      {/* 6. Weekly Statement Modal */}
      {selectedDealerForStatement && (
        <WeeklyStatementModal
          open={!!selectedDealerForStatement}
          onOpenChange={(op) => !op && setSelectedDealerForStatement(null)}
          dealer={selectedDealerForStatement}
        />
      )}

      {/* 7. Partner Payment History Modal */}
      {selectedDealerForHistory && (
        <DealerPaymentHistoryModal
          open={!!selectedDealerForHistory}
          onOpenChange={(op) => !op && setSelectedDealerForHistory(null)}
          dealer={selectedDealerForHistory}
          onRecordNewPayment={() => setSelectedDealerForSettlement(selectedDealerForHistory)}
        />
      )}
    </div>
  );
}
