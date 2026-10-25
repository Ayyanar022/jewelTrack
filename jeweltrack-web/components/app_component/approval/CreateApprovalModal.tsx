'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ClipboardList, Plus, Trash2, Loader2, Store, Calendar, FileText } from 'lucide-react';

interface ApprovalRow {
  category_id: string;
  item_name: string;
  metal: 'GOLD' | 'SILVER';
  purity: 'K22' | 'K18' | 'K24';
  touch: number | string;
  pieces_out: number | string;
  weight_out: number | string;
  hallmark_charge: number | string;
}

const defaultRow = (): ApprovalRow => ({
  category_id: '',
  item_name: '',
  metal: 'GOLD',
  purity: 'K22',
  touch: 91.6,
  pieces_out: 1,
  weight_out: '',
  hallmark_charge: '',
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateApprovalModal({ open, onOpenChange, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [dealerId, setDealerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ApprovalRow[]>([defaultRow()]);

  // 1. Fetch Dealers
  const { data: dealersData } = useQuery({
    queryKey: ['dealers-all-list'],
    queryFn: () => api.get('/dealer?limit=100').then((r) => r.data),
    enabled: open,
  });
  const dealers = dealersData?.items || [];

  // 2. Fetch Categories for Touch & Name Presets
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/jewellery-category').then((r) => r.data),
    enabled: open,
  });

  const { mutate: createMemo, isPending } = useMutation({
    mutationFn: (data: any) => api.post('/approval/outward', data),
    onSuccess: (res) => {
      toast.success(`Approval Memo ${res.data.voucher_number} issued successfully!`);
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to issue memo');
    },
  });

  const handleCategorySelect = (index: number, catId: string) => {
    const cat = categories.find((c: any) => c.id === catId);
    if (!cat) return;

    setItems((prev) => {
      const updated = [...prev];
      const purity = updated[index].purity || 'K22';
      let touch: number = 91.6;
      if (purity === 'K22') touch = cat.touch_22k ?? 91.6;
      else if (purity === 'K18') touch = cat.touch_18k ?? 75.0;
      else if (purity === 'K24') touch = cat.touch_24k ?? 99.9;

      updated[index] = {
        ...updated[index],
        category_id: cat.id,
        item_name: cat.name,
        metal: cat.metal || 'GOLD',
        touch,
      };
      return updated;
    });
  };

  const updateItem = (index: number, field: keyof ApprovalRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      if (field === 'purity') {
        const cat = categories.find((c: any) => c.id === row.category_id);
        if (cat) {
          if (value === 'K22') row.touch = cat.touch_22k ?? 91.6;
          else if (value === 'K18') row.touch = cat.touch_18k ?? 75.0;
          else if (value === 'K24') row.touch = cat.touch_24k ?? 99.9;
        } else {
          row.touch = value === 'K22' ? 91.6 : value === 'K18' ? 75.0 : 99.9;
        }
      }

      updated[index] = row;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, defaultRow()]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      toast.warning('At least one item is required');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) {
      toast.error('Please select a Partner Dealer from the dropdown above');
      return;
    }

    const validItems = items.filter(
      (it) => it.item_name.trim() && Number(it.pieces_out) > 0 && Number(it.weight_out) > 0,
    );

    if (validItems.length === 0) {
      toast.error('Please enter Item Name, Pieces and Weight (g) for at least one item');
      return;
    }

    createMemo({
      dealer_id: dealerId,
      date: new Date(date),
      notes: notes.trim() || undefined,
      items: validItems.map((it) => ({
        category_id: it.category_id || undefined,
        item_name: it.item_name.trim(),
        metal: it.metal,
        purity: it.purity,
        touch: Number(it.touch) || 0,
        pieces_out: Number(it.pieces_out),
        gross_weight_out: Number(it.weight_out),
        net_weight_out: Number(it.weight_out),
        hallmark_charge: Number(it.hallmark_charge) || 0,
      })),
    });
  };

  const totalPiecesOut = items.reduce((sum, it) => sum + (Number(it.pieces_out) || 0), 0);
  const totalWeightOut = items.reduce((sum, it) => sum + (Number(it.weight_out) || 0), 0);
  const totalHallmark = items.reduce((sum, it) => sum + (Number(it.hallmark_charge) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-5xl lg:max-w-6xl max-h-[94vh] p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="border-b border-slate-100 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <span>Approval Outward Memo</span>
                <p className="text-xs font-normal text-slate-500 mt-0.5">
                  Issue jewelry items on consignment / approval to partner jeweler
                </p>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden pt-2 gap-3">
          {/* Top Form Controls: Dealer, Date, Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200 flex-shrink-0">
            <div className="sm:col-span-5 space-y-1">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-700" />
                <span>Partner Dealer / Shop *</span>
              </Label>
              <select
                value={dealerId}
                onChange={(e) => setDealerId(e.target.value)}
                className={`w-full h-9 px-3 text-xs font-bold bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs ${
                  !dealerId ? 'border-amber-400 bg-amber-50/30' : 'border-slate-300'
                }`}
                required
              >
                <option value="">-- Select Partner Shop (Required) --</option>
                {dealers.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.shop_name} — {d.name} {d.city ? `(${d.city})` : ''} • {d.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 space-y-1">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Issue Date *</span>
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs font-bold bg-white"
                required
              />
            </div>

            <div className="sm:col-span-4 space-y-1">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Remarks / Notes</span>
              </Label>
              <Input
                placeholder="e.g. Customer selection, counter approval"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs font-medium bg-white"
              />
            </div>
          </div>

          {/* Dynamic Item Entry Table with Single Weight Column & Hallmark */}
          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[840px]">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10 border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">#</th>
                  <th className="px-3 py-2.5 w-40">Category</th>
                  <th className="px-3 py-2.5 min-w-[180px]">Item Description *</th>
                  <th className="px-3 py-2.5 w-20 text-center">Purity</th>
                  <th className="px-3 py-2.5 w-28 text-center">Touch % *</th>
                  <th className="px-3 py-2.5 w-20 text-center">Pcs *</th>
                  <th className="px-3 py-2.5 w-32 text-right bg-amber-50/80 font-black text-amber-950">Weight (g) *</th>
                  <th className="px-3 py-2.5 w-24 text-right font-bold text-slate-700">Hallmark (g)</th>
                  <th className="px-2 py-2.5 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2 text-center font-bold text-slate-400">{idx + 1}</td>

                      {/* Category Preset */}
                      <td className="px-3 py-2">
                        <select
                          value={it.category_id}
                          onChange={(e) => handleCategorySelect(idx, e.target.value)}
                          className="w-full h-9 px-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                        >
                          <option value="">Select category...</option>
                          {categories.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Item Description */}
                      <td className="px-3 py-2">
                        <Input
                          placeholder="e.g. Ring, Chain"
                          value={it.item_name}
                          onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                          className="h-9 text-xs sm:text-sm font-bold border-slate-200"
                          required
                        />
                      </td>

                      {/* Purity */}
                      <td className="px-3 py-2 text-center">
                        <select
                          value={it.purity}
                          onChange={(e) => updateItem(idx, 'purity', e.target.value)}
                          className="w-full h-9 px-1 text-xs font-black text-center bg-white border border-slate-200 rounded-lg focus:outline-none"
                        >
                          <option value="K22">22K</option>
                          <option value="K18">18K</option>
                          <option value="K24">24K</option>
                        </select>
                      </td>

                      {/* Touch % from Category / Custom Entry */}
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          step="any"
                          placeholder="91.6"
                          value={it.touch}
                          onChange={(e) => updateItem(idx, 'touch', e.target.value)}
                          className="h-9 text-sm font-black text-center font-mono border-slate-200"
                          required
                        />
                      </td>

                      {/* Pieces */}
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="1"
                          value={it.pieces_out}
                          onChange={(e) => updateItem(idx, 'pieces_out', e.target.value)}
                          className="h-9 text-sm font-black text-center font-mono border-slate-200"
                          required
                        />
                      </td>

                      {/* Single Weight Column */}
                      <td className="px-3 py-2 bg-amber-50/40">
                        <Input
                          type="number"
                          step="any"
                          placeholder="0.000"
                          value={it.weight_out}
                          onChange={(e) => updateItem(idx, 'weight_out', e.target.value)}
                          className="h-9 text-base font-black text-right font-mono text-amber-950 bg-white border-amber-300 focus:ring-2 focus:ring-amber-500 shadow-xs"
                          required
                        />
                      </td>

                      {/* Optional Hallmark Charge (₹) */}
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={it.hallmark_charge}
                          onChange={(e) => updateItem(idx, 'hallmark_charge', e.target.value)}
                          className="h-9 text-xs font-bold text-right font-mono border-slate-200 placeholder:text-slate-300"
                        />
                      </td>

                      {/* Delete Action */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary Bar & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 text-white p-3 sm:px-4 rounded-xl shadow-md flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addItemRow}
                className="h-9 text-xs font-bold gap-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Add Item Line</span>
              </Button>
            </div>

            {/* Prominent High-Contrast Totals */}
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Pieces</span>
                <span className="text-base font-black text-white font-mono">{totalPiecesOut} pcs</span>
              </div>

              <div className="bg-amber-400 text-slate-950 px-4 py-1 rounded-xl shadow-xs">
                <span className="text-amber-950/80 text-[10px] uppercase font-black block">Total Weight</span>
                <span className="text-lg font-black font-mono tracking-tight">{totalWeightOut.toFixed(3)} g</span>
              </div>

              {totalHallmark > 0 && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Hallmark</span>
                  <span className="text-base font-black text-amber-300 font-mono">+{totalHallmark.toFixed(3)} g</span>
                </div>
              )}
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
                className="h-9 px-5 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Issuing...</span>
                  </>
                ) : (
                  <span>Issue Approval Memo</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


