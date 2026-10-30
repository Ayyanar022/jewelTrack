'use client';

import { INRFormat } from "@/helper/INR_Formater";
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { exportToExcel, exportToCsv } from "@/lib/exportExcel";
import { FileSpreadsheet, Download, ChevronLeft, ChevronRight, Loader2, Calendar } from "lucide-react";

export default function SalesReport() {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: billStats, isLoading } = useQuery({
    queryKey: ['sale-report', fromDate, toDate],
    queryFn: () => api.get(`/reports/sale-stats?from=${fromDate}&to=${toDate}`).then(r => r.data)
  });

  const handleExportExcel = () => {
    const exportData = (billStats?.tableData || []).map((row: any) => ({
      'Date': row.date ? row.date.split("T")[0] : '—',
      'Bills Count': row.billcount,
      'Total Sales Amount (₹)': row.totalsaleamount,
      'GST Amount (₹)': row.totalgst,
    }));
    exportToExcel(exportData, 'JewelTrack_Sales_Report', 'Sales');
  };

  const handleExportCsv = () => {
    const exportData = (billStats?.tableData || []).map((row: any) => ({
      'Date': row.date ? row.date.split("T")[0] : '—',
      'Bills Count': row.billcount,
      'Total Sales Amount (₹)': row.totalsaleamount,
      'GST Amount (₹)': row.totalgst,
    }));
    exportToCsv(exportData, 'JewelTrack_Sales_Report');
  };

  const billStatsData = [
    { title: 'Total Sales Revenue', data: INRFormat(billStats?.totalSalesAmount?._sum?.payableAmount || 0) },
    { title: 'GST Collected', data: INRFormat(billStats?.totalGSTAmount?._sum?.totalGstAmount || billStats?.totalGSTAmount?._sum?.totalGST || 0) },
    { title: 'Total Bills', data: billStats?.totalBillCount || 0 },
    { title: 'GST Invoices', data: billStats?.totalGstBillCount || 0 },
    { title: 'Estimate / Non-GST', data: billStats?.totalNonGstBillCount || 0 },
  ];

  const tableData = billStats?.tableData || [];
  const totalItems = tableData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedData = tableData.slice(startIndex, startIndex + pageSize);

  // Reset page when filter or page size changes
  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, pageSize]);

  return (
    <div className="space-y-3.5">
      {/* Compact Filter & Export Bar */}
      <section className="bg-white rounded-2xl border border-slate-200 p-3 sm:px-4 sm:py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-xs font-bold text-slate-500">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-xs font-bold text-slate-500">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            />
          </div>

          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
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

      {/* Compact Stat Cards Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {billStatsData.map((item, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3.5 shadow-xs"
          >
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">
              {item.title}
            </div>
            <div className="text-sm sm:text-xl font-black font-mono text-slate-900">
              {item.data}
            </div>
          </div>
        ))}

        {billStats?.totalGramSaleGoldAndSilver?.map((item: any, i: number) => (
          <div
            key={i}
            className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 sm:p-3.5 shadow-xs"
          >
            <div className="text-[10px] sm:text-xs font-bold text-amber-900 uppercase tracking-wider mb-0.5 sm:mb-1">
              {item.metal} ({item.purity}) Sold
            </div>
            <div className="text-sm sm:text-xl font-black font-mono text-amber-900">
              {(item._sum.net_weight || 0).toFixed(2)} <span className="text-[10px] sm:text-xs font-bold">g</span>
            </div>
          </div>
        ))}
      </section>

      {/* Daily Sales Table & Mobile Cards */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800">
            Daily Sales Summary
          </h2>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Revenue & Tax Audit</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs sm:text-sm font-bold">
            No sales data found for the selected period
          </div>
        ) : (
          <>
            {/* Mobile Card View (md:hidden) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedData.map((row: any, i: number) => (
                <div key={(row.date || i) + "mob"} className="p-3 space-y-1.5 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      {row.date ? new Date(row.date).toLocaleDateString('en-IN') : '—'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {row.billcount} bills
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Total Sales:</span>
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                      {INRFormat(row.totalsaleamount || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">GST Collected:</span>
                    <span className="font-mono font-bold text-xs text-amber-800">
                      {INRFormat(row.totalgst || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[560px]">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 w-12 text-center">#</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-center">Bills Count</th>
                    <th className="px-4 py-2.5 text-right">Total Sales (₹)</th>
                    <th className="px-4 py-2.5 text-right">GST Collected (₹)</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((row: any, i: number) => (
                    <tr
                      key={row.date + i}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-xs font-bold text-slate-500 text-center">
                        {startIndex + i + 1}
                      </td>
                      <td className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900">
                        {row.date ? new Date(row.date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs sm:text-sm font-black text-slate-800">
                        {row.billcount}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs sm:text-sm font-black font-mono text-slate-900">
                        {INRFormat(row.totalsaleamount || 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs sm:text-sm font-bold font-mono text-amber-800">
                        {INRFormat(row.totalgst || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-600 bg-slate-50/50">
              <div className="flex items-center gap-1.5">
                <span>Showing</span>
                <strong className="text-slate-900 font-bold">
                  {totalItems > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + pageSize, totalItems)}
                </strong>
                <span>of</span>
                <strong className="text-slate-900 font-bold">{totalItems}</strong>
                <span>records</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold flex items-center gap-0.5 transition-all text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <span className="px-2 text-slate-800 font-bold">
                    {page} / {totalPages}
                  </span>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold flex items-center gap-0.5 transition-all text-xs"
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
