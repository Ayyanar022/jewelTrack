'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exportToExcel, exportToCsv } from '@/lib/exportExcel';
import { Coins, Download, FileSpreadsheet, Scale, Search, Loader2 } from 'lucide-react';

export default function LoanReport() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Fetch Loans for Report
  const { data: loanData, isLoading } = useQuery<{
    items: any[];
    total: number;
    totalPages: number;
  }>({
    queryKey: ['report-loans', fromDate, toDate, statusFilter, search, page],
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

  // Handle Export
  const handleExportExcel = () => {
    const exportData = loans.map((l) => ({
      'Loan Number': l.loan_number,
      'Pledge Date': new Date(l.loan_date).toLocaleDateString('en-IN'),
      'Customer Name': l.customer?.name || '—',
      'Mobile Number': l.customer?.phone || '—',
      'Village / Place': l.customer?.village || '—',
      'Ornaments Description': (l.loanCollateralItem || []).map((i: any) => `${i.metal} ${i.description} (${i.net_weight}g)`).join('; '),
      'Gross Weight (g)': l.gross_weight,
      'Net Weight (g)': l.net_weight,
      'Principal Amount (₹)': l.loan_amount,
      'Remaining Balance (₹)': l.current_principal_balance,
      'Interest Rate (%/mo)': l.interest_rate,
      'Monthly Interest (₹)': l.monthly_interest_amount,
      'Accrued Interest (₹)': l.pending_interest,
      'Months Elapsed': l.months_elapsed,
      'Loan Status': l.status,
      'Locker Packet': l.notes || '—',
    }));

    exportToExcel(exportData, 'JewelTrack_Gold_Loan_Report', 'Pledges');
  };

  const handleExportCsv = () => {
    const exportData = loans.map((l) => ({
      'Loan Number': l.loan_number,
      'Pledge Date': new Date(l.loan_date).toLocaleDateString('en-IN'),
      'Customer Name': l.customer?.name || '—',
      'Mobile Number': l.customer?.phone || '—',
      'Village / Place': l.customer?.village || '—',
      'Net Weight (g)': l.net_weight,
      'Principal Amount (₹)': l.loan_amount,
      'Remaining Balance (₹)': l.current_principal_balance,
      'Interest Rate (%/mo)': l.interest_rate,
      'Pending Interest (₹)': l.pending_interest,
      'Status': l.status,
    }));

    exportToCsv(exportData, 'JewelTrack_Gold_Loan_Report');
  };

  return (
    <div className="space-y-4">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Pledges</div>
          <div className="text-xl font-black text-slate-900 mt-1">{stats?.active_loans_count ?? 0} Loans</div>
          <div className="text-xs text-slate-400 mt-0.5">Safe custody</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Principal Lent (அசல்)</div>
          <div className="text-xl font-black text-emerald-800 mt-1">
            ₹{(stats?.total_principal_lent ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-600 mt-0.5">Total capital invested</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Interest Accrual</div>
          <div className="text-xl font-black text-blue-800 mt-1">
            ₹{(stats?.monthly_accruing_interest ?? 0).toLocaleString('en-IN')}/mo
          </div>
          <div className="text-xs text-blue-600 mt-0.5">Active recurring income</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pledged Vault Stock</span>
            <Scale className="w-4 h-4 text-gold" />
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-slate-100 font-bold">
            <span className="text-amber-900">🪙 Gold Vault:</span>
            <span className="font-black text-slate-900">{(stats?.total_gold_weight_grams ?? 0).toFixed(2)} g</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600">⚪ Silver Vault:</span>
            <span className="font-black text-slate-900">{(stats?.total_silver_weight_grams ?? 0).toFixed(2)} g</span>
          </div>
        </div>
      </div>

      {/* Filter & Export Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Search loan #, customer, phone, place..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold">
            {(['ALL', 'ACTIVE', 'CLOSED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Closed'}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <Button
            onClick={handleExportExcel}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-10 px-4 text-xs flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="border-slate-300 font-bold h-10 px-4 text-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </Button>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Coins className="w-10 h-10 mx-auto opacity-30 text-gold" />
            <p className="text-sm font-bold text-slate-700">No Gold Loans found matching criteria</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Loan #</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Customer & Village</th>
                    <th className="px-4 py-3.5">Ornaments</th>
                    <th className="px-4 py-3.5 text-right">Net Wt</th>
                    <th className="px-4 py-3.5 text-right">Principal</th>
                    <th className="px-4 py-3.5 text-right">Balance</th>
                    <th className="px-4 py-3.5 text-right">Pending Int.</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map((loan) => {
                    const isActive = loan.status === 'ACTIVE';

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5 font-mono text-gold font-black">{loan.loan_number}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                          {new Date(loan.loan_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-sm">{loan.customer?.name}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            {loan.customer?.phone} {loan.customer?.village ? `• ${loan.customer?.village}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-800 text-xs font-semibold max-w-[220px] truncate">
                            {loan.loanCollateralItem?.map((i: any, idx: number) => (
                              <span key={idx} className="inline-block mr-1">
                                [{i.metal === 'SILVER' ? 'Sil' : 'Au'}] {i.description}
                                {idx < loan.loanCollateralItem.length - 1 ? ',' : ''}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-slate-900">{loan.net_weight} g</td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          ₹{loan.loan_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-emerald-800">
                          ₹{loan.current_principal_balance.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-rose-700">
                          {isActive ? `₹${(loan.pending_interest || 0).toLocaleString('en-IN')}` : 'Settled'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-2 py-0.5 uppercase ${
                              isActive
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {isActive ? 'Active' : 'Closed'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-medium">
              <div>
                Showing <strong>{(page - 1) * limit + 1}</strong> to{' '}
                <strong>{Math.min(page * limit, totalCount)}</strong> of <strong>{totalCount}</strong> loans
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 text-xs font-bold"
                >
                  Previous
                </Button>
                <span className="font-bold text-slate-800 px-2 py-1">
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
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
