'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TrendingUp, History, Sparkles } from 'lucide-react';

export default function RatePage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ rate_silver: '', rate_999: '', rate_18k: '', rate_22k: '' });

  // Get Latest Metal Rates
  const { data: latest } = useQuery({
    queryKey: ['recent-rate'],
    queryFn: () => api.get('/rate/recent-rate').then((r) => r.data),
  });

  // Get Rate History
  const { data: history = [] } = useQuery({
    queryKey: ['rate-history'],
    queryFn: () => api.get('/rate/rate-history').then((r) => r.data),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => api.post('/rate', data),
    onSuccess: () => {
      toast.success('Today’s metal rates updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['recent-rate'] });
      queryClient.invalidateQueries({ queryKey: ['rate-history'] });
      setForm({ rate_silver: '', rate_999: '', rate_18k: '', rate_22k: '' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update rates');
    },
  });

  // Handle Form Submission
  const handleUpdateRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rate_22k || !form.rate_silver) {
      toast.error('22K Gold rate and Silver rate are required');
      return;
    }

    mutate({
      rate_22k: Number(form.rate_22k),
      rate_18k: Number(form.rate_18k),
      rate_silver: Number(form.rate_silver),
      ...(form.rate_999 && { rate_999: Number(form.rate_999) }),
    });
  };

  // Auto-calculate 18K (75%) from 22K (91.6%)
  const handle22kChange = (val: string) => {
    const rate22 = Number(val);
    const rate18 = rate22 > 0 ? Math.round(rate22 * 0.818) : '';
    setForm({ ...form, rate_22k: val, rate_18k: String(rate18) });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header Bar — Consistent with all modules */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 shrink-0" />
            <h1 className="text-xs sm:text-base font-bold text-slate-900 truncate">Daily Metal Rates</h1>
            <span className="hidden sm:inline text-xs text-slate-400 font-normal">(தங்க விலை நிலவரம்)</span>
          </div>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5 font-medium">
            Update today&apos;s bullion market rates — automatically applies to all new bills, estimates & loans.
          </p>
        </div>
      </div>

      {/* 4 Clean Rate Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* 22K Gold */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-sm font-semibold text-slate-600 truncate">22K Gold (916)</span>
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
              Ornament
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 my-1 sm:my-2 tabular-nums truncate">
            {latest?.rate_22k ? `₹${Number(latest.rate_22k).toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-xs text-slate-400 font-medium">per gram</div>
        </div>

        {/* 18K Gold */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-sm font-semibold text-slate-600 truncate">18K Gold (750)</span>
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50/60 text-amber-800 border border-amber-200 shrink-0">
              Stone Set
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 my-1 sm:my-2 tabular-nums truncate">
            {latest?.rate_18k ? `₹${Number(latest.rate_18k).toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-xs text-slate-400 font-medium">per gram</div>
        </div>

        {/* Silver */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-sm font-semibold text-slate-600 truncate">Silver (வெள்ளி)</span>
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              Bullion
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 my-1 sm:my-2 tabular-nums truncate">
            {latest?.rate_silver ? `₹${Number(latest.rate_silver).toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-xs text-slate-400 font-medium">per gram</div>
        </div>

        {/* 24K (999) Pure Gold */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-sm font-semibold text-slate-600 truncate">24K Gold (999)</span>
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-900 border border-yellow-200 shrink-0">
              Coin / Bar
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 my-1 sm:my-2 tabular-nums truncate">
            {latest?.rate_999 ? `₹${Number(latest.rate_999).toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-xs text-slate-400 font-medium">per gram</div>
        </div>
      </div>

      {/* Main Grid: Update Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 shadow-xs rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Update Today&apos;s Rates</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Enter new per gram rates below</p>
          </div>

          <form onSubmit={handleUpdateRate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium text-slate-700">22K Rate (₹/g) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 7250"
                  value={form.rate_22k}
                  onChange={(e) => handle22kChange(e.target.value)}
                  className="h-10 text-sm sm:text-base font-semibold text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium text-slate-700">18K Rate (₹/g)</Label>
                <Input
                  type="number"
                  placeholder="Auto-calculated"
                  value={form.rate_18k}
                  onChange={(e) => setForm({ ...form, rate_18k: e.target.value })}
                  className="h-10 text-sm sm:text-base font-medium text-slate-700 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium text-slate-700">Silver Rate (₹/g) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 95"
                  value={form.rate_silver}
                  onChange={(e) => setForm({ ...form, rate_silver: e.target.value })}
                  className="h-10 text-sm sm:text-base font-semibold text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium text-slate-700">24K Rate (₹/g)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 7850"
                  value={form.rate_999}
                  onChange={(e) => setForm({ ...form, rate_999: e.target.value })}
                  className="h-10 text-sm sm:text-base font-medium text-slate-700"
                />
              </div>
            </div>

            <Button
              disabled={isPending}
              className="w-full bg-gold hover:bg-gold/90 text-white font-semibold h-10 sm:h-11 text-sm shadow-xs mt-2 transition-colors cursor-pointer"
              type="submit"
            >
              {isPending ? 'Updating Rates...' : 'Save & Publish Today’s Rates'}
            </Button>
          </form>
        </div>

        {/* Rate History Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>Recent Rate Updates</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Last 10 entries</span>
          </div>

          <div className="overflow-x-auto flex-1">
            {!history?.length ? (
              <div className="px-5 py-16 text-center text-sm text-slate-400">
                No rate history recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-sm min-w-[460px]">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-500 font-semibold text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-4 sm:px-5 py-3">Date & Time</th>
                    <th className="px-4 sm:px-5 py-3 text-right">22K</th>
                    <th className="px-4 sm:px-5 py-3 text-right">18K</th>
                    <th className="px-4 sm:px-5 py-3 text-right">24K</th>
                    <th className="px-4 sm:px-5 py-3 text-right">Silver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.slice(0, 10).map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-5 py-3 text-xs sm:text-sm text-slate-600 font-normal">
                        {new Date(r.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">₹{r.rate_22k}</td>
                      <td className="px-4 sm:px-5 py-3 text-right font-medium text-slate-700 tabular-nums">₹{r.rate_18k}</td>
                      <td className="px-4 sm:px-5 py-3 text-right font-medium text-slate-700 tabular-nums">
                        {r.rate_999 ? `₹${r.rate_999}` : '—'}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">₹{r.rate_silver}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
