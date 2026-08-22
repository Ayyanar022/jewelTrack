'use client';

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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { use, useState } from 'react';
import { toast } from 'sonner';

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [addPayment, setAddPayment] = useState('');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

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
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/billing/new?tab=history')}>
          Back to Billing History
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/billing/new?tab=history')}
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to History"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-black text-slate-900">{billDetail.bill_number}</span>
              <Badge
                variant="outline"
                className={`text-sm font-bold px-3 py-0.5 rounded-md ${
                  isFullyPaid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                {isFullyPaid ? 'Fully Paid' : 'Balance Pending'}
              </Badge>
              {billDetail.is_gst_bill && (
                <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-300 text-sm font-bold">
                  GST Invoice
                </Badge>
              )}
            </div>
            <div className="text-sm text-slate-600 font-medium flex items-center gap-2.5 mt-1">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span>
                {new Date(billDetail.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              {billDetail.created_by?.name && (
                <span>• Billed by: <strong className="text-slate-800 font-bold">{billDetail.created_by.name}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!isFullyPaid && (
            <Button
              onClick={() => {
                setAddPayment(String(balanceAmount));
                setOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-10 px-5 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Add Payment</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => window.open(`/print/${billDetail.id}`, '_blank')}
            className="border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-sm h-10 px-5 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Print Invoice</span>
          </Button>
        </div>
      </div>

      {/* Customer Profile & Payment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Customer Info Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-slate-600" />
            <span>Customer Details</span>
          </div>
          <div className="font-bold text-slate-900 text-lg">{billDetail.customer?.name || 'Walk-in Customer'}</div>
          <div className="text-sm font-bold text-slate-800 flex items-center gap-2 font-mono">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>{billDetail.customer?.phone || 'No phone'}</span>
          </div>
          {(billDetail.customer?.village || billDetail.customer?.address) && (
            <div className="text-sm text-slate-700 flex items-start gap-2 pt-0.5">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                {billDetail.customer?.village} {billDetail.customer?.address ? `• ${billDetail.customer.address}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Invoice Breakdown Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 text-sm">
          <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Amount Breakdown</div>
          <div className="flex justify-between text-slate-700 pt-1">
            <span>Items Subtotal:</span>
            <span className="font-mono font-bold text-slate-900 text-base">₹ {Math.round(Number(billDetail.total_amount || 0)).toLocaleString('en-IN')}</span>
          </div>
          {Number(billDetail.discount) > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Discount:</span>
              <span className="font-mono font-bold text-base">-₹ {Math.round(Number(billDetail.discount)).toLocaleString('en-IN')}</span>
            </div>
          )}
          {billDetail.is_gst_bill && Number(billDetail.totalGST) > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>GST Total (3%):</span>
              <span className="font-mono font-bold text-slate-900 text-base">₹ {Math.round(Number(billDetail.totalGST)).toLocaleString('en-IN')}</span>
            </div>
          )}
          {oldJewelAmount > 0 && (
            <div className="flex justify-between text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded font-bold">
              <span>Old Jewel Credit:</span>
              <span className="font-mono font-bold text-base">-₹ {Math.round(oldJewelAmount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-900 text-base">
            <span>Net Payable:</span>
            <span className="font-mono text-lg text-slate-900">₹ {Math.round(payableAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Settlement Status Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span>Settlement Summary</span>
            {isFullyPaid ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Cleared
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-900 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                Pending
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-xs uppercase font-bold text-slate-600">Paid Amount</div>
              <div className="text-base font-black font-mono text-emerald-700 mt-1">
                ₹ {Math.round(totalPaidAmount).toLocaleString('en-IN')}
              </div>
            </div>
            <div className={`p-3 rounded-lg border text-center ${balanceAmount > 0 ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>
              <div className={`text-xs uppercase font-bold ${balanceAmount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {balanceAmount > 0 ? 'Balance Due' : 'Balance'}
              </div>
              <div className={`text-base font-black font-mono mt-1 ${balanceAmount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                ₹ {balanceAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          {billDetail.notes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800">Note:</span> {billDetail.notes}
            </div>
          )}
        </div>
      </div>

      {/* Bill Line Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Purchased Jewellery Items ({billDetail.billItem?.length || 0})</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center border border-slate-200">#</th>
                <th className="px-4 py-3 border border-slate-200">Item Description</th>
                <th className="px-4 py-3 text-center border border-slate-200">Metal</th>
                <th className="px-4 py-3 text-center border border-slate-200">Purity</th>
                <th className="px-4 py-3 text-right border border-slate-200">Gross Wt</th>
                <th className="px-4 py-3 text-right border border-slate-200">Stone</th>
                <th className="px-4 py-3 text-right border border-slate-200 font-black text-slate-900">Net Wt</th>
                <th className="px-4 py-3 text-right border border-slate-200">Wastage</th>
                <th className="px-4 py-3 text-right border border-slate-200">MC (₹)</th>
                <th className="px-4 py-3 text-right border border-slate-200">Rate / g</th>
                <th className="px-4 py-3 text-right border border-slate-200 font-black text-slate-900">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billDetail.billItem?.map((item: any, i: number) => (
                <tr key={item.id || i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-center text-slate-500 border border-slate-200 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 border border-slate-200">
                    {item.category?.name || 'Jewellery Item'}
                  </td>
                  <td className="px-4 py-3 text-center border border-slate-200">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.metal === 'SILVER' ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-950'}`}>
                      {item.metal}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center border border-slate-200 font-medium">
                    {item.purity || '—'}
                  </td>
                  <td className="px-4 py-3 text-right border border-slate-200 font-mono text-slate-700">
                    {item.gross_weight}g
                  </td>
                  <td className="px-4 py-3 text-right border border-slate-200 font-mono text-slate-500">
                    {item.stone ? `${item.stone}g` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right border border-slate-200 font-mono font-black text-slate-900">
                    {item.net_weight}g
                  </td>
                  <td className="px-4 py-3 text-right border border-slate-200 font-mono text-slate-700">
                    {item.wastage ? `${item.wastage}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right border border-slate-200 font-mono text-slate-700">
                    ₹ {Number(item.making_charge || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right border border-slate-200 font-mono text-slate-700">
                    ₹ {Number(item.rate || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right border border-slate-200 font-mono font-bold text-slate-900 text-base">
                    ₹ {Math.round(Number(item.amount || 0)).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Layout: Old Jewel & Payments Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Old Gold / Exchange Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>🪙</span>
              <span>Old Jewel Exchange ({billDetail.oldGoldEntry?.length || 0})</span>
            </span>
            {oldJewelAmount > 0 && (
              <span className="text-sm font-black font-mono text-emerald-800">
                Total: ₹ {Math.round(oldJewelAmount).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {billDetail.oldGoldEntry?.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 font-medium">
              No old jewellery was exchanged on this bill.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 uppercase text-slate-700 font-bold text-xs border-b border-slate-200">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3 text-center">Purity</th>
                    <th className="p-3 text-right">Weight</th>
                    <th className="p-3 text-right">Rate / g</th>
                    <th className="p-3 text-right font-black">Credit Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billDetail.oldGoldEntry?.map((og: any, idx: number) => (
                    <tr key={og.id || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{og.item_name}</td>
                      <td className="p-3 text-center font-medium text-slate-700">{og.purity || '—'}</td>
                      <td className="p-3 text-right font-mono text-slate-700">{og.weight}g</td>
                      <td className="p-3 text-right font-mono text-slate-700">₹ {Number(og.rate).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-800 text-base">
                        ₹ {Math.round(Number(og.amount)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Receipts Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>💳</span>
              <span>Payment Entries ({billDetail.billPaymentsEntry?.length || 0})</span>
            </span>
            <span className="text-sm font-black font-mono text-emerald-800">
              Total Paid: ₹ {Math.round(totalPaidAmount).toLocaleString('en-IN')}
            </span>
          </div>
          {billDetail.billPaymentsEntry?.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 font-medium">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 uppercase text-slate-700 font-bold text-xs border-b border-slate-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Recorded By</th>
                    <th className="p-3 text-right font-black">Paid Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billDetail.billPaymentsEntry?.map((p: any, idx: number) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-700 font-mono">
                        {new Date(p.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 text-slate-800 font-medium">
                        {p.created_by?.name || 'Staff'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-800 text-base">
                        ₹ {Math.round(Number(p.paid_amount)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-w-md w-[95vw] p-6 text-slate-900">
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
    </div>
  );
}