'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, ClipboardList } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memo: any;
}

export default function PrintApprovalSlipModal({ open, onOpenChange, memo }: Props) {
  if (!memo) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalPieces = memo.items?.reduce((sum: number, it: any) => sum + (Number(it.pieces_out) || 0), 0) || 0;
  const totalGross = memo.items?.reduce((sum: number, it: any) => sum + (Number(it.gross_weight_out) || 0), 0) || 0;
  const totalNet = memo.items?.reduce((sum: number, it: any) => sum + (Number(it.net_weight_out) || 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[92dvh] p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="border-b border-slate-100 pb-3 flex-shrink-0 print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-700" />
              <span>Approval Outward Slip</span>
            </DialogTitle>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Slip</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Slip Content */}
        <div className="flex-1 overflow-y-auto p-4 border border-slate-200 rounded-xl space-y-4 print:border-none print:p-0">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black tracking-wide text-slate-900">
              {memo.shop_profile?.shop_name || 'JEWELTRACK JEWELLERS'}
            </h2>
            {memo.shop_profile?.address && (
              <p className="text-xs text-slate-500">{memo.shop_profile.address}</p>
            )}
            {memo.shop_profile?.phone && (
              <p className="text-xs text-slate-500 font-semibold">Phone: {memo.shop_profile.phone}</p>
            )}
            <div className="mt-2 inline-block bg-slate-100 border border-slate-300 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-800">
              APPROVAL CONSIGNMENT MEMO
            </div>
          </div>

          {/* Memo & Party Details */}
          <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-200 pb-3">
            <div>
              <div className="text-slate-500 font-medium">Party / Dealer:</div>
              <div className="font-black text-slate-900 text-sm">{memo.dealer?.shop_name}</div>
              <div className="text-slate-700 font-semibold">{memo.dealer?.name}</div>
              <div className="text-slate-500">{memo.dealer?.phone} • {memo.dealer?.city}</div>
            </div>

            <div className="text-right">
              <div className="text-slate-500 font-medium">Voucher Number:</div>
              <div className="font-black text-slate-900 text-sm font-mono">{memo.voucher_number}</div>
              <div className="text-slate-500 font-medium mt-1">Date:</div>
              <div className="font-bold text-slate-800">
                {memo.date ? new Date(memo.date).toLocaleDateString('en-IN') : '—'}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-200 min-w-[480px]">
              <thead className="bg-slate-100 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2 border border-slate-200 text-center w-8">#</th>
                  <th className="p-2 border border-slate-200">Item Description</th>
                  <th className="p-2 border border-slate-200 text-center">Touch %</th>
                  <th className="p-2 border border-slate-200 text-center w-14">Pcs</th>
                  <th className="p-2 border border-slate-200 text-right">Weight (g)</th>
                  <th className="p-2 border border-slate-200 text-right">Hallmark (g)</th>
                </tr>
              </thead>
              <tbody>
                {memo.items?.map((it: any, i: number) => {
                  const pLabel = it.purity === 'K18' ? 'K18' : it.purity === 'K24' ? 'K24' : 'K22';
                  return (
                    <tr key={i} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-200 text-center font-bold">{i + 1}</td>
                      <td className="p-2 border border-slate-200 font-bold text-slate-900">{it.item_name}</td>
                      <td className="p-2 border border-slate-200 text-center font-bold font-mono">
                        {pLabel} - {it.touch}%
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-bold">{it.pieces_out}</td>
                      <td className="p-2 border border-slate-200 text-right font-mono font-bold text-slate-900">
                        {(it.net_weight_out || it.gross_weight_out || 0).toFixed(3)} g
                      </td>
                      <td className="p-2 border border-slate-200 text-right font-mono font-medium">
                        {it.hallmark_charge > 0 ? `+${Number(it.hallmark_charge).toFixed(3)} g` : '—'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-black border-t-2 border-slate-300">
                  <td colSpan={3} className="p-2 text-right">TOTAL:</td>
                  <td className="p-2 text-center">{totalPieces}</td>
                  <td className="p-2 text-right font-mono">{totalNet.toFixed(3)} g</td>
                  <td className="p-2 text-right font-mono">
                    {memo.items?.some((i: any) => i.hallmark_charge > 0)
                      ? `+${memo.items.reduce((s: number, i: any) => s + (Number(i.hallmark_charge) || 0), 0).toFixed(3)} g`
                      : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {memo.notes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <strong>Notes:</strong> {memo.notes}
            </div>
          )}

          {/* Terms & Signatures */}
          <div className="pt-6 space-y-6 text-xs">
            <p className="text-[10px] text-slate-400 text-center italic">
              These jewellery items are issued on approval/consignment. Unsold items must be returned intact. Sold items will be converted to Pure Gold at specified touch %.
            </p>

            <div className="flex justify-between items-end pt-8">
              <div className="text-center border-t border-slate-400 pt-1 w-40">
                <span className="text-[11px] font-bold text-slate-700">Receiver&apos;s Signature</span>
              </div>
              <div className="text-center border-t border-slate-400 pt-1 w-40">
                <span className="text-[11px] font-bold text-slate-700">For {memo.shop_profile?.shop_name || 'Shop'}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
