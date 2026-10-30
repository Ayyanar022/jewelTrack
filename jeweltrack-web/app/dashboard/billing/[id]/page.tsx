'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  MapPin,
  Phone,
  User,
  Loader2,
  ArrowLeft,
  Printer,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit2,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { use, useState } from 'react';
import { toast } from 'sonner';

function BillDetailPageContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [addPayment, setAddPayment] = useState('');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState('');
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const customerId = searchParams.get('customerId');

  const handleBack = () => {
    if (from === 'customer' && customerId) {
      router.push(`/dashboard/customers/customerView?id=${customerId}`);
    } else if (from === 'customer') {
      router.push('/dashboard/customers');
    } else {
      router.push('/dashboard/billing/new?tab=history');
    }
  };

  // Fetch bill data with payments, old gold, items, customer
  const { data: billDetail, isLoading, error } = useQuery({
    queryKey: ['bill-detail-payment-entry', resolvedParams.id],
    queryFn: async () => api.get(`/bill/bill-detail-payment-entry/${resolvedParams.id}`).then((r) => r.data),
  });

  // Calculate total paid amount
  const totalPaidAmount =
    billDetail?.billPaymentsEntry?.reduce(
      (acc: number, cur: any) => acc + Number(cur.paid_amount || 0),
      0
    ) || 0;

  // Calculation for old jewel credit
  const oldJewelAmount =
    billDetail?.oldGoldEntry?.reduce(
      (total: number, curr: any) => Number(curr?.amount || 0) + total,
      0
    ) || 0;

  const payableAmount = Number(billDetail?.payableAmount || 0);
  const totalCredited = totalPaidAmount + oldJewelAmount;
  const balanceAmount = Math.max(0, Math.round(payableAmount - totalCredited));
  const isFullyPaid = balanceAmount <= 0;

  // Record payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const paymentAmount = Number(addPayment);

      if (!paymentAmount || paymentAmount <= 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }

      if (paymentAmount > balanceAmount) {
        toast.error(`Payment cannot exceed outstanding balance: ₹${balanceAmount.toLocaleString('en-IN')}`);
        return;
      }

      setIsSubmitting(true);
      await api.post(`/bill/payment/bill-add-entry/${resolvedParams.id}`, {
        addPayment: paymentAmount,
      });

      queryClient.invalidateQueries({ queryKey: ['bill-detail-payment-entry'] });
      queryClient.invalidateQueries({ queryKey: ['bill-history'] });
      setAddPayment('');
      setOpen(false);
      toast.success('Payment recorded successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDateModal = () => {
    if (!billDetail?.created_at) return;
    const d = new Date(billDetail.created_at);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedInvoiceDate(`${y}-${m}-${day}`);
    setDateModalOpen(true);
  };

  const handleUpdateBillDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceDate) {
      toast.error('Please pick a valid date');
      return;
    }
    try {
      setIsUpdatingDate(true);
      const now = new Date();
      const [y, m, d] = selectedInvoiceDate.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());

      await api.patch(`/bill/${resolvedParams.id}/date`, {
        bill_date: targetDate.toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: ['bill-detail-payment-entry'] });
      queryClient.invalidateQueries({ queryKey: ['bill-history'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Invoice date updated successfully!');
      setDateModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to update invoice date');
    } finally {
      setIsUpdatingDate(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        <span className="text-base font-bold text-slate-700">Loading invoice details...</span>
      </div>
    );
  }

  if (error || !billDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-lg font-bold text-rose-600">Failed to load bill details.</p>
        <Button variant="outline" size="sm" onClick={handleBack}>
          {from === 'customer' ? 'Back to Customer Profile' : 'Back to Billing History'}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-3.5 sm:space-y-5 pb-12 px-2 sm:px-4 lg:px-8">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title={from === 'customer' ? 'Back to Customer Profile' : 'Back to History'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-lg sm:text-xl font-black text-slate-900">{billDetail.bill_number}</span>
              <Badge
                variant="outline"
                className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md ${
                  isFullyPaid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                {isFullyPaid ? 'Fully Paid' : 'Balance Pending'}
              </Badge>
              {billDetail.is_gst_bill && (
                <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-300 text-[10px] sm:text-xs font-bold px-2 py-0.5">
                  GST Invoice
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                {new Date(billDetail.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <button
                type="button"
                onClick={handleOpenDateModal}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 transition-colors cursor-pointer"
                title="Change invoice date"
              >
                <Edit2 className="w-2.5 h-2.5 text-amber-700" />
                <span>Change Date</span>
              </button>
              {billDetail.created_by?.name && (
                <span className="hidden sm:inline">• Billed by: <strong className="text-slate-800 font-bold">{billDetail.created_by.name}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!isFullyPaid && (
            <Button
              onClick={() => {
                setAddPayment(String(balanceAmount));
                setOpen(true);
              }}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 rounded-lg shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Add Payment</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => window.open(`/print/${billDetail.id}`, '_blank')}
            className="flex-1 sm:flex-none border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print Invoice</span>
          </Button>
        </div>
      </div>

      {/* Customer Profile & Payment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Customer Info Card */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span>Customer Details</span>
          </div>
          <div className="font-bold text-slate-900 text-sm sm:text-base truncate">{billDetail.customer?.name || 'Walk-in Customer'}</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{billDetail.customer?.phone || 'No phone'}</span>
          </div>
          {(billDetail.customer?.village || billDetail.customer?.address) && (
            <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span className="truncate">
                {billDetail.customer?.village} {billDetail.customer?.address ? `• ${billDetail.customer.address}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Invoice Breakdown Card */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs sm:text-sm">
          <div className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 tracking-wider">Amount Breakdown</div>
          <div className="flex justify-between text-slate-600 pt-0.5">
            <span>Items Subtotal:</span>
            <span className="font-mono font-bold text-slate-900">₹ {Math.round(Number(billDetail.total_amount || 0)).toLocaleString('en-IN')}</span>
          </div>
          {Number(billDetail.discount) > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Discount:</span>
              <span className="font-mono font-bold">-₹ {Math.round(Number(billDetail.discount)).toLocaleString('en-IN')}</span>
            </div>
          )}
          {billDetail.is_gst_bill && Number(billDetail.totalGST) > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>GST Total (3%):</span>
              <span className="font-mono font-bold text-slate-900">₹ {Math.round(Number(billDetail.totalGST)).toLocaleString('en-IN')}</span>
            </div>
          )}
          {oldJewelAmount > 0 && (
            <div className="flex justify-between text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold text-xs">
              <span>Old Jewel Credit:</span>
              <span className="font-mono font-bold">-₹ {Math.round(oldJewelAmount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-slate-900 text-xs sm:text-sm">
            <span>Net Payable (To Pay):</span>
            <span className="font-mono text-sm sm:text-base font-bold text-slate-900">₹ {Math.round(Math.max(0, payableAmount - oldJewelAmount)).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Settlement Status Card */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span>Settlement Summary</span>
            {isFullyPaid ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-[10px] sm:text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Cleared
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-900 font-bold text-[10px] sm:text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Clock className="w-3 h-3" />
                Pending
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Paid Amount</div>
              <div className="text-xs sm:text-sm font-black font-mono text-emerald-700 mt-0.5">
                ₹ {Math.round(totalPaidAmount).toLocaleString('en-IN')}
              </div>
            </div>
            <div className={`p-2 sm:p-2.5 rounded-lg border text-center ${balanceAmount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className={`text-[10px] uppercase font-bold ${balanceAmount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {balanceAmount > 0 ? 'Balance Due' : 'Balance'}
              </div>
              <div className={`text-xs sm:text-sm font-black font-mono mt-0.5 ${balanceAmount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                ₹ {balanceAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          {billDetail.notes && (
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 truncate">
              <span className="font-bold text-slate-800">Note:</span> {billDetail.notes}
            </div>
          )}
        </div>
      </div>

      {/* Bill Line Items Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Purchased Jewellery Items ({billDetail.billItem?.length || 0})</span>
          </span>
        </div>

        {/* Mobile View: Clean Compact Cards (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {billDetail.billItem?.map((item: any, i: number) => (
            <div key={item.id || i} className="p-3 space-y-2 bg-white">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    #{i + 1}
                  </span>
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {item.category?.name || 'Jewellery Item'}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${item.metal === 'SILVER' ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-950'}`}>
                    {item.metal} {item.purity || ''}
                  </span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-900 shrink-0">
                  ₹ {Math.round(Number(item.amount || 0)).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-4 gap-1 bg-slate-50 p-2 rounded-lg text-center text-[10px]">
                <div>
                  <span className="text-slate-400 block font-medium">Net Wt</span>
                  <strong className="font-mono text-slate-900">{item.net_weight}g</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Gross</span>
                  <strong className="font-mono text-slate-700">{item.gross_weight}g</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Wastage/MC</span>
                  <strong className="font-mono text-slate-700">
                    {item.wastage ? `${item.wastage}%` : '0%'} · ₹{Number(item.making_charge || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Rate/g</span>
                  <strong className="font-mono text-slate-700">₹{Number(item.rate || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[800px]">
            <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-[10px] sm:text-xs border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-12 text-center border border-slate-200">#</th>
                <th className="px-3 py-2.5 border border-slate-200">Item Description</th>
                <th className="px-3 py-2.5 text-center border border-slate-200">Metal</th>
                <th className="px-3 py-2.5 text-center border border-slate-200">Purity</th>
                <th className="px-3 py-2.5 text-right border border-slate-200">Gross Wt</th>
                <th className="px-3 py-2.5 text-right border border-slate-200">Stone</th>
                <th className="px-3 py-2.5 text-right border border-slate-200 font-black text-slate-900">Net Wt</th>
                <th className="px-3 py-2.5 text-right border border-slate-200">Wastage</th>
                <th className="px-3 py-2.5 text-right border border-slate-200">MC (₹)</th>
                <th className="px-3 py-2.5 text-right border border-slate-200">Rate / g</th>
                <th className="px-3 py-2.5 text-right border border-slate-200 font-black text-slate-900">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billDetail.billItem?.map((item: any, i: number) => (
                <tr key={item.id || i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 text-center text-slate-500 border border-slate-200 font-medium">{i + 1}</td>
                  <td className="px-3 py-2 font-bold text-slate-900 border border-slate-200">
                    {item.category?.name || 'Jewellery Item'}
                  </td>
                  <td className="px-3 py-2 text-center border border-slate-200">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.metal === 'SILVER' ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-950'}`}>
                      {item.metal}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center border border-slate-200 font-medium">
                    {item.purity || '—'}
                  </td>
                  <td className="px-3 py-2 text-right border border-slate-200 font-mono text-slate-700">
                    {item.gross_weight}g
                  </td>
                  <td className="px-3 py-2 text-right border border-slate-200 font-mono text-slate-500">
                    {item.stone ? `${item.stone}g` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right border border-slate-200 font-mono font-black text-slate-900">
                    {item.net_weight}g
                  </td>
                  <td className="px-3 py-2 text-right border border-slate-200 font-mono text-slate-700">
                    {item.wastage ? `${item.wastage}%` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right border border-slate-200 font-mono text-slate-700">
                    ₹ {Number(item.making_charge || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2 text-right border border-slate-200 font-mono text-slate-700">
                    ₹ {Number(item.rate || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2 text-right border border-slate-200 font-mono font-bold text-slate-900 text-sm">
                    ₹ {Math.round(Number(item.amount || 0)).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Layout: Old Jewel & Payments Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Old Gold / Exchange Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>🪙</span>
              <span>Old Jewel Exchange ({billDetail.oldGoldEntry?.length || 0})</span>
            </span>
            {oldJewelAmount > 0 && (
              <span className="text-xs sm:text-sm font-black font-mono text-emerald-800">
                Total: ₹ {Math.round(oldJewelAmount).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {billDetail.oldGoldEntry?.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-medium">
              No old jewellery was exchanged on this bill.
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-slate-100">
                {billDetail.oldGoldEntry?.map((og: any, idx: number) => (
                  <div key={og.id || idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{og.item_name} <span className="text-[10px] text-slate-500 font-normal">({og.purity || '—'})</span></div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{og.weight}g @ ₹{Number(og.rate).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-800 text-xs">
                      ₹ {Math.round(Number(og.amount)).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[480px]">
                  <thead className="bg-slate-50 uppercase text-slate-700 font-bold text-[10px] sm:text-xs border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 sm:p-3">Item</th>
                      <th className="p-2.5 sm:p-3 text-center">Purity</th>
                      <th className="p-2.5 sm:p-3 text-right">Weight</th>
                      <th className="p-2.5 sm:p-3 text-right">Rate / g</th>
                      <th className="p-2.5 sm:p-3 text-right font-black">Credit Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {billDetail.oldGoldEntry?.map((og: any, idx: number) => (
                      <tr key={og.id || idx} className="hover:bg-slate-50">
                        <td className="p-2.5 sm:p-3 font-bold text-slate-900">{og.item_name}</td>
                        <td className="p-2.5 sm:p-3 text-center font-medium text-slate-700">{og.purity || '—'}</td>
                        <td className="p-2.5 sm:p-3 text-right font-mono text-slate-700">{og.weight}g</td>
                        <td className="p-2.5 sm:p-3 text-right font-mono text-slate-700">₹ {Number(og.rate).toLocaleString('en-IN')}</td>
                        <td className="p-2.5 sm:p-3 text-right font-mono font-bold text-emerald-800 text-xs sm:text-sm">
                          ₹ {Math.round(Number(og.amount)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Payment Receipts Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>💳</span>
              <span>Payment Entries ({billDetail.billPaymentsEntry?.length || 0})</span>
            </span>
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-800">
              Total: ₹ {Math.round(totalPaidAmount).toLocaleString('en-IN')}
            </span>
          </div>
          {billDetail.billPaymentsEntry?.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-medium">
              No payments recorded yet.
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-slate-100">
                {billDetail.billPaymentsEntry?.map((p: any, idx: number) => (
                  <div key={p.id || idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-slate-800">
                        {new Date(p.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500">By {p.created_by?.name || 'Staff'}</div>
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-800 text-xs">
                      ₹ {Math.round(Number(p.paid_amount)).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[360px]">
                  <thead className="bg-slate-50 uppercase text-slate-700 font-bold text-[10px] sm:text-xs border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 sm:p-3">Date</th>
                      <th className="p-2.5 sm:p-3">Recorded By</th>
                      <th className="p-2.5 sm:p-3 text-right font-black">Paid Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {billDetail.billPaymentsEntry?.map((p: any, idx: number) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50">
                        <td className="p-2.5 sm:p-3 font-medium text-slate-700 font-mono">
                          {new Date(p.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-2.5 sm:p-3 text-slate-800 font-medium">
                          {p.created_by?.name || 'Staff'}
                        </td>
                        <td className="p-2.5 sm:p-3 text-right font-mono font-bold text-emerald-800 text-xs sm:text-sm">
                          ₹ {Math.round(Number(p.paid_amount)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Record Payment ({billDetail.bill_number})</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Collect partial or full settlement for customer invoice.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Payable:</span>
                <span className="font-bold font-mono text-slate-900 text-base">₹ {Math.round(payableAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Paid + Old Gold:</span>
                <span className="font-bold font-mono text-emerald-700 text-base">₹ {Math.round(totalCredited).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-rose-700 text-base">
                <span>Remaining Balance:</span>
                <span className="font-mono text-lg">₹ {balanceAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-800">Amount Received (₹) *</Label>
              <Input
                type="number"
                min={1}
                max={balanceAmount}
                value={addPayment}
                onChange={(e) => setAddPayment(e.target.value)}
                placeholder="e.g. 5000"
                className="h-11 text-lg font-bold font-mono"
                autoFocus
                required
              />
              {Number(addPayment) > balanceAmount && (
                <p className="text-xs font-bold text-rose-600">
                  Amount cannot exceed remaining balance (₹{balanceAmount.toLocaleString('en-IN')})
                </p>
              )}
            </div>

            <DialogFooter className="pt-3 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="h-10 px-5 text-sm font-bold">
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !addPayment || Number(addPayment) <= 0 || Number(addPayment) > balanceAmount}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-10 px-6 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Confirm & Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Date Modal */}
      <Dialog open={dateModalOpen} onOpenChange={setDateModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto bg-white p-4 sm:p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-600" />
              <span>Change Invoice Date</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateBillDate} className="space-y-4 pt-3">
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              Update the official date for invoice <strong className="font-mono">{billDetail.bill_number}</strong>. This date will reflect on reports, customer purchase history, and printed receipts.
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-800">New Invoice Date *</Label>
              <Input
                type="date"
                value={selectedInvoiceDate}
                onChange={(e) => setSelectedInvoiceDate(e.target.value)}
                className="h-11 text-base font-bold"
                required
              />
            </div>

            <DialogFooter className="pt-3 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDateModalOpen(false)} className="h-10 px-5 text-sm font-bold">
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdatingDate || !selectedInvoiceDate}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm h-10 px-6 shadow-sm cursor-pointer"
              >
                {isUpdatingDate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Date'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-96 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
          <span className="text-base font-bold text-slate-700">Loading invoice details...</span>
        </div>
      }
    >
      <BillDetailPageContent params={params} />
    </Suspense>
  );
}