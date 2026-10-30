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
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  Scale,
  ArrowRight,
  Receipt,
} from 'lucide-react';

interface RedeemSchemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: any | null;
  todayRate22k: number;
}

export default function RedeemSchemeModal({
  open,
  onOpenChange,
  account,
  todayRate22k,
}: RedeemSchemeModalProps) {
  const queryClient = useQueryClient();

  const totalGrams = account?.total_gold_grams || 0;
  const totalCash = account?.total_cash_deposited || 0;

  // Form State
  const [redeemGramsInput, setRedeemGramsInput] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Default to full available balance when modal opens
  useEffect(() => {
    if (open && totalGrams > 0) {
      setRedeemGramsInput(String(totalGrams));
    }
  }, [open, totalGrams]);

  const redeemGrams = Number(redeemGramsInput) || 0;
  const remainingGrams = Math.max(0, Math.round((totalGrams - redeemGrams) * 1000) / 1000);
  const isFullRedemption = redeemGrams >= totalGrams && totalGrams > 0;
  const cashEquivalent = Math.round(redeemGrams * todayRate22k);

  const redeemMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/scheme/${account.id}/redeem`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Gold Scheme Redeemed Successfully! ✨');
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
      queryClient.invalidateQueries({ queryKey: ['scheme-stats'] });
      queryClient.invalidateQueries({ queryKey: ['scheme-detail', account.id] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to redeem gold scheme');
    },
  });

  const handleClose = () => {
    setRedeemGramsInput('');
    setBillNumber('');
    setNotes('');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (redeemGrams <= 0) {
      toast.error('Please enter a valid gold weight to redeem');
      return;
    }

    if (redeemGrams > totalGrams) {
      toast.error(`Cannot redeem more than available balance (${totalGrams.toFixed(3)}g)`);
      return;
    }

    redeemMutation.mutate({
      grams_redeemed: redeemGrams,
      gold_rate_applied: todayRate22k > 0 ? todayRate22k : undefined,
      bill_number: billNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  // Quick chip selections
  const quickChips = [
    { label: `All (${totalGrams.toFixed(3)}g)`, value: totalGrams },
    ...(totalGrams >= 8 ? [{ label: '8g (1 Pavan)', value: 8 }] : []),
    ...(totalGrams >= 4 ? [{ label: '4g (1/2 Pavan)', value: 4 }] : []),
    ...(totalGrams >= 2 ? [{ label: '2g', value: 2 }] : []),
    ...(totalGrams >= 1 ? [{ label: '1g', value: 1 }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xl max-h-[88dvh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl border-slate-200">
        {/* Fixed Header (Never overflows top) */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 bg-white shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-2xs shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                  Redeem Gold Scheme (மீட்பு)
                </DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs text-slate-500 truncate">
                  {account?.customer?.name} • A/c:{' '}
                  <strong className="text-amber-800">{account?.account_number}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Form Body with min-h-0 */}
        <form
          id="redeem-scheme-form"
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-3.5"
        >
          {/* Current Available Account Balance Ribbon */}
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border border-amber-300/80 rounded-xl flex items-center justify-between text-xs shadow-2xs">
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                Available Gold Balance
              </div>
              <div className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-1 mt-0.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {totalGrams.toFixed(3)} grams
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Today&apos;s Rate
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 font-mono">
                ₹{todayRate22k.toLocaleString('en-IN')}/g
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Total Cash: ₹{totalCash.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Grams to Redeem Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] sm:text-xs font-bold text-slate-800">
                Gold Weight to Redeem (Grams) <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                Available: <strong className="font-mono">{totalGrams.toFixed(3)}g</strong>
              </span>
            </div>

            <div className="relative">
              <Scale className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <Input
                type="number"
                step="0.001"
                min="0.001"
                max={totalGrams}
                placeholder="e.g. 8.000"
                value={redeemGramsInput}
                onChange={(e) => setRedeemGramsInput(e.target.value)}
                autoFocus
                className="pl-9 h-8.5 sm:h-9 text-xs sm:text-sm font-bold font-mono text-slate-900 border-slate-300 rounded-lg"
              />
              <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-500">
                grams 916
              </span>
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 mr-0.5">Quick:</span>
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRedeemGramsInput(String(chip.value))}
                  className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                    redeemGrams === chip.value
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Live Redemption Summary Box */}
          {redeemGrams > 0 && redeemGrams <= totalGrams && (
            <div className="p-2.5 sm:p-3 bg-purple-50/80 border border-purple-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-900 flex items-center gap-1.5 text-xs">
                  <ArrowRight className="w-3 h-3 text-purple-600" />
                  Redeemed Cash Value:
                </span>
                <span className="text-xs sm:text-sm font-black text-purple-950 font-mono">
                  ₹{cashEquivalent.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-purple-200/80">
                <span className="text-slate-600 font-medium text-[11px]">Remaining Balance:</span>
                <span
                  className={`font-bold font-mono text-xs ${
                    remainingGrams > 0 ? 'text-amber-900' : 'text-slate-500'
                  }`}
                >
                  {remainingGrams.toFixed(3)} grams
                </span>
              </div>

              <div className="pt-0.5 text-[10px] font-bold">
                {isFullRedemption ? (
                  <span className="text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded inline-block">
                    ✓ Full Redemption — Account will be COMPLETED
                  </span>
                ) : (
                  <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded inline-block">
                    ✓ Partial Redemption — {remainingGrams.toFixed(3)}g stays ACTIVE
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Optional Bill Ref */}
          <div>
            <Label className="text-xs font-bold text-slate-700">
              Bill / Invoice Reference (Optional)
            </Label>
            <div className="relative mt-1">
              <Receipt className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="e.g. BILL-2026-0042"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-bold text-slate-700">Redemption Notes (Optional)</Label>
            <Input
              placeholder="e.g. Redeemed 8g towards 22K Gold Chain purchase"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs border-slate-300 rounded-lg mt-1"
            />
          </div>
        </form>

        {/* Fixed Footer (Never overflows bottom) */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-9 text-xs font-semibold w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="redeem-scheme-form"
            disabled={
              redeemMutation.isPending ||
              redeemGrams <= 0 ||
              redeemGrams > totalGrams
            }
            className="h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs px-5 w-full sm:w-auto justify-center text-center"
          >
            {redeemMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Redeeming...
              </>
            ) : isFullRedemption ? (
              `Confirm Full Redemption (${totalGrams.toFixed(3)}g)`
            ) : (
              `Redeem ${redeemGrams.toFixed(3)}g (Keep ${remainingGrams.toFixed(3)}g Active)`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
