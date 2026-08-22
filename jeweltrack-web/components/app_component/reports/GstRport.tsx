'use client';

import { INRFormat } from "@/helper/INR_Formater";
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { exportToExcel, exportToCsv } from "@/lib/exportExcel";
import { FileSpreadsheet, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function GstReport() {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: gstReport, isLoading } = useQuery({
    queryKey: ['gst-report', fromDate, toDate],
    queryFn: () => api.get(`/reports/gst-report?from=${fromDate}&to=${toDate}`).then(r => r.data)
  });

  const handleExportExcel = () => {
    const exportData = (gstReport?.tableData || []).map((row: any) => ({
      'Date': row.date ? row.date.split("T")[0] : '—',
      'GST Bill Count': row.gstbillcount,
      'Taxable Amount (₹)': row.taxableamount,
      'Total GST (3%) (₹)': row.totalgst,
      'CGST (1.5%) (₹)': (row.totalgst || 0) / 2,
      'SGST (1.5%) (₹)': (row.totalgst || 0) / 2,
    }));
    exportToExcel(exportData, 'JewelTrack_GST_Report', 'GST Summary');
  };

  const handleExportCsv = () => {
    const exportData = (gstReport?.tableData || []).map((row: any) => ({
      'Date': row.date ? row.date.split("T")[0] : '—',
      'GST Bill Count': row.gstbillcount,
      'Taxable Amount (₹)': row.taxableamount,
      'Total GST (3%) (₹)': row.totalgst,
      'CGST (1.5%) (₹)': (row.totalgst || 0) / 2,
      'SGST (1.5%) (₹)': (row.totalgst || 0) / 2,
    }));
    exportToCsv(exportData, 'JewelTrack_GST_Report');
  };

  const totalGstVal = gstReport?.totalGSTAmount?._sum?.totalGstAmount || gstReport?.totalGSTAmount?._sum?.totalGST || 0;
  const gstCards = [
    { title: 'Total GST (3%)', data: INRFormat(totalGstVal) },
    { title: 'CGST (1.5%)', data: INRFormat(totalGstVal / 2) },
    { title: 'SGST (1.5%)', data: INRFormat(totalGstVal / 2) },
    { title: 'GST Invoices Count', data: gstReport?.totalBillCount || 0 },
  ];

  const tableData = gstReport?.tableData || [];
  const totalItems = tableData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedData = tableData.slice(startIndex, startIndex + pageSize);

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

      {/* Stats Summary Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {gstCards.map((item, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs"
          >
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {item.title}
            </div>
            <div className="text-xl font-black text-slate-900">
              {item.data}
            </div>
          </div>
        ))}
      </section>

      {/* GST Table */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            GSTR-1 Breakdown
          </h2>
          <span className="text-xs text-slate-500 font-medium">Taxable Value & Split Breakdown</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm font-bold">
            No GST records found for the selected period
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 w-12 text-center">#</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-center">GST Bills</th>
                    <th className="px-5 py-3 text-right">Taxable (₹)</th>
                    <th className="px-5 py-3 text-right">Total GST (3%)</th>
                    <th className="px-5 py-3 text-right">CGST (1.5%)</th>
                    <th className="px-5 py-3 text-right">SGST (1.5%)</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((row: any, i: number) => {
                    const rowGst = row.totalgst || 0;
                    return (
                      <tr
                        key={row.date + i}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-3 text-sm font-bold text-slate-500 text-center">
                          {startIndex + i + 1}
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-slate-900">
                          {row.date ? new Date(row.date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-5 py-3 text-center text-sm font-black text-slate-800">
                          {row.gstbillcount}
                        </td>
                        <td className="px-5 py-3 text-right text-base font-black text-slate-900">
                          {INRFormat(row.taxableamount || 0)}
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-black text-amber-800">
                          {INRFormat(rowGst)}
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">
                          {INRFormat(rowGst / 2)}
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">
                          {INRFormat(rowGst / 2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
              <div className="flex items-center gap-1.5">
                <span>Showing</span>
                <strong className="text-slate-900 font-bold">
                  {totalItems > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + pageSize, totalItems)}
                </strong>
                <span>of</span>
                <strong className="text-slate-900 font-bold">{totalItems}</strong>
                <span>records</span>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 px-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none cursor-pointer"
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
