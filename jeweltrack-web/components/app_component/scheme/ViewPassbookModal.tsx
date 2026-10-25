'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Printer,
  Sparkles,
  TrendingUp,
  Coins,
  Calendar,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2,
  Building2,
  Scale,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Share2,
  Copy,
  BookOpen,
  FileText,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface ViewPassbookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string | null;
  shopProfile?: any;
}

type DateRangeOption = 'ALL' | 'THIS_MONTH' | 'LAST_3_MONTHS' | 'CUSTOM';
type PrintMode = 'STATEMENT' | 'BOOKLET_ENTRIES_ONLY';

export default function ViewPassbookModal({
  open,
  onOpenChange,
  accountId,
  shopProfile: propShopProfile,
}: ViewPassbookModalProps) {
  // Fetch account data
  const { data: account, isLoading } = useQuery({
    queryKey: ['scheme-detail', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const res = await api.get(`/scheme/${accountId}`);
      return res.data;
    },
    enabled: open && !!accountId,
  });

  // Ensure shop profile is available
  const { data: fetchedShopProfile } = useQuery({
    queryKey: ['shop-profile'],
    queryFn: async () => {
      const res = await api.get('/settings/shop-profile');
      return res.data;
    },
    enabled: open && !propShopProfile,
  });

  const shop = propShopProfile || fetchedShopProfile || {};

  // Filtering states
  const [dateRange, setDateRange] = useState<DateRangeOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const rawLedger: any[] = account?.ledger || account?.payments || [];

  // Filter ledger entries by selected date range
  const filteredEntries = useMemo(() => {
    if (!rawLedger.length) return [];

    const now = new Date();

    if (dateRange === 'ALL') {
      return rawLedger;
    }

    if (dateRange === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return rawLedger.filter((item) => new Date(item.date || item.payment_date) >= startOfMonth);
    }

    if (dateRange === 'LAST_3_MONTHS') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return rawLedger.filter((item) => new Date(item.date || item.payment_date) >= threeMonthsAgo);
    }

    if (dateRange === 'CUSTOM') {
      return rawLedger.filter((item) => {
        const itemDate = new Date(item.date || item.payment_date);
        let valid = true;
        if (customStartDate) {
          const s = new Date(customStartDate);
          s.setHours(0, 0, 0, 0);
          if (itemDate < s) valid = false;
        }
        if (customEndDate) {
          const e = new Date(customEndDate);
          e.setHours(23, 59, 59, 999);
          if (itemDate > e) valid = false;
        }
        return valid;
      });
    }

    return rawLedger;
  }, [rawLedger, dateRange, customStartDate, customEndDate]);

  // Account calculations
  const totalGrams = account?.total_gold_grams || 0;
  const totalRedeemed = account?.total_gold_redeemed || 0;
  const totalCash = account?.total_cash_deposited || 0;
  const currentValuation = account?.current_market_value || 0;
  const customerGain = account?.customer_gain || 0;
  const todayRate = account?.today_rate_22k || 0;
  const targetGrams = account?.target_grams || 0;
  const targetPercent =
    targetGrams > 0 ? Math.min(100, Math.round((totalGrams / targetGrams) * 100)) : 0;

  // Print Engine: Uses an isolated iframe so that modal styles and transforms NEVER cause a blank/white screen!
  const printPassbook = (mode: PrintMode = 'STATEMENT') => {
    if (!account) return;

    const shopName = shop?.shop_name || 'Jewellery Store';
    const shopAddress = shop?.address || '';
    const shopPhone = shop?.phone ? `Ph: ${shop.phone}` : '';
    const shopGstin = shop?.gstin ? `GST: ${shop.gstin}` : '';
    const customerName = account.customer?.name || 'Customer';
    const customerPhone = account.customer?.phone || '';
    const customerVillage = account.customer?.village || '';
    const accNumber = account.account_number || '';
    const planTitle = account.title || 'Flexi 916 Gold Scheme';
    const openDate = new Date(account.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const isBooklet = mode === 'BOOKLET_ENTRIES_ONLY';

    // Generate table rows HTML
    const rowsHtml = filteredEntries
      .map((ev: any, idx: number) => {
        const isDeposit = ev.type === 'DEPOSIT' || (!ev.type && ev.grams_credited);
        const dateVal = new Date(ev.date || ev.payment_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const refVal = ev.ref_number || ev.receipt_number || '-';
        const rateVal = (ev.rate_applied || ev.gold_rate_applied || 0).toLocaleString('en-IN');
        const cashVal = isDeposit
          ? `+₹${(ev.cash_in || ev.cash_amount || 0).toLocaleString('en-IN')}`
          : `-₹${(ev.cash_out || 0).toLocaleString('en-IN')}`;
        const goldVal = isDeposit
          ? `+${(ev.grams_in || ev.grams_credited || 0).toFixed(3)}g`
          : `-${(ev.grams_out || ev.grams_redeemed || 0).toFixed(3)}g`;
        const runningBal = (ev.running_gold_grams ?? ev.running_grams_total ?? 0).toFixed(3);
        const auth = ev.created_by?.name || '✓';

        return `
        <tr>
          <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
          <td style="white-space: nowrap;">${dateVal}</td>
          <td style="font-family: monospace; font-weight: bold;">${refVal}</td>
          <td style="text-align: right; font-weight: bold;">${cashVal}</td>
          <td style="text-align: right;">₹${rateVal}/g</td>
          <td style="text-align: right; font-weight: bold; color: ${
            isDeposit ? '#78350f' : '#7e22ce'
          };">${goldVal}</td>
          <td style="text-align: right; font-family: monospace; font-weight: 900;">${runningBal}g</td>
          <td style="text-align: center; color: #64748b; font-size: 10px;">${auth}</td>
        </tr>
      `;
      })
      .join('');

    const statementHeaderHtml = `
      <div class="header-box">
        <div>
          <h1 class="shop-title">${shopName}</h1>
          <div class="shop-sub">
            ${[shopAddress, shopPhone, shopGstin].filter(Boolean).join(' • ')}
          </div>
        </div>
        <div class="account-badge">
          <div class="title">Gold Scheme Passbook</div>
          <div class="acc-num">${accNumber}</div>
          <div style="font-size: 10px; color: #64748b;">Status: <strong>${account.status}</strong></div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <label>Customer Name</label>
          <span>${customerName}</span>
        </div>
        <div class="info-item">
          <label>Phone / Place</label>
          <span>${customerPhone} ${customerVillage ? `(${customerVillage})` : ''}</span>
        </div>
        <div class="info-item">
          <label>Scheme Plan</label>
          <span>${planTitle}</span>
        </div>
        <div class="info-item">
          <label>Opened Date</label>
          <span>${openDate}</span>
        </div>
      </div>
    `;

    const bookletHeaderHtml = `
      <div class="booklet-title">
        ${shopName} • Passbook Entries • Acc: ${accNumber} • ${customerName}
      </div>
    `;

    const summaryTotalsHtml = `
      <div class="summary-grid">
        <div class="summary-card">
          <label>Total Cash Deposited</label>
          <div class="val">₹${totalCash.toLocaleString('en-IN')}</div>
        </div>
        <div class="summary-card">
          <label>Total 916 Gold Saved</label>
          <div class="val" style="color: #78350f;">${totalGrams.toFixed(3)}g</div>
        </div>
        <div class="summary-card">
          <label>Today's Valuation (@₹${todayRate}/g)</label>
          <div class="val">₹${currentValuation.toLocaleString('en-IN')}</div>
        </div>
        <div class="summary-card">
          <label>Customer Net Profit</label>
          <div class="val" style="color: #047857;">+₹${customerGain.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div class="signatures">
        <div>
          <div class="sig-line">Customer Signature</div>
        </div>
        <div>
          <div class="sig-line">Authorized Store Seal & Sign</div>
        </div>
      </div>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isBooklet ? 'Passbook Booklet' : 'Scheme Statement'} - ${accNumber}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: ${isBooklet ? '8mm 6mm' : '12mm 10mm'};
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: ${isBooklet ? '10px' : '11px'};
              line-height: 1.35;
            }
            .header-box {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .shop-title {
              font-size: 18px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 2px 0;
            }
            .shop-sub {
              font-size: 10px;
              color: #475569;
            }
            .account-badge {
              text-align: right;
            }
            .account-badge .title {
              font-size: 11px;
              font-weight: 800;
              color: #92400e;
              text-transform: uppercase;
            }
            .account-badge .acc-num {
              font-size: 14px;
              font-weight: 900;
              font-family: monospace;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              margin-bottom: 12px;
            }
            .info-item label {
              display: block;
              font-size: 9px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .info-item span {
              font-weight: 700;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: ${isBooklet ? '10px' : '11px'};
            }
            th {
              background: #f1f5f9;
              color: #1e293b;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.5px;
              padding: 6px 6px;
              border: 1px solid #94a3b8;
              text-align: left;
            }
            td {
              padding: ${isBooklet ? '4px 6px' : '5px 6px'};
              border: 1px solid #cbd5e1;
              color: #1e293b;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              padding: 10px;
              margin-top: 10px;
              margin-bottom: 24px;
            }
            .summary-card label {
              display: block;
              font-size: 9px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .summary-card .val {
              font-size: 14px;
              font-weight: 900;
              font-family: monospace;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 35px;
              text-align: center;
              font-size: 10px;
              font-weight: 700;
              color: #475569;
            }
            .sig-line {
              border-top: 1px dashed #94a3b8;
              padding-top: 4px;
              max-width: 180px;
              margin: 0 auto;
            }
            .booklet-title {
              font-size: 11px;
              font-weight: 800;
              text-align: center;
              margin-bottom: 8px;
              color: #334155;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
            }
          </style>
        </head>
        <body>
          ${isBooklet ? bookletHeaderHtml : statementHeaderHtml}

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 75px;">Date</th>
                <th style="width: 85px;">Receipt #</th>
                <th style="text-align: right; width: 90px;">Cash In/Out</th>
                <th style="text-align: right; width: 80px;">22K Rate</th>
                <th style="text-align: right; width: 80px;">Gold Flow</th>
                <th style="text-align: right; width: 95px;">Running Bal</th>
                <th style="width: 60px; text-align: center;">Auth</th>
              </tr>
            </thead>
            <tbody>
              ${
                rowsHtml ||
                '<tr><td colspan="8" style="text-align: center; padding: 20px;">No entries found</td></tr>'
              }
            </tbody>
          </table>

          ${isBooklet ? '' : summaryTotalsHtml}
        </body>
      </html>
    `;

    // Create an invisible iframe to print directly
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      toast.error('Unable to initiate print service.');
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print error:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 250);
  };

  // WhatsApp Message Generator
  const generateWhatsAppMessage = () => {
    if (!account) return '';
    const shopName = shop?.shop_name || 'Jewellery';
    const customerName = account.customer?.name || 'Valued Customer';
    const accNo = account.account_number;
    const plan = account.title || 'Flexi 916 Gold Scheme';

    let msg = `✨ *${shopName.toUpperCase()}* ✨\n`;
    msg += `📋 *Gold Savings Scheme Passbook Statement*\n`;
    msg += `------------------------------------\n`;
    msg += `👤 *Customer:* ${customerName}\n`;
    msg += `🔢 *Account No:* ${accNo}\n`;
    msg += `🏷️ *Scheme:* ${plan}\n`;
    msg += `📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n`;
    msg += `------------------------------------\n`;
    msg += `📊 *SUMMARY AT A GLANCE:*\n`;
    msg += `💰 *Total Cash Deposited:* ₹${totalCash.toLocaleString('en-IN')}\n`;
    msg += `🟡 *Total 916 Gold Saved:* ${totalGrams.toFixed(3)} grams\n`;
    if (totalRedeemed > 0) {
      msg += `🎁 *Redeemed Gold:* ${totalRedeemed.toFixed(3)} grams\n`;
      msg += `⚖️ *Net Balance Gold:* ${(totalGrams - totalRedeemed).toFixed(3)} grams\n`;
    }
    if (todayRate > 0) {
      msg += `📈 *Today's 22K Gold Rate:* ₹${todayRate.toLocaleString('en-IN')}/g\n`;
      msg += `💎 *Current Valuation:* ₹${currentValuation.toLocaleString('en-IN')}\n`;
      if (customerGain > 0) {
        msg += `🎉 *Customer Gain:* +₹${customerGain.toLocaleString('en-IN')}\n`;
      }
    }
    msg += `------------------------------------\n`;

    // Last 5 installment entries
    const recent = filteredEntries.slice(-5);
    if (recent.length > 0) {
      msg += `📝 *Recent Installments (${recent.length}):*\n`;
      recent.forEach((ev: any) => {
        const isDep = ev.type === 'DEPOSIT' || (!ev.type && ev.grams_credited);
        const d = new Date(ev.date || ev.payment_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        });
        const amt = (ev.cash_in || ev.cash_amount || 0).toLocaleString('en-IN');
        const g = (ev.grams_in || ev.grams_credited || 0).toFixed(3);
        const bal = (ev.running_gold_grams || 0).toFixed(3);
        if (isDep) {
          msg += `• ${d} | ₹${amt} ➔ +${g}g (Bal: ${bal}g)\n`;
        } else {
          msg += `• ${d} | REDEEM -${(ev.grams_out || ev.grams_redeemed || 0).toFixed(3)}g\n`;
        }
      });
      msg += `------------------------------------\n`;
    }

    if (shop?.phone) msg += `📞 Ph: ${shop.phone}\n`;
    if (shop?.address) msg += `📍 ${shop.address}\n`;
    msg += `🙏 *Thank you for saving with us!*`;

    return msg;
  };

  const handleWhatsAppShare = () => {
    const text = generateWhatsAppMessage();
    const phone = account?.customer?.phone ? account.customer.phone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    toast.success('Passbook summary copied to clipboard!');
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl border-slate-200">
        {/* ========================================================= */}
        {/* TOP INTERACTIVE MODAL BAR                                 */}
        {/* ========================================================= */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Gold Scheme Passbook
                  </DialogTitle>
                  <span className="text-xs sm:text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-mono">
                    {account?.account_number || 'GS-XXXX'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-amber-800">தங்க சேமிப்பு கணக்கு</span>
                  <span>•</span>
                  <span>{account?.title || 'Flexi 916 Gold Scheme'}</span>
                </div>
              </div>
            </div>

            {/* Print & Share Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* WhatsApp Share Button */}
              <Button
                type="button"
                onClick={handleWhatsAppShare}
                variant="outline"
                className="h-9 px-3 text-xs font-bold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 gap-1.5 shadow-xs cursor-pointer"
                title="Send Passbook statement directly to customer via WhatsApp"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                WhatsApp Share
              </Button>

              {/* Copy Summary Button */}
              <Button
                type="button"
                onClick={handleCopyMessage}
                variant="outline"
                size="icon"
                className="h-9 w-9 text-slate-600 hover:text-slate-900 border-slate-200 cursor-pointer"
                title="Copy statement text"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>

              {/* Print Booklet (Entries Only) */}
              <Button
                type="button"
                onClick={() => printPassbook('BOOKLET_ENTRIES_ONLY')}
                variant="outline"
                className="h-9 px-3 text-xs font-bold border-amber-300 text-amber-900 bg-amber-50/60 hover:bg-amber-100 gap-1.5 shadow-xs cursor-pointer"
                title="Prints clean entry lines specifically formatted for pocket passbook booklets"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                Print Booklet
              </Button>

              {/* Print Full Statement (Tops + Entries + Somes) */}
              <Button
                type="button"
                onClick={() => printPassbook('STATEMENT')}
                className="h-9 px-3.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1.5 shadow-xs cursor-pointer"
                title="Prints professional A4/A5 statement with Header, Entries, and Summary"
              >
                <Printer className="w-4 h-4" />
                Print Statement
              </Button>
            </div>
          </DialogHeader>

          {/* Quick Date Range Filter Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Date Range:
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDateRange('ALL')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    dateRange === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All ({rawLedger.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('THIS_MONTH')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    dateRange === 'THIS_MONTH'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('LAST_3_MONTHS')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    dateRange === 'LAST_3_MONTHS'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Last 3 Months
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('CUSTOM')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    dateRange === 'CUSTOM'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Custom Date Pickers */}
            {dateRange === 'CUSTOM' && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold"
                />
                <span className="text-slate-400">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold"
                />
              </div>
            )}

            <div className="text-[11px] font-semibold text-slate-500">
              Showing <strong className="text-slate-800">{filteredEntries.length}</strong> of{' '}
              {rawLedger.length} entries
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCROLLABLE PASSBOOK DETAILS (Screen View)                 */}
        {/* ========================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-sm font-medium">Loading savings passbook...</span>
            </div>
          ) : !account ? (
            <div className="py-16 text-center text-sm font-semibold text-slate-500">
              Account not found
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer & Account Details */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                      {shop?.shop_name || 'Jewellery Store'}
                    </h2>
                    {shop?.gstin && (
                      <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        GST: {shop.gstin}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3">
                    {shop?.address && <span>{shop.address}</span>}
                    {shop?.phone && <span>Ph: {shop.phone}</span>}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    Gold Savings Passbook
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-800">
                    Acc #: {account.account_number}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Status:{' '}
                    <strong
                      className={
                        account.status === 'ACTIVE'
                          ? 'text-emerald-700'
                          : 'text-purple-700'
                      }
                    >
                      {account.status}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Customer Snapshot Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Customer Name
                  </span>
                  <strong className="text-slate-900 text-sm font-bold capitalize">
                    {account.customer?.name}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Phone / Place
                  </span>
                  <span className="text-slate-700 font-medium">
                    {account.customer?.phone}
                    {account.customer?.village ? ` (${account.customer.village})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Scheme Plan
                  </span>
                  <span className="text-slate-800 font-bold">
                    {account.title || 'Flexi 916 Scheme'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Opened Date
                  </span>
                  <span className="text-slate-700 font-medium">
                    {new Date(account.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* 4 SUMMARY KPI CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Available Gold */}
                <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-50 to-white border border-amber-300/80 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                    <span className="uppercase tracking-wider">Available 916 Gold</span>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-1.5">
                    {totalGrams.toFixed(3)}{' '}
                    <span className="text-sm font-bold text-amber-700">g</span>
                  </div>
                  <div className="text-[11px] text-amber-800 font-semibold mt-1">
                    22K Pure Weight
                  </div>
                </div>

                {/* Cash Deposited */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Total Cash Paid</span>
                    <Coins className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                    ₹{totalCash.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {account.payments?.length || 0} deposits
                  </div>
                </div>

                {/* Valuation */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span className="uppercase tracking-wider">Current Value</span>
                    {todayRate > 0 && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.5 rounded-md">
                        @₹{todayRate}/g
                      </span>
                    )}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                    ₹{currentValuation.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Market worth of {totalGrams.toFixed(3)}g
                  </div>
                </div>

                {/* Customer Gain */}
                <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-white border border-emerald-300 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    <span>Customer Gain</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1.5 flex items-center gap-1">
                    {customerGain >= 0
                      ? `+₹${customerGain.toLocaleString('en-IN')}`
                      : `₹${customerGain.toLocaleString('en-IN')}`}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-semibold mt-1">
                    Profit vs current rate
                  </div>
                </div>
              </div>

              {/* Passbook Entries Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    Passbook Ledger Entries
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {filteredEntries.length} entries shown
                  </span>
                </div>

                {filteredEntries.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-400">
                    No ledger entries found in the selected date range.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                          <th className="px-3 py-2 border-r border-slate-200 w-8 text-center">
                            #
                          </th>
                          <th className="px-3 py-2 border-r border-slate-200">
                            Date
                          </th>
                          <th className="px-3 py-2 border-r border-slate-200">
                            Receipt #
                          </th>
                          <th className="px-3 py-2 border-r border-slate-200 text-right">
                            Cash In/Out
                          </th>
                          <th className="px-3 py-2 border-r border-slate-200 text-right">
                            22K Rate
                          </th>
                          <th className="px-3 py-2 border-r border-slate-200 text-right font-black text-amber-900">
                            Gold Flow
                          </th>
                          <th className="px-3 py-2 border-r border-slate-200 text-right font-black text-amber-950">
                            Running Balance
                          </th>
                          <th className="px-3 py-2 text-center w-20">
                            Sign / Auth
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
                        {filteredEntries.map((ev: any, idx: number) => {
                          const isDeposit =
                            ev.type === 'DEPOSIT' || (!ev.type && ev.grams_credited);
                          const dateVal = ev.date || ev.payment_date;
                          const refVal = ev.ref_number || ev.receipt_number;
                          const rateVal = ev.rate_applied || ev.gold_rate_applied || 0;
                          const goldFlow = isDeposit
                            ? `+${(ev.grams_in || ev.grams_credited || 0).toFixed(3)} g`
                            : `-${(ev.grams_out || ev.grams_redeemed || 0).toFixed(3)} g`;
                          const cashFlow = isDeposit
                            ? `+₹${(ev.cash_in || ev.cash_amount || 0).toLocaleString('en-IN')}`
                            : `-₹${(ev.cash_out || 0).toLocaleString('en-IN')}`;
                          const runningBal =
                            ev.running_gold_grams ?? ev.running_grams_total ?? 0;

                          return (
                            <tr
                              key={ev.id || idx}
                              className={`transition-colors ${
                                isDeposit ? 'hover:bg-amber-50/20' : 'bg-purple-50/20'
                              }`}
                            >
                              <td className="px-3 py-2 border-r border-slate-200 text-center text-slate-500 font-mono">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 whitespace-nowrap font-medium">
                                {new Date(dateVal).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 font-mono font-bold whitespace-nowrap">
                                {refVal}
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 text-right font-bold whitespace-nowrap">
                                <span
                                  className={
                                    isDeposit ? 'text-slate-900' : 'text-purple-900 font-black'
                                  }
                                >
                                  {cashFlow}
                                </span>
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 text-right whitespace-nowrap">
                                ₹{rateVal.toLocaleString('en-IN')}/g
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 text-right whitespace-nowrap font-black">
                                <span
                                  className={
                                    isDeposit ? 'text-amber-800' : 'text-purple-900'
                                  }
                                >
                                  {goldFlow}
                                </span>
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 text-right font-mono font-black text-amber-950 whitespace-nowrap">
                                {runningBal.toFixed(3)} g
                              </td>
                              <td className="px-3 py-2 text-center text-slate-400 text-[10px]">
                                {ev.created_by?.name || '✓'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Single Glance Totals Box ("Somes") */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Total Cash Deposited
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    ₹{totalCash.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">
                    Total 916 Gold Saved
                  </span>
                  <span className="text-base font-black text-amber-950 font-mono">
                    {totalGrams.toFixed(3)} grams
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Today's Valuation (@₹{todayRate}/g)
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    ₹{currentValuation.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                    Customer Net Profit
                  </span>
                  <span className="text-base font-black text-emerald-800 font-mono">
                    +₹{customerGain.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* PINNED MODAL FOOTER                                       */}
        {/* ========================================================= */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span>Passbook Ledger:</span>
            <strong className="text-slate-800">{filteredEntries.length} entries</strong>
            {totalGrams > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-800 font-bold">
                  Balance: {totalGrams.toFixed(3)}g
                </span>
              </>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8.5 px-4 text-xs font-bold border-slate-300 hover:bg-slate-100 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
