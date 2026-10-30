'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ViewLoanModalProps {
  loan: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewLoanModal({ loan, open, onOpenChange }: ViewLoanModalProps) {
  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-w-3xl w-[calc(100vw-2rem)] p-3.5 sm:p-6 max-h-[88dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm sm:text-xl font-black text-slate-900 flex items-center justify-between gap-2">
            <span className="truncate">Loan Details: {loan.loan_number}</span>
            <Badge
              variant="outline"
              className={`text-[10px] sm:text-xs font-bold uppercase px-2 sm:px-3 py-0.5 shrink-0 ${
                loan.status === 'ACTIVE'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
            >
              {loan.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="sr-only">
            View pledge history, collateral items, and repayment vouchers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 pt-1">
          {/* Customer & Pledge info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Customer Details</div>
              <div className="font-black text-slate-900 text-sm sm:text-lg">{loan.customer?.name}</div>
              <div className="font-mono text-slate-700 text-xs sm:text-sm font-bold">{loan.customer?.phone}</div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium">
                {loan.customer?.village} {loan.customer?.address ? `• ${loan.customer?.address}` : ''}
              </div>
            </div>

            <div className="space-y-1 text-left sm:text-right">
              <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Financial Terms</div>
              <div className="font-black font-mono text-slate-900 text-base sm:text-2xl">
                Principal: ₹{loan.loan_amount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs sm:text-base text-slate-800 font-bold">Interest: {loan.interest_rate}% / month</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Pledged on{' '}
                {new Date(loan.loan_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Ornaments List */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 uppercase text-[10px] sm:text-xs tracking-wider">Collateral Ornaments (அடகு விவரம்):</span>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[480px]">
                <thead className="bg-slate-100 uppercase font-bold text-slate-700 text-[10px] sm:text-xs">
                  <tr>
                    <th className="p-2 sm:p-3">Metal</th>
                    <th className="p-2 sm:p-3">Item Description</th>
                    <th className="p-2 sm:p-3">Purity</th>
                    <th className="p-2 sm:p-3 text-center">Qty</th>
                    <th className="p-2 sm:p-3 text-right">Gross Wt</th>
                    <th className="p-2 sm:p-3 text-right">Net Wt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loan.loanCollateralItem?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2 sm:p-3">
                        <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded ${item.metal === 'SILVER' ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900'}`}>
                          {item.metal === 'SILVER' ? 'Silver' : 'Gold'}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 font-bold text-slate-900">{item.description}</td>
                      <td className="p-2 sm:p-3 font-bold">{item.metal === 'SILVER' ? '—' : (item.purity || 'K22')}</td>
                      <td className="p-2 sm:p-3 text-center font-bold text-slate-900">{item.pieces}</td>
                      <td className="p-2 sm:p-3 text-right font-medium text-slate-700">{item.gross_weight}g</td>
                      <td className="p-2 sm:p-3 text-right font-black text-slate-900 text-xs sm:text-sm font-mono">{item.net_weight}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Repayments History */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 uppercase text-[10px] sm:text-xs tracking-wider">Repayment History:</span>
            {loan.loanRepayment?.length === 0 ? (
              <div className="text-slate-400 text-center py-5 bg-slate-50 rounded-xl text-xs font-medium">
                No payments recorded yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[480px]">
                  <thead className="bg-slate-100 uppercase font-bold text-slate-700 text-[10px] sm:text-xs">
                    <tr>
                      <th className="p-2 sm:p-3">Payment Date</th>
                      <th className="p-2 sm:p-3 text-right">Interest Paid</th>
                      <th className="p-2 sm:p-3 text-right">Principal Paid</th>
                      <th className="p-2 sm:p-3 text-right">Discount</th>
                      <th className="p-2 sm:p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loan.loanRepayment?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-2 sm:p-3 text-slate-700 font-medium">
                          {new Date(r.payment_date || r.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-2 sm:p-3 text-right font-black text-emerald-700 text-xs sm:text-sm font-mono">₹{r.interest_paid.toLocaleString('en-IN')}</td>
                        <td className="p-2 sm:p-3 text-right font-black text-blue-700 text-xs sm:text-sm font-mono">₹{r.principal_paid.toLocaleString('en-IN')}</td>
                        <td className="p-2 sm:p-3 text-right font-black text-amber-800 text-xs sm:text-sm font-mono">
                          {r.discount_amount ? `₹${r.discount_amount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="p-2 sm:p-3 text-slate-600 font-medium text-[11px]">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
