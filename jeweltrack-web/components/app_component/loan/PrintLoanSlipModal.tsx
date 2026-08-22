'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Printer } from 'lucide-react';

interface PrintLoanSlipModalProps {
  loan: any | null;
  shopProfile: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PrintLoanSlipModal({
  loan,
  shopProfile,
  open,
  onOpenChange,
}: PrintLoanSlipModalProps) {
  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-md w-[95vw] p-6 text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-gold" />
            Print Pledge Voucher
          </DialogTitle>
          <DialogDescription className="sr-only">
            Printable gold and silver loan pledge slip and pawn receipt
          </DialogDescription>
        </DialogHeader>

        <div id="printable-pawn-slip" className="space-y-4 font-mono text-xs border border-slate-300 p-5 rounded-2xl bg-white">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-1">
            <h2 className="text-base font-black uppercase tracking-wider">{shopProfile?.shop_name || 'JEWELLERY SHOWROOM'}</h2>
            <div className="text-xs text-slate-600">{shopProfile?.address || 'Gold & Silver Merchant & Pawnbroker'}</div>
            <div className="text-xs font-bold">Ph: {shopProfile?.phone || ''}</div>
            <div className="text-xs font-black uppercase pt-1 tracking-widest text-gold">JEWEL LOAN PLEDGE RECEIPT (அடகு ரசீது)</div>
          </div>

          {/* Loan & Customer info */}
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-2.5">
            <div>
              <div><strong>Loan No:</strong> {loan.loan_number}</div>
              <div><strong>Date:</strong> {new Date(loan.loan_date).toLocaleDateString('en-IN')}</div>
            </div>
            <div className="text-right">
              <div><strong>Packet:</strong> {loan.notes || '—'}</div>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300 pb-2.5 space-y-0.5">
            <div><strong>Customer:</strong> {loan.customer?.name}</div>
            <div><strong>Mobile:</strong> {loan.customer?.phone}</div>
            <div><strong>Address:</strong> {loan.customer?.village || ''} {loan.customer?.address || ''}</div>
          </div>

          {/* Items */}
          <div className="border-b border-dashed border-slate-300 pb-2.5 space-y-1">
            <div className="font-bold uppercase text-[11px]">Pledged Items (அடகு விவரம்):</div>
            {loan.loanCollateralItem?.map((i: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span>[{i.metal === 'SILVER' ? 'Silver' : 'Gold'}] {i.pieces > 1 ? `${i.pieces}x ` : ''}{i.description} {i.purity ? `(${i.purity})` : ''}</span>
                <span>Net: {i.net_weight}g</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-1.5 text-slate-900 border-t border-slate-200">
              <span>Total Net Weight:</span>
              <span>{loan.net_weight} g</span>
            </div>
          </div>

          {/* Financials */}
          <div className="border-b border-dashed border-slate-300 pb-2.5 space-y-1">
            <div className="flex justify-between text-sm font-black">
              <span>Loan Principal (அசல்):</span>
              <span>₹{loan.loan_amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Interest Rate:</span>
              <span>{loan.interest_rate}% / month</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 flex justify-between text-[11px] text-center font-bold">
            <div className="border-t border-slate-400 pt-1 w-28">Customer Signature</div>
            <div className="border-t border-slate-400 pt-1 w-28">Authorized Signatory</div>
          </div>
        </div>

        <DialogFooter className="pt-2 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="bg-gold hover:bg-gold/90 text-white font-bold px-5"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Slip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
