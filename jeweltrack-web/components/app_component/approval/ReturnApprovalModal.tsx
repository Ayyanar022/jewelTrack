'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { CornerDownLeft, Scale, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface ReturnRow {
  item_id: string;
  item_name: string;
  purity: string;
  touch: number;
  hallmark_charge: number;
  pieces_out: number;
  net_weight_out: number;
  pieces_in: number | string;
  gross_weight_in: number | string;
  net_weight_in: number | string;
  sold_pieces: number;
  sold_net_weight: number;
  pure_weight: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memo: any;
  onSuccess?: () => void;
}

export default function ReturnApprovalModal({ open, onOpenChange, memo, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [returnItems, setReturnItems] = useState<ReturnRow[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (memo && memo.items) {
      const initial: ReturnRow[] = memo.items.map((it: any) => {
        const pIn = it.pieces_in !== undefined && it.pieces_in !== null ? it.pieces_in : '';
        const netIn = it.net_weight_in !== undefined && it.net_weight_in !== null ? it.net_weight_in : '';
        const grossIn = it.gross_weight_in !== undefined && it.gross_weight_in !== null ? it.gross_weight_in : '';
        const numPIn = Number(pIn) || 0;
        const numNetIn = Number(netIn) || 0;
        const soldPcs = Math.max(0, it.pieces_out - numPIn);
        const soldNet = Math.max(0, Number((Number(it.net_weight_out) - numNetIn).toFixed(3)));
        const hm = Number(it.hallmark_charge) || 0;
        const rawPure = (soldNet * (Number(it.touch) || 0)) / 100;
        const pureGrams = Number((rawPure + (soldNet > 0 ? hm : 0)).toFixed(3));

        return {
          item_id: it.id,
          item_name: it.item_name,
          purity: it.purity || 'K22',
          touch: Number(it.touch) || 0,
          hallmark_charge: it.hallmark_charge ? Number(it.hallmark_charge) : '',
          pieces_out: it.pieces_out,
          net_weight_out: Number(it.net_weight_out),
          pieces_in: pIn,
          gross_weight_in: grossIn,
          net_weight_in: netIn,
          sold_pieces: soldPcs,
          sold_net_weight: soldNet,
          pure_weight: pureGrams,
        };
      });
      setReturnItems(initial);
    }
  }, [memo]);

  const updateReturnRow = (
    index: number,
    field: 'pieces_in' | 'gross_weight_in' | 'net_weight_in' | 'hallmark_charge',
    val: any,
  ) => {
    setReturnItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: val };

      const pIn = Number(row.pieces_in) || 0;
      const netIn = Number(row.net_weight_in) || 0;
      const hm = Number(row.hallmark_charge) || 0;

      row.sold_pieces = Math.max(0, row.pieces_out - pIn);
      row.sold_net_weight = Math.max(0, Number((row.net_weight_out - netIn).toFixed(3)));
      const rawPure = (row.sold_net_weight * (Number(row.touch) || 0)) / 100;
      row.pure_weight = Number((rawPure + (row.sold_net_weight > 0 ? hm : 0)).toFixed(3));

      updated[index] = row;
      return updated;
    });
  };

  const handleAllReturned = (index: number) => {
    setReturnItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      row.pieces_in = row.pieces_out;
      row.net_weight_in = row.net_weight_out;
      row.gross_weight_in = row.net_weight_out;
      row.sold_pieces = 0;
      row.sold_net_weight = 0;
      row.pure_weight = 0;
      updated[index] = row;
      return updated;
    });
  };

  const handleAllSold = (index: number) => {
    setReturnItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      row.pieces_in = 0;
      row.net_weight_in = 0;
      row.gross_weight_in = 0;
      row.sold_pieces = row.pieces_out;
      row.sold_net_weight = row.net_weight_out;
      const hm = Number(row.hallmark_charge) || 0;
      const rawPure = (row.sold_net_weight * (Number(row.touch) || 0)) / 100;
      row.pure_weight = Number((rawPure + hm).toFixed(3));
      updated[index] = row;
      return updated;
    });
  };

  const { mutate: submitReturn, isPending } = useMutation({
    mutationFn: (data: any) => api.post(`/approval/return/${memo.id}`, data),
    onSuccess: () => {
      toast.success('Return recorded & pure gold ledger updated!');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to process return');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    for (const r of returnItems) {
      if (Number(r.net_weight_in || 0) > r.net_weight_out) {
        toast.error(`Returned weight (${r.net_weight_in}g) cannot exceed issued weight (${r.net_weight_out}g) for ${r.item_name}`);
        return;
      }
    }

    submitReturn({
      items: returnItems.map((r) => ({
        item_id: r.item_id,
        pieces_in: Number(r.pieces_in) || 0,
        gross_weight_in: Number(r.gross_weight_in) || Number(r.net_weight_in) || 0,
        net_weight_in: Number(r.net_weight_in) || 0,
        hallmark_charge: Number(r.hallmark_charge) || 0,
      })),
      notes: notes.trim() || undefined,
    });
  };

  const grandTotalSoldNet = returnItems.reduce((sum, r) => sum + r.sold_net_weight, 0);
  const grandTotalSoldPure = returnItems.reduce((sum, r) => sum + r.pure_weight, 0);
  const grandTotalReturnedNet = returnItems.reduce((sum, r) => sum + (Number(r.net_weight_in) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-5xl lg:max-w-6xl max-h-[94vh] p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-slate-100 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center">
                <CornerDownLeft className="w-4 h-4" />
              </div>
              <div>
                <span>Approval Return & Pure Gold Conversion</span>
                <p className="text-xs font-normal text-slate-500 mt-0.5">
                  Record returned jewelry & compute pure gold due from sold items
                </p>
              </div>
            </DialogTitle>
            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Voucher: <strong className="text-slate-950 font-mono text-sm">{memo?.voucher_number}</strong>
            </div>
          </div>
        </DialogHeader>

        {/* Dealer Info Bar */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900">{memo?.dealer?.shop_name}</span>
            <span className="text-xs text-slate-500">({memo?.dealer?.name} • {memo?.dealer?.phone})</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Issued Total Weight:</span>
            <span className="font-mono font-black text-slate-900 text-sm bg-white px-3 py-0.5 rounded-md border border-slate-200 shadow-xs">
              {memo?.summary?.total_net_weight_out?.toFixed(3) || '0.000'} g
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden pt-1 gap-3">
          {/* Main Items Return Table */}
          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[880px]">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10 border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">#</th>
                  <th className="px-3 py-2.5 min-w-[170px]">Item Description</th>
                  <th className="px-3 py-2.5 text-center w-24">Touch %</th>
                  <th className="px-3 py-2.5 text-right w-24 bg-slate-50">Issued Wt</th>
                  <th className="px-2 py-2.5 text-center w-20">Ret. Pcs</th>
                  <th className="px-2 py-2.5 text-right w-28 bg-emerald-50/40 font-bold text-emerald-950">Ret. Wt (g)</th>
                  <th className="px-3 py-2.5 text-right w-24 font-bold text-slate-900">Sold Wt</th>
                  <th className="px-2 py-2.5 text-right w-24 font-bold text-slate-700 bg-amber-50/30">Hallmark (g)</th>
                  <th className="px-3 py-2.5 text-right w-32 bg-amber-100/60 font-black text-amber-950">Pure Gold Due</th>
                  <th className="px-3 py-2.5 text-center w-28">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returnItems.map((r, idx) => {
                  const purityLabel = r.purity === 'K18' ? 'K18' : r.purity === 'K24' ? 'K24' : 'K22';

                  return (
                    <tr key={r.item_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2 text-center font-bold text-slate-400">{idx + 1}</td>
                      
                      <td className="px-3 py-2">
                        <div className="font-black text-slate-950 text-sm">{r.item_name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Issued: {r.pieces_out} pcs
                        </div>
                      </td>

                      <td className="px-3 py-2 text-center">
                        <span className="font-bold font-mono text-xs bg-amber-100 text-amber-950 px-2 py-0.5 rounded border border-amber-300">
                          {purityLabel} - {r.touch}%
                        </span>
                      </td>

                      <td className="px-3 py-2 text-right font-mono font-bold text-sm text-slate-800 bg-slate-50">
                        {r.net_weight_out.toFixed(3)}
                      </td>

                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          max={r.pieces_out}
                          value={r.pieces_in}
                          onChange={(e) => updateReturnRow(idx, 'pieces_in', e.target.value)}
                          className="h-9 text-sm font-black text-center font-mono"
                          required
                        />
                      </td>

                      <td className="px-2 py-2 bg-emerald-50/30">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          max={r.net_weight_out}
                          placeholder="0.000"
                          value={r.net_weight_in}
                          onChange={(e) => updateReturnRow(idx, 'net_weight_in', e.target.value)}
                          className="h-9 text-base font-black text-right font-mono text-emerald-900 bg-white border-emerald-300 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="px-3 py-2 text-right font-mono font-black text-sm text-slate-900">
                        {r.sold_net_weight.toFixed(3)} g
                      </td>

                      {/* Optional Hallmark pure gold input */}
                      <td className="px-2 py-2 bg-amber-50/20">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.000"
                          value={r.hallmark_charge}
                          onChange={(e) => updateReturnRow(idx, 'hallmark_charge', e.target.value)}
                          className="h-9 text-sm font-bold text-right font-mono border-slate-200 bg-white"
                          title="Optional hallmark pure gold in grams to add"
                        />
                      </td>

                      <td className="px-3 py-2 text-right font-mono font-black text-base text-amber-950 bg-amber-50/60">
                        {r.pure_weight > 0 ? (
                          <span className="text-amber-900 font-black">+{r.pure_weight.toFixed(3)} g</span>
                        ) : (
                          <span className="text-slate-400 font-normal">0.000 g</span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAllReturned(idx)}
                            className="px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 cursor-pointer"
                            title="All pieces returned unsold"
                          >
                            All Ret
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAllSold(idx)}
                            className="px-2 py-1 rounded-md text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 cursor-pointer"
                            title="All pieces sold by dealer"
                          >
                            All Sold
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Real-time High-Impact Metric Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 text-white p-3 rounded-xl shadow-md flex-shrink-0">
            <div className="flex items-center gap-4 text-xs font-medium">
              <div>
                <span className="text-emerald-400 text-[10px] uppercase font-bold block">Total Ret. Weight</span>
                <span className="text-base font-black text-emerald-300 font-mono">{grandTotalReturnedNet.toFixed(3)} g</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Sold Weight</span>
                <span className="text-base font-black text-white font-mono">{grandTotalSoldNet.toFixed(3)} g</span>
              </div>

              <div className="bg-amber-400 text-slate-950 px-3.5 py-1 rounded-lg">
                <span className="text-amber-950/80 text-[10px] uppercase font-black block">Pure Gold Due (+)</span>
                <span className="text-lg font-black font-mono tracking-tight">+{grandTotalSoldPure.toFixed(3)} g</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-9 px-4 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Confirm Return & Record +{grandTotalSoldPure.toFixed(3)}g Pure</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

