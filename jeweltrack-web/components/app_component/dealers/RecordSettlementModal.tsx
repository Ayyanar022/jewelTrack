'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Coins, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealer: any;
  onSuccess?: () => void;
}

export default function RecordSettlementModal({ open, onOpenChange, dealer, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [pureGrams, setPureGrams] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'PURE_GOLD' | 'CASH' | 'SCRAP_GOLD'>('PURE_GOLD');
  const [notes, setNotes] = useState('');

  const { mutate: saveSettlement, isPending } = useMutation({
    mutationFn: (data: any) => api.post('/dealer/settlement', data),
    onSuccess: (res) => {
      toast.success(`Payment of ${pureGrams}g pure gold credited successfully!`);
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['dealers-all'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-statement'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPure = Number(pureGrams) || 0;
    if (finalPure <= 0) {
      toast.error('Please enter a valid Pure Gold received weight (grams)');
      return;
    }

    saveSettlement({
      dealer_id: dealer.id,
      payment_mode: paymentMode,
      pure_weight_received: finalPure,
      date: new Date(date),
      notes: notes.trim() || undefined,
    });
  };

  const pendingGold = Number(dealer?.stats?.net_pending_pure_gold ?? dealer?.opening_pure_balance ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md max-h-[88vh] overflow-y-auto p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xl">
        {/* Clean Header */}
        <DialogHeader className="border-b border-slate-100 pb-2.5">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </span>
              <span>Record Payment</span>
            </DialogTitle>
            <div className="text-right">
              <span className="text-[11px] text-slate-500">Balance Due: </span>
              <strong className="text-xs font-mono font-bold text-slate-900">
                {pendingGold.toFixed(3)} g
              </strong>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium text-left pt-0.5">
            Partner: <strong className="text-slate-800">{dealer?.shop_name}</strong>
            {dealer?.name ? ` (${dealer?.name})` : ''}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 text-xs">
          {/* 1. Pure Gold Received (in grams) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-800">
              Pure Gold Received (g) *
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="any"
                placeholder="0.000"
                value={pureGrams}
                onChange={(e) => setPureGrams(e.target.value)}
                className="h-10 text-base font-bold font-mono bg-white border-slate-300 focus:border-slate-800 pr-10"
                required
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                grams
              </span>
            </div>
          </div>

          {/* 2. Date */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-800">Payment Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs font-medium bg-white border-slate-300"
              required
            />
          </div>

          {/* 3. Mode of Payment (Optional) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-800">Mode of Payment (Optional)</Label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full h-9 px-2.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
            >
              <option value="PURE_GOLD">Pure 24K Bar / Handover</option>
              <option value="CASH">Cash Settlement</option>
              <option value="SCRAP_GOLD">Old Scrap Gold / Melting</option>
            </select>
          </div>

          {/* 4. Remarks (Optional) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-800">Remarks / Note (Optional)</Label>
            <Input
              placeholder="e.g. Counter handover / fine 999 bar"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs font-medium bg-white border-slate-300"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || Number(pureGrams || 0) <= 0}
              className="h-8 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Credit {Number(pureGrams || 0).toFixed(3)}g</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
