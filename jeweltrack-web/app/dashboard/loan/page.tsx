'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  Plus,
  Search,
  Eye,
  Printer,
  Loader2,
  CreditCard,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import LoanMetrics from '@/components/app_component/loan/LoanMetrics';
import CreateLoanModal from '@/components/app_component/loan/CreateLoanModal';
import RepayLoanModal from '@/components/app_component/loan/RepayLoanModal';
import ViewLoanModal from '@/components/app_component/loan/ViewLoanModal';
import PrintLoanSlipModal from '@/components/app_component/loan/PrintLoanSlipModal';

export default function GoldLoanPage() {
  // Filters & State
  const [period, setPeriod] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal State
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<any>(null);
  const [selectedLoanForView, setSelectedLoanForView] = useState<any>(null);
  const [selectedLoanForPrint, setSelectedLoanForPrint] = useState<any>(null);

  // 1. Fetch Dashboard Stats with Period filter
  const { data: stats } = useQuery({
    queryKey: ['loan-stats', period],
    queryFn: async () => {
      const res = await api.get(`/loan/stats?period=${period}`);
      return res.data;
    },
  });

  // 2. Fetch Loans List with Pagination, Status, Search, and Period
  const { data: loanData, isLoading } = useQuery<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ['loans', statusFilter, search, period, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      if (period !== 'ALL') params.append('period', period);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await api.get(`/loan?${params.toString()}`);
      return res.data;
    },
  });

  const loans = loanData?.items || [];
  const totalCount = loanData?.total || 0;
  const totalPages = loanData?.totalPages || 1;
  const startIndex = (page - 1) * limit;

  // 3. Fetch Shop Profile for Print Header
  const { data: shopProfile } = useQuery({
    queryKey: ['shop-profile'],
    queryFn: async () => {
      const res = await api.get('/settings/shop-profile');
      return res.data;
    },
  });

  return (
    <div className="flex flex-col gap-3.5 max-w-7xl mx-auto px-0 pb-6">
      {/* 1. Metrics Summary Cards with Period Filter */}
      <LoanMetrics stats={stats} period={period} onPeriodChange={(p) => { setPeriod(p); setPage(1); }} />

      {/* 2. Compact Control Toolbar (Search, Status Filter & Action) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search loan #, customer, phone, village..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs font-medium border-slate-300 rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            {(['ACTIVE', 'CLOSED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Loans' : st === 'ACTIVE' ? 'Active Pledges' : 'Closed'}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setIsNewOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs h-9 px-4 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Pledge</span>
          </Button>
        </div>
      </div>

      {/* 3. Grid-Bordered Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Coins className="w-10 h-10 mx-auto opacity-30 text-gold" />
            <p className="text-sm font-bold text-slate-700">No Gold Loans found</p>
            <p className="text-xs text-slate-400">Click &quot;+ New Pledge&quot; to create your first jewellery loan.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse border border-slate-200">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs">
                  <tr>
                    <th className="px-3.5 py-2.5 w-10 text-center border border-slate-200">#</th>
                    <th className="px-3.5 py-2.5 border border-slate-200">Loan No</th>
                    <th className="px-3.5 py-2.5 border border-slate-200">Customer</th>
                    <th className="px-3.5 py-2.5 border border-slate-200">Pledged Items</th>
                    <th className="px-3.5 py-2.5 text-right border border-slate-200">Net Wt</th>
                    <th className="px-3.5 py-2.5 text-right border border-slate-200">Principal</th>
                    <th className="px-3.5 py-2.5 text-right border border-slate-200 bg-emerald-50/40">Rate / Mo</th>
                    <th className="px-3.5 py-2.5 text-right border border-slate-200 bg-rose-50/40">Pending Interest</th>
                    <th className="px-3.5 py-2.5 text-center border border-slate-200 w-20">Status</th>
                    <th className="px-3.5 py-2.5 text-center border border-slate-200 w-36">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, i) => {
                    const isActive = loan.status === 'ACTIVE';

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* # */}
                        <td className="px-3.5 py-2.5 text-center text-xs font-bold text-slate-500 border border-slate-200">
                          {startIndex + i + 1}
                        </td>

                        {/* Loan # & Date */}
                        <td className="px-3.5 py-2.5 w-28 border border-slate-200">
                          <div className="font-mono text-amber-900 font-black text-sm">{loan.loan_number}</div>
                          <div className="text-xs text-slate-500 font-medium">
                            {new Date(loan.loan_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-3.5 py-2.5 border border-slate-200">
                          <Link
                            href={`/dashboard/customers/customerView?id=${loan.customer_id}`}
                            className="font-black text-slate-900 text-sm hover:text-amber-800 hover:underline transition-colors block"
                            title="View Customer Profile"
                          >
                            {loan.customer?.name}
                          </Link>
                          <div className="text-xs text-slate-500 font-medium">
                            {loan.customer?.phone} {loan.customer?.village ? `• ${loan.customer?.village}` : ''}
                          </div>
                        </td>

                        {/* Pledged Items (Single Item + Count badge) */}
                        <td className="px-3.5 py-2.5 border border-slate-200 w-36">
                          {loan.loanCollateralItem?.[0] ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold border ${
                                  loan.loanCollateralItem[0].metal === 'SILVER'
                                    ? 'bg-slate-100 text-slate-800 border-slate-200'
                                    : 'bg-amber-50 text-amber-950 border-amber-200'
                                }`}
                              >
                                <span>{loan.loanCollateralItem[0].metal === 'SILVER' ? '⚪' : '🪙'}</span>
                                <span className="truncate max-w-[85px]">
                                  {loan.loanCollateralItem[0].pieces > 1 ? `${loan.loanCollateralItem[0].pieces}x ` : ''}
                                  {loan.loanCollateralItem[0].description}
                                </span>
                              </span>
                              {loan.loanCollateralItem.length > 1 && (
                                <span
                                  className="text-[10px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 cursor-pointer"
                                  title={loan.loanCollateralItem.map((it: any) => `${it.metal} ${it.description} (${it.net_weight}g)`).join(', ')}
                                >
                                  +{loan.loanCollateralItem.length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Weight */}
                        <td className="px-3.5 py-2.5 text-right w-20 font-black text-slate-900 text-sm border border-slate-200">
                          <div>{loan.net_weight} g</div>
                        </td>

                        {/* Principal */}
                        <td className="px-3.5 py-2.5 text-right font-black text-slate-900 text-sm border border-slate-200">
                          <div className="text-sm font-black">₹{loan.loan_amount.toLocaleString('en-IN')}</div>
                          {loan.current_principal_balance < loan.loan_amount && (
                            <div className="text-xs text-emerald-700 font-bold">
                              Bal: ₹{loan.current_principal_balance.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>

                        {/* Interest Rate / Monthly Amount */}
                        <td className="px-3.5 py-2.5 text-right w-28 border border-slate-200">
                        <div className="text-sm font-black text-slate-900">
                            {loan.interest_rate}%  -  ₹{loan.monthly_interest_amount?.toLocaleString('en-IN')}
                          </div>
                   
                        </td>

                        {/* Accrued Interest */}
                        <td className="px-3.5 py-2.5 text-right w-32 border border-slate-200">
                          {isActive ? (
                            <>
                              <div className="text-sm font-black text-rose-700">
                                ₹{loan.pending_interest?.toLocaleString('en-IN')}
                              </div>
                              <div className="text-xs text-slate-500 font-medium mt-0.5">
                                {loan.months_elapsed} Mo ({loan.days_elapsed}d)
                              </div>
                            </>
                          ) : (
                            <span className="text-emerald-700 font-bold text-xs">Settled</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3.5 py-2.5 text-center border border-slate-200 w-20">
                          <Badge
                            variant="outline"
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              isActive
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isActive ? 'Active' : 'Closed'}
                          </Badge>
                        </td>

                        {/* Actions (Clean inline group that never breaks) */}
                        <td className="px-3.5 py-2.5 border border-slate-200 w-36">
                          <div className="flex items-center justify-around  gap-1.5 whitespace-nowrap">
                            {isActive && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedLoanForRepay(loan)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-7 px-2.5 
                                text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                                title="Repay / Settle Loan"
                              >
                                
                                <span>Pay</span>
                              </Button>
                            )}

                            <button
                              onClick={() => setSelectedLoanForView(loan)}
                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white
                               text-slate-700 hover:bg-slate-100 flex items-center justify-center 
                               cursor-pointer transition-colors shadow-2xs"
                              title="View Loan History"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSelectedLoanForPrint(loan)}
                              className="h-7 w-7 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                              title="Print Pawn Slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <span>Showing</span>
                <strong className="text-slate-900 font-bold">
                  {totalCount > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + limit, totalCount)}
                </strong>
                <span>of</span>
                <strong className="text-slate-900 font-bold">{totalCount}</strong>
                <span>loans</span>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Rows:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-8 px-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold flex items-center gap-0.5 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <span className="px-2.5 text-slate-800 font-bold">
                    {page} / {totalPages}
                  </span>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold flex items-center gap-0.5 transition-all"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Modular Modals */}
      <CreateLoanModal
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
      />

      <RepayLoanModal
        loan={selectedLoanForRepay}
        open={!!selectedLoanForRepay}
        onOpenChange={(open) => !open && setSelectedLoanForRepay(null)}
      />

      <ViewLoanModal
        loan={selectedLoanForView}
        open={!!selectedLoanForView}
        onOpenChange={(open) => !open && setSelectedLoanForView(null)}
      />

      <PrintLoanSlipModal
        loan={selectedLoanForPrint}
        shopProfile={shopProfile}
        open={!!selectedLoanForPrint}
        onOpenChange={(open) => !open && setSelectedLoanForPrint(null)}
      />
    </div>
  );
}
