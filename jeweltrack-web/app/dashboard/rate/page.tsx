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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-700" />
            <span>Daily Metal Rates (தங்க விலை நிலவரம்)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update today&apos;s bullion market rates — automatically applies to all new bills, estimates & loans.
          </p>
        </div>
      </div>

      {/* 4 Clean Rate Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 22K Gold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">22K Gold (916)</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
              Ornament
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 my-2">
            {latest?.rate_22k ? `₹${Number(latest.rate_22k).toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-xs text-slate-400 font-medium">per gram</div>
        </div>

        {/* 18K Gold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">18K Gold (750)</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50/60 text-amber-800 border border-amber-200">
              Stone Set
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 my-2">
            {latest?.rate_18k ? `₹${Number(latest.rate_18k).toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-xs text-slate-400 font-medium">per gram</div>
        </div>

        {/* Silver */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Silver (வெள்ளி)</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Bullion
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 my-2">
            {latest?.rate_silver ? `₹${Number(latest.rate_silver).toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-xs text-slate-400 font-medium">per gram</div>
        </div>

        {/* 24K (999) Pure Gold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">24K Pure Gold (999)</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-900 border border-yellow-200">
              Coin / Bar
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 my-2">
            {latest?.rate_999 ? `₹${Number(latest.rate_999).toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-xs text-slate-400 font-medium">per gram</div>
        </div>
      </div>

      {/* Main Grid: Update Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Update Today&apos;s Rates</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter new per gram rates below</p>
          </div>

          <form onSubmit={handleUpdateRate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">22K Rate (₹/g) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 7250"
                  value={form.rate_22k}
                  onChange={(e) => handle22kChange(e.target.value)}
                  className="h-11 text-base font-black"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">18K Rate (₹/g)</Label>
                <Input
                  type="number"
                  placeholder="Auto-calculated"
                  value={form.rate_18k}
                  onChange={(e) => setForm({ ...form, rate_18k: e.target.value })}
                  className="h-11 text-base font-bold text-slate-700 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">Silver Rate (₹/g) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 95"
                  value={form.rate_silver}
                  onChange={(e) => setForm({ ...form, rate_silver: e.target.value })}
                  className="h-11 text-base font-black"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">24K Rate (₹/g)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 7850"
                  value={form.rate_999}
                  onChange={(e) => setForm({ ...form, rate_999: e.target.value })}
                  className="h-11 text-base font-bold"
                />
              </div>
            </div>

            <Button
              disabled={isPending}
              className="w-full bg-gold hover:bg-gold/90 text-white font-black h-11 text-sm shadow-md mt-2"
              type="submit"
            >
              {isPending ? 'Updating Rates...' : 'Save & Publish Today’s Rates'}
            </Button>
          </form>
        </div>

        {/* Rate History Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
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
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5 text-right">22K</th>
                    <th className="px-5 py-3.5 text-right">18K</th>
                    <th className="px-5 py-3.5 text-right">24K</th>
                    <th className="px-5 py-3.5 text-right">Silver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.slice(0, 10).map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-xs text-slate-600 font-medium">
                        {new Date(r.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-900">₹{r.rate_22k}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-700">₹{r.rate_18k}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-700">
                        {r.rate_999 ? `₹${r.rate_999}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-900">₹{r.rate_silver}</td>
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
