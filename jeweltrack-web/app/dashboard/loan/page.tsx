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
  const limit = 10;

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
    queryKey: ['loans', statusFilter, search, period, page],
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

  // 3. Fetch Shop Profile for Print Header
  const { data: shopProfile } = useQuery({
    queryKey: ['shop-profile'],
    queryFn: async () => {
      const res = await api.get('/settings/shop-profile');
      return res.data;
    },
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Metrics Summary Cards with Period Filter */}
      <LoanMetrics stats={stats} period={period} onPeriodChange={(p) => { setPeriod(p); setPage(1); }} />

      {/* 2. Control Header (Search, Status Filter & Action) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Search by Loan No, Customer Name, Phone, Village..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 text-sm font-medium"
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
                className={`px-4 py-1.5 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Loans' : st === 'ACTIVE' ? 'Active' : 'Closed'}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setIsNewOpen(true)}
            className="bg-gold hover:bg-gold/90 text-white font-black text-sm h-10 px-5 shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Gold / Silver Loan</span>
          </Button>
        </div>
      </div>

      {/* 3. Spacious Loans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Coins className="w-12 h-12 mx-auto opacity-30 text-gold" />
            <p className="text-base font-bold text-slate-700">No Gold Loans found</p>
            <p className="text-xs text-slate-400">Click &quot;+ New Gold / Silver Loan&quot; to create your first jewellery pledge.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Loan #</th>
                    <th className="px-5 py-3.5">Customer & Village</th>
                    <th className="px-5 py-3.5">Pledged Ornaments</th>
                    <th className="px-5 py-3.5 text-right">Net Wt</th>
                    <th className="px-5 py-3.5 text-right">Principal (அசல்)</th>
                    <th className="px-5 py-3.5 text-right">Rate / mo</th>
                    <th className="px-5 py-3.5 text-right">Pending Interest</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map((loan) => {
                    const isActive = loan.status === 'ACTIVE';

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Loan # & Date */}
                        <td className="px-5 py-4">
                          <div className="font-mono text-gold font-black text-base">{loan.loan_number}</div>
                          <div className="text-xs text-slate-500 font-semibold">
                            {new Date(loan.loan_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/customers/customerView?id=${loan.customer_id}`}
                            className="font-black text-slate-900 text-base hover:text-gold hover:underline transition-colors block"
                            title="View Customer Profile"
                          >
                            {loan.customer?.name}
                          </Link>
                          <div className="text-xs text-slate-600 font-mono font-medium">
                            {loan.customer?.phone} {loan.customer?.village ? `• ${loan.customer?.village}` : ''}
                          </div>
                        </td>

                        {/* Pledged Items */}
                        <td className="px-5 py-4">
                          <div className="text-slate-900 font-semibold text-sm max-w-[240px] truncate space-x-1">
                            {loan.loanCollateralItem?.map((i: any, idx: number) => (
                              <span key={idx} className="inline-block">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded mr-1 ${i.metal === 'SILVER' ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900'}`}>
                                  {i.metal === 'SILVER' ? 'Silver' : 'Gold'}
                                </span>
                                {i.pieces > 1 ? `${i.pieces}x ` : ''}{i.description}
                                {idx < loan.loanCollateralItem.length - 1 ? ', ' : ''}
                              </span>
                            )) || 'Jewellery Ornaments'}
                          </div>
                          {loan.notes && (
                            <div className="text-xs text-amber-800 font-semibold truncate mt-0.5">
                              📍 {loan.notes}
                            </div>
                          )}
                        </td>

                        {/* Weight */}
                        <td className="px-5 py-4 text-right font-black text-slate-900">
                          <div className="text-base">{loan.net_weight} g</div>
                          <div className="text-xs text-slate-500 font-medium">Gross: {loan.gross_weight}g</div>
                        </td>

                        {/* Principal */}
                        <td className="px-5 py-4 text-right font-black text-slate-900">
                          <div className="text-base">₹{loan.loan_amount.toLocaleString('en-IN')}</div>
                          {loan.current_principal_balance < loan.loan_amount && (
                            <div className="text-xs text-emerald-700 font-bold">
                              Bal: ₹{loan.current_principal_balance.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>

                        {/* Interest Rate */}
                        <td className="px-5 py-4 text-right text-slate-800 font-medium">
                          <span className="font-black text-slate-900 text-sm">{loan.interest_rate}%</span> / mo
                          <div className="text-xs text-slate-500 font-medium">₹{loan.monthly_interest_amount}/mo</div>
                        </td>

                        {/* Accrued Interest */}
                        <td className="px-5 py-4 text-right">
                          {isActive ? (
                            <>
                              <div className="text-base font-black text-rose-700">
                                ₹{loan.pending_interest?.toLocaleString('en-IN')}
                              </div>
                              <div className="text-xs text-slate-600 font-bold flex items-center justify-end gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{loan.months_elapsed} Mo ({loan.days_elapsed}d)</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-emerald-700 font-bold text-sm">Settled</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs font-bold px-3 py-1 uppercase ${
                              isActive
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {isActive ? 'Active' : 'Closed'}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          {isActive && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedLoanForRepay(loan)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 text-xs rounded-lg shadow-xs"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" />
                              Pay / Settle
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLoanForView(loan)}
                            className="h-8 w-8 p-0 rounded-lg text-slate-700 hover:text-slate-900"
                            title="View History"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLoanForPrint(loan)}
                            className="h-8 w-8 p-0 rounded-lg text-gold hover:text-gold/90"
                            title="Print Pawn Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-medium">
              <div>
                Showing <strong>{(page - 1) * limit + 1}</strong> to{' '}
                <strong>{Math.min(page * limit, totalCount)}</strong> of <strong>{totalCount}</strong> loans
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <span className="font-bold text-slate-800 px-2">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 text-xs font-bold"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
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
