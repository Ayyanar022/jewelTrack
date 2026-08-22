'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { exportToExcel, exportToCsv } from '@/lib/exportExcel';
import { Coins, Download, FileSpreadsheet, Scale, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { INRFormat } from '@/helper/INR_Formater';

export default function LoanReport() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Fetch Loans for Report
  const { data: loanData, isLoading } = useQuery<{
    items: any[];
    total: number;
    totalPages: number;
  }>({
    queryKey: ['report-loans', fromDate, toDate, statusFilter, search, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await api.get(`/loan?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['report-loan-stats'],
    queryFn: async () => {
      const res = await api.get('/loan/stats');
      return res.data;
    },
  });

  const loans = loanData?.items || [];
  const totalCount = loanData?.total || 0;
  const totalPages = loanData?.totalPages || 1;
  const startIndex = (page - 1) * limit;

  // Handle Export
  const handleExportExcel = () => {
    const exportData = loans.map((l) => ({
      'Loan Number': l.loan_number,
      'Pledge Date': new Date(l.loan_date).toLocaleDateString('en-IN'),
      'Customer Name': l.customer?.name || '—',
      'Mobile Number': l.customer?.phone || '—',
      'Village / Place': l.customer?.village || '—',
      'Gross Weight (g)': l.gross_weight,
      'Net Weight (g)': l.net_weight,
      'Principal Amount (₹)': l.loan_amount,
      'Remaining Balance (₹)': l.current_principal_balance,
      'Interest Rate (%/mo)': l.interest_rate,
      'Accrued Interest (₹)': l.pending_interest,
      'Loan Status': l.status,
    }));
    exportToExcel(exportData, 'JewelTrack_Gold_Loan_Report', 'Gold Loans');
  };

  const handleExportCsv = () => {
    const exportData = loans.map((l) => ({
      'Loan Number': l.loan_number,
      'Pledge Date': new Date(l.loan_date).toLocaleDateString('en-IN'),
      'Customer Name': l.customer?.name || '—',
      'Mobile Number': l.customer?.phone || '—',
      'Gross Weight (g)': l.gross_weight,
      'Net Weight (g)': l.net_weight,
      'Principal Amount (₹)': l.loan_amount,
      'Remaining Balance (₹)': l.current_principal_balance,
      'Accrued Interest (₹)': l.pending_interest,
      'Loan Status': l.status,
    }));
    exportToCsv(exportData, 'JewelTrack_Gold_Loan_Report');
  };

  return (
    <div className="space-y-3.5">
      {/* Compact Filters & Export Bar */}
      <section className="bg-white rounded-2xl border border-slate-200 p-3 sm:px-4 sm:py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Search */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search loan #, customer, mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 text-xs font-medium border-slate-300 rounded-xl"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Loans</option>
            <option value="ACTIVE">Active (Pledged)</option>
            <option value="CLOSED">Closed (Redeemed)</option>
          </select>

          {(search || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setPage(1);
              }}
              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </section>

      {/* Stats Summary Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Active Pledges
          </div>
          <div className="text-xl font-black text-slate-900">
            {stats?.active_loans_count ?? 0}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Outstanding Principal
          </div>
          <div className="text-xl font-black text-slate-900">
            {INRFormat(stats?.total_principal_lent ?? 0)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Accrued Interest
          </div>
          <div className="text-xl font-black text-amber-900">
            {INRFormat(stats?.total_accrued_interest ?? 0)}
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
            Gold in Vault
          </div>
          <div className="text-xl font-black text-amber-900">
            {(stats?.total_gold_weight_grams ?? 0).toFixed(2)} <span className="text-xs font-bold">g</span>
          </div>
        </div>
      </section>

      {/* Loan Master Table with High-Visibility Font & Compact Padding */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Pledge Audit Register: <span className="font-black text-slate-900">{totalCount}</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Gold Loan Portfolio History</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm font-bold">
            No loan records found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">#</th>
                    <th className="px-4 py-3">Loan #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Net Wt (g)</th>
                    <th className="px-4 py-3 text-right">Principal</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-right">Accrued Int.</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loans.map((l: any, i: number) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-bold text-slate-500 text-center">
                        {startIndex + i + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-black text-slate-900 font-mono">
                        {l.loan_number}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        {new Date(l.loan_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-base font-black text-slate-900">
                          {l.customer?.name || '—'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{l.customer?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">
                        {l.net_weight} g
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 text-base">
                        ₹{(l.loan_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-rose-800 text-sm">
                        ₹{(l.current_principal_balance || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-amber-800 text-sm">
                        ₹{(l.pending_interest || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            l.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {l.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
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
          </>
        )}
      </section>
    </div>
  );
}
