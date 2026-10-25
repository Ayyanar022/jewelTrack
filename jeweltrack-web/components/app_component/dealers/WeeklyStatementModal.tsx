'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  Receipt,
  Printer,
  FileSpreadsheet,
  Loader2,
  Calendar,
} from 'lucide-react';
import { exportToExcel } from '@/lib/exportExcel';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealer: any;
}

export default function WeeklyStatementModal({ open, onOpenChange, dealer }: Props) {
  // Default to current running week (Monday to today)
  const getInitialDates = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const today = new Date();

    return {
      from: monday.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDates());

  const { data: statement, isLoading } = useQuery({
    queryKey: ['dealer-statement', dealer?.id, dateRange.from, dateRange.to],
    queryFn: () =>
      api
        .get(`/dealer/${dealer.id}/weekly-statement?from=${dateRange.from}&to=${dateRange.to}`)
        .then((r) => r.data),
    enabled: open && !!dealer?.id,
  });

  const handleQuickPeriod = (type: 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH') => {
    const now = new Date();
    let from = new Date();
    let to = new Date();

    if (type === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      from = new Date(now.setDate(diff));
      to = new Date();
    } else if (type === 'LAST_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day - 6;
      from = new Date(now.setDate(diff));
      to = new Date(from);
      to.setDate(from.getDate() + 6);
    } else if (type === 'THIS_MONTH') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date();
    }

    setDateRange({
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    });
  };

  const s = statement?.summary;
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Bulletproof print using dedicated print window
  const handlePrint = () => {
    if (!statement) return;

    const fromDateStr = new Date(statement.period.from).toLocaleDateString('en-IN');
    const toDateStr = new Date(statement.period.to).toLocaleDateString('en-IN');
    const prevBal = Number(s?.previous_pending_pure_gold || 0).toFixed(3);
    const soldPure = Number(s?.period_total_sold_pure || 0).toFixed(3);
    const recvPure = Number(s?.period_total_pure_received || 0).toFixed(3);
    const totalDue = Number(s?.net_closing_pending_pure_gold || 0).toFixed(3);

    const rowsHtml = (statement.transactions || [])
      .map((row: any, idx: number) => {
        const hm = Number(row.hallmark_charge || 0);
        const pLabel = row.purity === 'K18' ? '18K' : row.purity === 'K24' ? '24K' : '22K';
        return `
          <tr>
            <td style="text-align: center; border: 1px solid #94a3b8; padding: 6px 8px;">${idx + 1}</td>
            <td style="border: 1px solid #94a3b8; padding: 6px 8px;">${new Date(row.date).toLocaleDateString('en-IN')}</td>
            <td style="border: 1px solid #94a3b8; padding: 6px 8px; font-weight: 600;">${row.item_name}</td>
            <td style="text-align: center; border: 1px solid #94a3b8; padding: 6px 8px;">${pLabel}</td>
            <td style="text-align: center; font-family: monospace; border: 1px solid #94a3b8; padding: 6px 8px;">${row.touch}%</td>
            <td style="text-align: right; font-family: monospace; border: 1px solid #94a3b8; padding: 6px 8px;">${hm > 0 ? `+${hm.toFixed(3)}` : '—'}</td>
            <td style="text-align: right; font-family: monospace; border: 1px solid #94a3b8; padding: 6px 8px;">${Number(row.sold_net_weight || 0).toFixed(3)}</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; border: 1px solid #94a3b8; padding: 6px 8px; background: #fafafa;">+${Number(row.pure_weight || 0).toFixed(3)}</td>
          </tr>
        `;
      })
      .join('');

    const printWin = window.open('', '_blank', 'width=850,height=900');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>ESTIMATE BILL - ${dealer?.shop_name || 'Dealer'}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; background: #fff; padding: 24px; font-size: 13px; line-height: 1.4; }
            .bill-title { text-align: center; font-size: 15px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; padding-bottom: 8px; border-bottom: 2px solid #0f172a; margin-bottom: 12px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; }
            .header-info .shop-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; margin-bottom: 16px; }
            th { border: 1px solid #64748b; background: #f1f5f9; padding: 6px 8px; font-size: 11px; text-transform: uppercase; font-weight: 700; }
            .calc-box { width: 340px; margin-left: auto; border: 1px solid #0f172a; margin-top: 14px; font-size: 12px; }
            .calc-row { display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #cbd5e1; }
            .calc-total { display: flex; justify-content: space-between; padding: 8px 12px; font-weight: 900; font-size: 14px; background: #f8fafc; border-top: 2px solid #0f172a; }
            .footer-sign { display: flex; justify-content: space-between; margin-top: 48px; padding-top: 12px; font-size: 11px; }
            .sign-line { border-top: 1px solid #94a3b8; width: 140px; text-align: center; padding-top: 4px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="bill-title">ESTIMATE / APPROVAL STATEMENT</div>
          
          <div class="header-info">
            <div>
              <div class="shop-name">${dealer?.shop_name || 'Partner Jeweller'}</div>
              <div>${dealer?.name ? `Contact: <strong>${dealer.name}</strong>` : ''} ${dealer?.phone ? `• ${dealer.phone}` : ''} ${dealer?.city ? `• ${dealer.city}` : ''}</div>
            </div>
            <div style="text-align: right;">
              <div>Bill Issued Date: <strong>${todayFormatted}</strong></div>
              <div>Period: <strong>${fromDateStr}</strong> to <strong>${toDateStr}</strong></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 32px; text-align: center;">#</th>
                <th style="width: 80px; text-align: left;">Date</th>
                <th style="text-align: left;">Jewellery Item</th>
                <th style="width: 50px; text-align: center;">Purity</th>
                <th style="width: 60px; text-align: center;">Touch %</th>
                <th style="width: 80px; text-align: right;">Hallmark (g)</th>
                <th style="width: 80px; text-align: right;">Sold Net (g)</th>
                <th style="width: 90px; text-align: right;">Pure Gold (g)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 16px; color: #64748b;">No approval items sold in this week</td></tr>'}
            </tbody>
          </table>

          <div class="calc-box">
            <div class="calc-row">
              <span>Previous Balance:</span>
              <strong style="font-family: monospace;">${prevBal} g</strong>
            </div>
            <div class="calc-row">
              <span>(+) This Week Sold Pure:</span>
              <strong style="font-family: monospace;">+${soldPure} g</strong>
            </div>
            ${Number(recvPure) > 0 ? `
            <div class="calc-row">
              <span>(-) Payments Received:</span>
              <strong style="font-family: monospace;">-${recvPure} g</strong>
            </div>
            ` : ''}
            <div class="calc-total">
              <span>TOTAL BALANCE DUE:</span>
              <span style="font-family: monospace;">${totalDue} g</span>
            </div>
          </div>

          <div class="footer-sign">
            <div class="sign-line">Partner Signature</div>
            <div style="color: #64748b; font-style: italic;">System Generated Estimate Bill</div>
            <div class="sign-line">Authorized Signature</div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          <\/script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleExportExcel = () => {
    if (!statement) return;

    const exportRows = (statement.transactions || []).map((t: any, idx: number) => ({
      '#': idx + 1,
      'Date': t.date ? new Date(t.date).toLocaleDateString('en-IN') : '—',
      'Jewellery Item': t.item_name,
      'Purity': `${t.purity || '22K'} ${t.metal || 'GOLD'}`,
      'Touch %': `${t.touch}%`,
      'Hallmark (g)': t.hallmark_charge > 0 ? Number(t.hallmark_charge).toFixed(3) : '0.000',
      'Sold Net (g)': Number(t.sold_net_weight || 0).toFixed(3),
      'Pure Gold (g)': Number(t.pure_weight || 0).toFixed(3),
    }));

    exportToExcel(
      exportRows,
      `${(dealer?.shop_name || 'Dealer').replace(/\s+/g, '_')}_Weekly_Bill_${dateRange.from}_to_${dateRange.to}`,
      'Weekly Statement',
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xl flex flex-col overflow-hidden">
        {/* Top Header Toolbar */}
        <DialogHeader className="border-b border-slate-100 pb-2.5 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </span>
              <span>Weekly System Bill & Settlement Statement</span>
            </DialogTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="h-8 text-xs font-semibold gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Bill</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 flex-shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Period:</span>
            </span>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium cursor-pointer"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleQuickPeriod('THIS_WEEK')}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 font-semibold hover:bg-slate-100 text-slate-700 cursor-pointer text-xs"
            >
              This Week
            </button>
            <button
              onClick={() => handleQuickPeriod('LAST_WEEK')}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 font-semibold hover:bg-slate-100 text-slate-700 cursor-pointer text-xs"
            >
              Last Week
            </button>
            <button
              onClick={() => handleQuickPeriod('THIS_MONTH')}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 font-semibold hover:bg-slate-100 text-slate-700 cursor-pointer text-xs"
            >
              This Month
            </button>
          </div>
        </div>

        {/* Calm, Clean Statement Sheet */}
        <div className="flex-1 overflow-y-auto pt-2 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-7 h-7 animate-spin text-slate-500" />
            </div>
          ) : !statement ? (
            <div className="text-center py-16 text-slate-400">Unable to load statement.</div>
          ) : (
            <div className="bg-white p-5 rounded-lg border border-slate-200 text-slate-900 space-y-3.5">
              {/* Header: Title, Partner, Date */}
              <div className="border-b-2 border-slate-900 pb-2.5">
                <div className="text-center font-bold text-sm tracking-wider uppercase text-slate-900 mb-2">
                  ESTIMATE / APPROVAL STATEMENT
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 text-xs">
                  <div>
                    <div className="font-bold text-base text-slate-900">
                      {dealer.shop_name}
                    </div>
                    <div className="text-slate-600 font-medium">
                      {dealer.name} {dealer.phone ? `• ${dealer.phone}` : ''} {dealer.city ? `• ${dealer.city}` : ''}
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs">
                    <div>
                      <span className="text-slate-500">Bill Issued Date: </span>
                      <strong className="font-bold text-slate-900 font-mono">{todayFormatted}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Period: </span>
                      <strong className="font-semibold text-slate-800 font-mono">
                        {new Date(statement.period.from).toLocaleDateString('en-IN')} — {new Date(statement.period.to).toLocaleDateString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-2.5 py-2 text-center w-8 border-r border-slate-200">#</th>
                      <th className="px-2.5 py-2 border-r border-slate-200">Date</th>
                      <th className="px-2.5 py-2 border-r border-slate-200">Jewellery Item</th>
                      <th className="px-2.5 py-2 text-center border-r border-slate-200">Purity</th>
                      <th className="px-2.5 py-2 text-center border-r border-slate-200">Touch %</th>
                      <th className="px-2.5 py-2 text-right border-r border-slate-200">Hallmark (g)</th>
                      <th className="px-2.5 py-2 text-right border-r border-slate-200">Sold Net (g)</th>
                      <th className="px-2.5 py-2 text-right font-bold text-slate-900 bg-slate-50">Pure Gold (g)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statement.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-slate-400">
                          No approval items sold in this period
                        </td>
                      </tr>
                    ) : (
                      statement.transactions.map((row: any, idx: number) => {
                        const hallmarkVal = Number(row.hallmark_charge || 0);
                        const pLabel = row.purity === 'K18' ? '18K' : row.purity === 'K24' ? '24K' : '22K';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-2.5 py-2 text-center font-medium text-slate-500 border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="px-2.5 py-2 text-slate-600 font-mono border-r border-slate-200 whitespace-nowrap">
                              {new Date(row.date).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-2.5 py-2 font-bold text-slate-800 border-r border-slate-200">
                              {row.item_name}
                            </td>
                            <td className="px-2.5 py-2 text-center text-slate-700 border-r border-slate-200 font-medium">
                              {pLabel}
                            </td>
                            <td className="px-2.5 py-2 text-center font-mono font-medium text-slate-800 border-r border-slate-200">
                              {row.touch}%
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono text-slate-600 border-r border-slate-200">
                              {hallmarkVal > 0 ? `+${hallmarkVal.toFixed(3)}` : '—'}
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono font-medium text-slate-800 border-r border-slate-200">
                              {Number(row.sold_net_weight || 0).toFixed(3)}
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono font-bold text-slate-900 bg-slate-50/60">
                              +{Number(row.pure_weight || 0).toFixed(3)} g
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Calm, Simple Calculations Box (No noisy cards) */}
              <div className="flex justify-end pt-1">
                <div className="w-full sm:w-80 border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200 bg-white">
                    <span className="text-slate-600 font-medium">Previous Balance:</span>
                    <strong className="font-mono text-slate-900">
                      {s?.previous_pending_pure_gold?.toFixed(3) || '0.000'} g
                    </strong>
                  </div>

                  <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200 bg-white">
                    <span className="text-slate-600 font-medium">(+) This Week Sold Pure:</span>
                    <strong className="font-mono text-slate-900">
                      +{s?.period_total_sold_pure?.toFixed(3) || '0.000'} g
                    </strong>
                  </div>

                  {Number(s?.period_total_pure_received || 0) > 0 && (
                    <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200 bg-white">
                      <span className="text-slate-600 font-medium">(-) Payments Received:</span>
                      <strong className="font-mono text-emerald-700">
                        -{s?.period_total_pure_received?.toFixed(3) || '0.000'} g
                      </strong>
                    </div>
                  )}

                  <div className="flex justify-between items-center px-3 py-2 bg-slate-100 font-bold text-slate-900">
                    <span className="text-[11px] uppercase tracking-wide">Total Balance Due:</span>
                    <span className="text-sm font-mono font-black text-slate-950">
                      {s?.net_closing_pending_pure_gold?.toFixed(3) || '0.000'} g
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
