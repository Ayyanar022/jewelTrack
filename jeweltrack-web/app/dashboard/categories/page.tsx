'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Layers, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Enter category name');
      return;
    }

    save({
      name: form.name.trim(),
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
    'h-11 text-base font-bold text-slate-900 border-slate-300 focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-200 transition-all';

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto px-8 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-700" />
            <span>Jewellery Categories (நகை பிரிவுகள்)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Default wastage % and making charge presets for fast billing & estimations.
          </p>
        </div>

        {!showForm && (
          <Button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm());
              setShowForm(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-4 text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className='text-sm'>Add Category</span>
          </Button>
        )}
      </div>

      {/* Compact Form Card */}
      {showForm && (
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black text-slate-900">
              {editingId ? 'Edit Category' : 'New Category'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800">Category Name *</Label>
                <Input
                  placeholder="e.g. Ring, Chain, Bangle"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800">Metal</Label>
                <select
                  value={form.metal}
                  onChange={(e) => setForm({ ...form, metal: e.target.value as 'GOLD' | 'SILVER' })}
                  className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer"
                >
                  <option value="GOLD">🪙 Gold (தங்கம்)</option>
                  <option value="SILVER">⚪ Silver (வெள்ளி)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800">Wastage %</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 10.0"
                  value={form.default_wastage}
                  onChange={(e) => setForm({ ...form, default_wastage: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800">MC</Label>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800">Touch 22K</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 91.6"
                    value={form.touch_22k}
                    onChange={(e) => setForm({ ...form, touch_22k: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800">Touch 18K</Label>
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

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-6 text-sm shadow-xs cursor-pointer"
              >
                {saving ? 'Saving...' : editingId ? 'Update Category' : 'Save Category'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="h-11 px-5 text-sm font-bold text-slate-700 border-slate-300 cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Master Table with High Visibility */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-base font-bold text-slate-800">
            Total Categories: <span className="font-black text-slate-900">{categories.length}</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Showroom Presets</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Layers className="w-10 h-10 mx-auto opacity-30 text-gold" />
            <p className="text-sm font-bold text-slate-700">No categories found — add your first category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed">
              <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left"> Name</th>
                  <th className="px-6 py-4 text-center">Metal </th>
                  <th className="px-6 py-4 text-center">Wastage % </th>
                  <th className="px-6 py-4 text-center">MC</th>
                  <th className="px-6 py-4 text-center">Touch 22K</th>
                  <th className="px-6 py-4 text-center">Touch 18K</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat: Category) => {
                  const isGold = cat.metal === 'GOLD';

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-base text-left font-black text-slate-900">{cat.name}</td>
                      <td className="px-6 py-4 text-center ">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold px-3 py-1 rounded-md ${
                            isGold
                              ? 'bg-amber-50 text-amber-950 border-amber-200'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {isGold ? '🪙 Gold (தங்கம்)' : '⚪ Silver (வெள்ளி)'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-900 text-base">
                        {cat.default_wastage != null ? `${cat.default_wastage}%` : '—'}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-900 text-base">
                        {cat.default_making_charge != null ? `₹${cat.default_making_charge}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 text-sm">
                        {cat.touch_22k != null ? cat.touch_22k : '—'}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 text-sm">
                        {cat.touch_18k != null ? cat.touch_18k : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete category "${cat.name}"?`)) {
                                remove(cat.id);
                              }
                            }}
                            className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
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