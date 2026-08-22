'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  Eye,
  History,
  Plus,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  Receipt,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface Params {
  newBill: () => void;
  history: () => void;
  activeTab: string;
}

const ROWS_OPTIONS = [7, 10, 15, 20];

export default function BillHistory({ newBill, history, activeTab }: Params) {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const { data, isLoading } = useQuery({
    queryKey: ['bill-history', search, page, limit, period],
    queryFn: () =>
      api
        .get(`/bill/all?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}&period=${period}`)
        .then((r) => r.data),
  });

  const bills: any[] = data?.items || (Array.isArray(data) ? data : []);
  const totalCount: number = data?.total ?? bills.length;
  const totalPages: number = data?.totalPages ?? (Math.ceil(totalCount / limit) || 1);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input & Date Period Tabs */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="flex items-center gap-2 border border-slate-300 px-3.5 py-2 rounded-lg bg-slate-50 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-900/10 transition-all flex-1 min-w-[260px] max-w-md">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              className="flex-1 outline-none text-sm bg-transparent text-slate-900 placeholder:text-slate-400"
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by Bill No, Customer, Phone, Village..."
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-sm font-semibold">
            {[
              { label: 'All', value: 'ALL' },
              { label: 'Today', value: 'TODAY' },
              { label: 'Week', value: 'WEEK' },
              { label: 'Month', value: 'MONTH' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => handlePeriodChange(tab.value)}
                className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                  period === tab.value
                    ? 'bg-white shadow-xs font-bold text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={newBill}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'new'
                ? 'bg-white shadow-xs text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus size={16} />
            <span>New Bill</span>
          </button>
          <button
            onClick={history}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white shadow-xs text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History size={16} />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Bill Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100 hover:bg-slate-100 border-b border-slate-200">
              <TableHead className="w-14 text-xs uppercase tracking-wider text-slate-700 font-bold text-center py-3.5">#</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-700 font-bold py-3.5">Bill No</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-700 font-bold py-3.5">Customer</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-700 font-bold py-3.5">Phone / Place</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-700 font-bold py-3.5">Items</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-700 font-bold py-3.5">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-700 font-bold text-center py-3.5">Type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-700 font-bold text-center py-3.5">Payment</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-700 font-bold text-right py-3.5">Amount (₹)</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-700 font-bold text-center py-3.5">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-16 text-slate-500 text-sm font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading billing history...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-16 text-slate-500 text-sm font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Receipt className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                    <p className="font-bold text-slate-700 text-base">No billing records found</p>
                    <p className="text-xs text-slate-400">
                      {search || period !== 'ALL'
                        ? 'Try clearing your search or date filter.'
                        : 'Create your first jewellery bill to see it here.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill: any, i: number) => {
                const totalPaid =
                  bill.billPaymentsEntry?.reduce(
                    (sum: number, p: any) => sum + Number(p.paid_amount || 0),
                    0
                  ) || 0;
                const oldGoldCredit =
                  bill.oldGoldEntry?.reduce(
                    (sum: number, g: any) => sum + Number(g.amount || 0),
                    0
                  ) || 0;
                const payable = Number(bill.payableAmount || 0);
                const balance = Math.max(0, Math.round(payable - (totalPaid + oldGoldCredit)));
                const isCleared = balance <= 0;

                return (
                  <TableRow key={bill.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                    {/* Index */}
                    <TableCell className="text-slate-500 text-sm text-center font-mono font-medium py-3.5">
                      {(page - 1) * limit + i + 1}
                    </TableCell>

                    {/* Bill Number */}
                    <TableCell className="py-3.5">
                      <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                        {bill.bill_number}
                      </span>
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="py-3.5">
                      <div className="font-bold text-sm text-slate-900">
                        {bill.customer?.name || 'Walk-in Customer'}
                      </div>
                    </TableCell>

                    {/* Phone / Place */}
                    <TableCell className="py-3.5">
                      <div className="text-sm text-slate-700 font-mono">
                        {bill.customer?.phone || '—'}
                      </div>
                      {bill.customer?.village && (
                        <div className="text-xs text-slate-500">{bill.customer.village}</div>
                      )}
                    </TableCell>

                    {/* Items Summary */}
                    <TableCell className="text-sm text-slate-700 font-medium py-3.5">
                      {bill.billItem && bill.billItem.length > 0 ? (
                        <span>
                          {bill.billItem.length} {bill.billItem.length === 1 ? 'item' : 'items'}
                          <span className="text-xs text-slate-500 block">
                            {bill.billItem.map((item: any) => item.category?.name || item.metal).slice(0, 2).join(', ')}
                            {bill.billItem.length > 2 ? '…' : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-sm text-slate-700 font-medium whitespace-nowrap py-3.5">
                      {new Date(bill.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>

                    {/* Type */}
                    <TableCell className="text-center py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                          bill.is_gst_bill
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {bill.is_gst_bill ? 'GST' : 'DIRECT'}
                      </Badge>
                    </TableCell>

                    {/* Payment Status */}
                    <TableCell className="text-center whitespace-nowrap py-3.5">
                      {isCleared ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-300 font-mono">
                          Due: ₹{balance.toLocaleString('en-IN')}
                        </span>
                      )}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right py-3.5">
                      <span className="font-mono font-bold text-base text-slate-900">
                        ₹{Math.round(payable).toLocaleString('en-IN')}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/dashboard/billing/${bill.id}`}>
                          <button
                            className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View invoice details & add payment"
                          >
                            <Eye size={16} strokeWidth={2} />
                          </button>
                        </Link>

                        <button
                          onClick={() => window.open(`/print/${bill.id}`, '_blank')}
                          className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Print invoice"
                        >
                          <Printer size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer & Pagination */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {/* Left info & rows per page */}
          <div className="flex items-center gap-5 text-slate-700 font-medium">
            <span>
              Showing <strong className="text-slate-900">{bills.length > 0 ? (page - 1) * limit + 1 : 0}</strong> –{' '}
              <strong className="text-slate-900">{Math.min(page * limit, totalCount)}</strong> of{' '}
              <strong className="text-slate-900">{totalCount}</strong> bills
            </span>

            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs font-semibold">Rows:</span>
              <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                {ROWS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleLimitChange(opt)}
                    className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                      limit === opt
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Page Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="h-9 px-3.5 text-sm font-bold border-slate-300 cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft size={16} className="mr-1" /> Prev
            </Button>

            <span className="px-3 font-mono font-bold text-slate-800 text-sm">
              Page {page} of {Math.max(1, totalPages)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="h-9 px-3.5 text-sm font-bold border-slate-300 cursor-pointer disabled:opacity-40"
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}