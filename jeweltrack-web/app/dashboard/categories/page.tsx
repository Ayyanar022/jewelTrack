'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Layers, Plus, Pencil, Trash2, X, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  metal: 'GOLD' | 'SILVER';
  default_wastage: number | null;
  default_making_charge: number | null;
  touch_22k: number | null;
  touch_18k: number | null;
  touch_24k: number | null;
}

const emptyForm = () => ({
  name: '',
  metal: 'GOLD' as 'GOLD' | 'SILVER',
  default_wastage: '',
  default_making_charge: '',
  touch_22k: '',
  touch_18k: '',
  touch_24k: '',
});

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/jewellery-category').then((r) => r.data),
  });

  const { data: subscription } = useQuery({
    queryKey: ['shop-current-subscription'],
    queryFn: () => api.get('/subscription/current').then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const isExpired = subscription?.is_expired;

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (data: any) =>
      editingId
        ? api.patch(`/jewellery-category/${editingId}`, data)
        : api.post(`/jewellery-category`, data),
    onSuccess: () => {
      toast.success(editingId ? 'Category updated' : 'Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save category');
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => api.delete(`/jewellery-category/${id}`),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete category');
    },
  });

  const handleEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      metal: cat.metal,
      default_wastage: cat.default_wastage?.toString() ?? '',
      default_making_charge: cat.default_making_charge?.toString() ?? '',
      touch_22k: cat.touch_22k?.toString() ?? '',
      touch_18k: cat.touch_18k?.toString() ?? '',
      touch_24k: cat.touch_24k?.toString() ?? '',
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const formatCategoryName = (name: string) => {
    if (!name) return '';
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = formatCategoryName(form.name);
    if (!formattedName) {
      toast.error('Enter category name');
      return;
    }

    save({
      name: formattedName,
      metal: form.metal,
      ...(form.default_wastage && { default_wastage: Number(form.default_wastage) }),
      ...(form.default_making_charge && { default_making_charge: Number(form.default_making_charge) }),
      ...(form.touch_22k && { touch_22k: Number(form.touch_22k) }),
      ...(form.touch_18k && { touch_18k: Number(form.touch_18k) }),
      ...(form.touch_24k && { touch_24k: Number(form.touch_24k) }),
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const inputClass =
    'h-9 sm:h-10 text-xs sm:text-sm font-bold text-slate-900 border-slate-300 focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-200 transition-all';

  return (
    <div className="flex flex-col gap-3.5 max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8 pb-16">
      {/* Subscription Expired Warning Banner */}
      {isExpired && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-800">
                Category Modification Locked · Plan Expired
              </div>
              <p className="text-xs sm:text-sm font-medium text-rose-900 mt-0.5">
                Your subscription has expired. Adding or modifying category presets is locked. Existing category wastage & making charge presets are still available for billing calculations.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings?tab=subscription"
            className="bg-gradient-to-r from-gold via-amber-400 to-amber-500 text-slate-950 text-xs font-black px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-xs hover:brightness-105 transition-all self-start sm:self-auto shrink-0"
          >
            ⚡ Renew Plan
          </Link>
        </div>
      )}

      {/* Header Bar — Slim single row on mobile */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 shrink-0" />
            <h1 className="text-xs sm:text-base font-bold text-slate-900 truncate">Jewellery Categories</h1>
            <span className="hidden sm:inline text-xs text-slate-400 font-normal">(நகை பிரிவுகள்)</span>
          </div>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
            Default wastage % and making charge presets for fast billing & estimations.
          </p>
        </div>

        {!showForm && (
          <Button
            onClick={() => {
              if (isExpired) {
                toast.error('Subscription plan expired. Renew your plan to add categories.');
                return;
              }
              setEditingId(null);
              setForm(emptyForm());
              setShowForm(true);
            }}
            disabled={isExpired}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-7.5 sm:h-9 px-2.5 sm:px-4 text-[11px] sm:text-xs flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 shrink-0 rounded-lg sm:rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isExpired ? 'Locked' : 'Add Category'}</span>
          </Button>
        )}
      </div>

      {/* Compact Form Card */}
      {showForm && (
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              {editingId ? 'Edit Category' : 'New Category'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">Category Name *</Label>
                <Input
                  placeholder="e.g. Ring, Chain, Bangle"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">Metal</Label>
                <select
                  value={form.metal}
                  onChange={(e) => setForm({ ...form, metal: e.target.value as 'GOLD' | 'SILVER' })}
                  className="w-full h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer"
                >
                  <option value="GOLD">🪙 Gold (தங்கம்)</option>
                  <option value="SILVER">⚪ Silver (வெள்ளி)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">Wastage %</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 10.0"
                  value={form.default_wastage}
                  onChange={(e) => setForm({ ...form, default_wastage: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">Making Charge (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={form.default_making_charge}
                  onChange={(e) => setForm({ ...form, default_making_charge: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Optional Touch values for Gold */}
            {form.metal === 'GOLD' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 pt-0.5">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-bold text-slate-800">Touch 22K (Optional)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 91.6"
                    value={form.touch_22k}
                    onChange={(e) => setForm({ ...form, touch_22k: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-bold text-slate-800">Touch 18K (Optional)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 75.0"
                    value={form.touch_18k}
                    onChange={(e) => setForm({ ...form, touch_18k: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <Button
                type="submit"
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                {saving ? 'Saving...' : editingId ? 'Update Category' : 'Save Category'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="h-9 sm:h-10 px-3.5 sm:px-5 text-xs sm:text-sm font-bold text-slate-700 border-slate-300 cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Master Table with Clean Proportional Rows */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs sm:text-sm font-bold text-slate-800">
            Total Categories: <span className="font-black text-slate-900">{categories.length}</span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Showroom Presets</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Layers className="w-10 h-10 mx-auto opacity-30 text-gold" />
            <p className="text-xs sm:text-sm font-bold text-slate-700">No categories found — add your first category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[560px]">
              <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="sticky left-0 bg-slate-50 z-20 px-3.5 sm:px-4 py-2.5 text-left shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                    Name
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-center">Metal</th>
                  <th className="px-3 sm:px-4 py-2.5 text-center">Wastage %</th>
                  <th className="px-3 sm:px-4 py-2.5 text-center">Making Charge</th>
                  <th className="px-3 sm:px-4 py-2.5 text-center">Touch (22K / 18K)</th>
                  <th className="px-3 sm:px-4 py-2.5 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat: Category) => {
                  const isGold = cat.metal === 'GOLD';

                  return (
                    <tr key={cat.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50/90 z-10 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-slate-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                        {cat.name}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-md whitespace-nowrap ${
                            isGold
                              ? 'bg-amber-50 text-amber-950 border-amber-200'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {isGold ? '🪙 Gold' : '⚪ Silver'}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold font-mono text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                        {cat.default_wastage != null ? `${cat.default_wastage}%` : '—'}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold font-mono text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                        {cat.default_making_charge != null ? `₹${cat.default_making_charge}` : '—'}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-medium font-mono text-slate-700 text-[11px] sm:text-xs whitespace-nowrap">
                        {isGold ? (
                          cat.touch_22k != null || cat.touch_18k != null ? (
                            <span>{cat.touch_22k ?? '—'} / {cat.touch_18k ?? '—'}</span>
                          ) : '—'
                        ) : '—'}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete category "${cat.name}"?`)) {
                                remove(cat.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}