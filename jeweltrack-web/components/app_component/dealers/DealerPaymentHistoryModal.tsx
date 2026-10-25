'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Coins, Loader2, Plus, Calendar, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealer: any;
  onRecordNewPayment?: () => void;
}

export default function DealerPaymentHistoryModal({
  open,
  onOpenChange,
  dealer,
  onRecordNewPayment,
}: Props) {
  const { data: settlements, isLoading } = useQuery({
    queryKey: ['dealer-settlements', dealer?.id],
    queryFn: () => api.get(`/dealer/settlements?dealer_id=${dealer.id}`).then((r) => r.data),
    enabled: open && !!dealer?.id,
  });

  const totalPureReceived = (settlements || []).reduce(
    (sum: number, s: any) => sum + Number(s.pure_weight_received || 0),
    0,
  );

  const pendingDue = Number(
    dealer?.stats?.net_pending_pure_gold ?? dealer?.opening_pure_balance ?? 0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-2xl max-h-[88vh] p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-slate-100 pb-2.5 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </span>
                <span>Payment & Metal Received History</span>
              </DialogTitle>
              <p className="text-xs text-slate-500 font-medium text-left mt-0.5">
                Partner: <strong className="text-slate-800">{dealer?.shop_name}</strong>
                {dealer?.name ? ` • ${dealer.name}` : ''}
                {dealer?.phone ? ` • ${dealer.phone}` : ''}
              </p>
            </div>

            {onRecordNewPayment && (
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onRecordNewPayment();
                }}
                className="h-8 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Calm Quick Stats Bar */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs flex-shrink-0">
          <div>
            <span className="text-slate-500">Total Metal Received: </span>
            <strong className="font-mono text-emerald-700 font-bold">
              {totalPureReceived.toFixed(3)} g
            </strong>
          </div>
          <div>
            <span className="text-slate-500">Current Balance Due: </span>
            <strong className="font-mono text-slate-900 font-bold">
              {pendingDue.toFixed(3)} g
            </strong>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto pt-1 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
            </div>
          ) : !settlements || settlements.length === 0 ? (
            <div className="text-center py-14 text-slate-400 space-y-1">
              <Coins className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
              <p className="text-xs font-semibold text-slate-600">No payment receipts recorded yet</p>
              <p className="text-[11px] text-slate-400">
                Click &quot;Record Payment&quot; to credit metal received from this partner.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-2.5 py-2 text-center w-8 border-r border-slate-200">#</th>
                    <th className="px-2.5 py-2 border-r border-slate-200">Date</th>
                    <th className="px-2.5 py-2 border-r border-slate-200">Receipt #</th>
                    <th className="px-2.5 py-2 border-r border-slate-200">Payment Mode</th>
                    <th className="px-2.5 py-2 text-right border-r border-slate-200 font-bold text-emerald-800 bg-emerald-50/50">
                      Pure Metal (g)
                    </th>
                    <th className="px-2.5 py-2">Remarks / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlements.map((stl: any, idx: number) => {
                    const pureWeight = Number(stl.pure_weight_received || 0);
                    return (
                      <tr key={stl.id} className="hover:bg-slate-50/60">
                        <td className="px-2.5 py-2 text-center font-medium text-slate-400 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="px-2.5 py-2 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                          {new Date(stl.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-2.5 py-2 font-mono font-bold text-slate-800 border-r border-slate-200">
                          {stl.settlement_number}
                        </td>
                        <td className="px-2.5 py-2 border-r border-slate-200 text-slate-700">
                          {stl.payment_mode === 'PURE_GOLD'
                            ? 'Pure 24K Bar'
                            : stl.payment_mode === 'CASH'
                            ? 'Cash Settlement'
                            : 'Scrap Gold'}
                        </td>
                        <td className="px-2.5 py-2 text-right font-mono font-bold text-emerald-700 border-r border-slate-200 bg-emerald-50/30">
                          -{pureWeight.toFixed(3)} g
                        </td>
                        <td className="px-2.5 py-2 text-slate-600 text-[11px]">
                          {stl.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs font-semibold cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
