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
import { Coins, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

interface DepositSchemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: any | null;
  todayRate22k: number;
}

export default function DepositSchemeModal({
  open,
  onOpenChange,
  account,
  todayRate22k,
}: DepositSchemeModalProps) {
  const queryClient = useQueryClient();

  const [cashAmount, setCashAmount] = useState('');
  const [goldRate, setGoldRate] = useState(todayRate22k > 0 ? String(todayRate22k) : '');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  // Update default rate when modal opens or todayRate22k changes
  useEffect(() => {
    if (todayRate22k > 0) {
      setGoldRate(String(todayRate22k));
    }
  }, [todayRate22k, open]);

  const currentGrams = account?.total_gold_grams || 0;
  const currentCash = account?.total_cash_deposited || 0;

  const rateNum = Number(goldRate) > 0 ? Number(goldRate) : todayRate22k;
  const amountNum = Number(cashAmount) || 0;

  // Real-time grams calculation: rounded to 3 decimal places (milligrams)
  const gramsCredited =
    rateNum > 0 && amountNum > 0 ? Math.round((amountNum / rateNum) * 1000) / 1000 : 0;

  const newTotalGrams = Math.round((currentGrams + gramsCredited) * 1000) / 1000;
  const newTotalCash = currentCash + amountNum;

  const depositMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/scheme/${account.id}/deposit`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Deposit successful! ✨');
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
      queryClient.invalidateQueries({ queryKey: ['scheme-stats'] });
      queryClient.invalidateQueries({ queryKey: ['scheme-detail', account.id] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record deposit');
    },
  });

  const handleClose = () => {
    setCashAmount('');
    setTransactionRef('');
    setNotes('');
    setPaymentMode('CASH');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid deposit cash amount');
      return;
    }
    if (!rateNum || rateNum <= 0) {
      toast.error("Please enter today's 22K gold rate");
      return;
    }

    depositMutation.mutate({
      cash_amount: amountNum,
      gold_rate_applied: rateNum,
      payment_mode: paymentMode,
      transaction_ref: transactionRef.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-h-[85dvh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl border-slate-200">
        {/* Pinned Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-white shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">
                  Deposit Cash & Lock Gold
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {account?.customer?.name} ({account?.account_number})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Form Body with min-h-0 */}
        <form id="deposit-scheme-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Account Current Balance Ribbon */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Current Gold Balance</div>
              <div className="text-base font-black text-amber-900">{currentGrams.toFixed(3)} g</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500">Cash Deposited</div>
              <div className="text-base font-black text-slate-800">
                ₹{currentCash.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Rate & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700">Cash Deposited (₹) *</Label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                autoFocus
                className="h-10 text-sm font-black text-slate-900 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">22K Gold Rate (₹/g) *</Label>
              <Input
                type="number"
                placeholder="e.g. 6850"
                value={goldRate}
                onChange={(e) => setGoldRate(e.target.value)}
                className="h-10 text-sm font-black text-amber-800 mt-1"
              />
            </div>
          </div>

          {/* Live Grams Credited Callout */}
          {gramsCredited > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/15 to-amber-50 border border-amber-300 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Credited 916 Gold:
                </span>
                <span className="text-base font-black text-amber-950">
                  +{gramsCredited.toFixed(3)} grams
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-800/80 pt-1 border-t border-amber-200">
                <span>New Total Gold Balance:</span>
                <span className="font-black text-amber-900">
                  {newTotalGrams.toFixed(3)} grams (+₹{amountNum.toLocaleString('en-IN')})
                </span>
              </div>
            </div>
          )}

          {/* Payment Mode & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-600 font-semibold">Payment Mode</Label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 font-semibold bg-white mt-1"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-slate-600 font-semibold">Ref / UTR No.</Label>
              <Input
                placeholder="Optional"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="h-9 text-xs mt-1"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <Label className="text-xs text-slate-600 font-semibold">Notes / Remarks</Label>
            <Input
              placeholder="e.g. Month 3 deposit / Festival bonus"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs mt-1"
            />
          </div>
        </form>

        {/* Pinned Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={handleClose} className="h-9 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            type="submit"
            form="deposit-scheme-form"
            disabled={depositMutation.isPending || !amountNum || gramsCredited <= 0}
            className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs px-4"
          >
            {depositMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Recording...
              </>
            ) : (
              <>
                Credit {gramsCredited > 0 ? `${gramsCredited.toFixed(3)}g Gold` : 'Payment'}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
