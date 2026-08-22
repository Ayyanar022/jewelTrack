'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';

interface RepayLoanModalProps {
  loan: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RepayLoanModal({ loan, open, onOpenChange }: RepayLoanModalProps) {
  const queryClient = useQueryClient();

  const [interestPaid, setInterestPaid] = useState('');
  const [principalPaid, setPrincipalPaid] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [repayNotes, setRepayNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (loan) {
      setInterestPaid(String(loan.pending_interest ?? 0));
      setPrincipalPaid('');
      setDiscountAmount('');
      setRepayNotes('');
      setIsClosing(false);
    }
  }, [loan]);

  const repayMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post(`/loan/${loan.id}/repay`, payload);
    },
    onSuccess: (res) => {
      toast.success(
        res.data?.status === 'CLOSED'
          ? '🎉 Loan fully settled & closed! Return pledged items.'
          : 'Payment recorded successfully!',
      );
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-stats'] });
      queryClient.invalidateQueries({ queryKey: ['loan-stats-today'] });
      queryClient.invalidateQueries({ queryKey: ['customer-loans'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to record repayment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    const principalNum = Number(principalPaid) || 0;
    const interestNum = Number(interestPaid) || 0;
    const discountNum = Number(discountAmount) || 0;

    if (principalNum > loan.current_principal_balance) {
      toast.error(
        `Principal payment (₹${principalNum.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${loan.current_principal_balance.toLocaleString('en-IN')})`,
      );
      return;
    }

    if (interestNum > loan.pending_interest && loan.pending_interest >= 0) {
      toast.error(
        `Interest payment (₹${interestNum.toLocaleString('en-IN')}) cannot exceed accrued pending interest (₹${loan.pending_interest.toLocaleString('en-IN')})`,
      );
      return;
    }

    if (interestNum === 0 && principalNum === 0 && !isClosing) {
      toast.error('Enter interest or principal amount to record payment');
      return;
    }

    const payload = {
      interest_paid: interestNum,
      principal_paid: principalNum,
      discount_amount: discountNum,
      notes: repayNotes,
      is_closing: isClosing,
    };

    repayMutation.mutate(payload);
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-w-xl w-[95vw] p-7">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Record Repayment ({loan.loan_number})
          </DialogTitle>
          <DialogDescription className="sr-only">
            Record monthly interest or principal settlement for gold loan
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Summary Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Customer:</span>
              <span className="font-black text-slate-900 text-base">{loan.customer?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Outstanding Principal (அசல்):</span>
              <span className="font-black text-slate-900 text-lg">
                ₹{loan.current_principal_balance.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">
                Accrued Interest ({loan.months_elapsed} Months / {loan.days_elapsed}d):
              </span>
              <span className="font-black text-rose-700 text-lg">
                ₹{loan.pending_interest?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">Interest Paid (வட்டி ₹)</Label>
              <Input
                type="number"
                value={interestPaid}
                onChange={(e) => setInterestPaid(e.target.value)}
                placeholder="e.g. 1500"
                className="h-11 text-base font-black"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">Principal Repaid (அசல் ₹)</Label>
              <Input
                type="number"
                value={principalPaid}
                max={loan.current_principal_balance}
                onChange={(e) => setPrincipalPaid(e.target.value)}
                placeholder="0"
                className="h-11 text-base font-black"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">Discount / Waiver (₹)</Label>
              <Input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="0"
                className="h-11 text-base font-black text-amber-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">Payment Note / Mode</Label>
            <Input
              value={repayNotes}
              onChange={(e) => setRepayNotes(e.target.value)}
              placeholder="e.g. Cash / GPay / NetBanking"
              className="h-11 text-sm font-medium"
            />
          </div>

          {/* Settle & Close Checkbox */}
          <label className="flex items-center gap-3.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={isClosing}
              onChange={(e) => {
                setIsClosing(e.target.checked);
                if (e.target.checked) {
                  setPrincipalPaid(String(loan.current_principal_balance));
                  setInterestPaid(String(loan.pending_interest));
                }
              }}
              className="rounded text-emerald-600 w-5 h-5"
            />
            <div>
              <div className="font-black text-emerald-950 text-sm">
                Full Settlement & Return Pledged Items (அடகு திருப்புதல்)
              </div>
              <div className="text-xs text-emerald-700 font-medium">
                Auto-fills remaining principal and accrued interest to close the pledge.
              </div>
            </div>
          </label>

          <DialogFooter className="pt-2 flex gap-2">
            <Button type="button" variant="outline" className="h-11 px-5 text-sm font-bold" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={repayMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-7 h-11 text-sm shadow-md"
            >
              {repayMutation.isPending ? 'Saving Payment...' : 'Save Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
