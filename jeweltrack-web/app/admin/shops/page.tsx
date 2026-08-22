'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Shop } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Store,
  Users,
  FileText,
  Calendar,
  ShieldCheck,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function AdminShopsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['admin-shops'],
    queryFn: async () => {
      const res = await api.get('/users/admin/shops');
      return res.data;
    },
  });

  const totalShopsCount = shops.length;
  const activeCount = shops.filter((s) => s.subscription_status === 'ACTIVE').length;
  const trialCount = shops.filter((s) => s.subscription_status === 'TRIAL' || !s.subscription_status).length;
  const expiredCount = shops.filter((s) => s.subscription_status === 'EXPIRED').length;

  const filteredShops = shops.filter((shop) => {
    const owner = shop.users?.find((u) => u.role === 'SHOP_OWNER') || shop.users?.[0];
    const matchesSearch =
      shop.name.toLowerCase().includes(search.toLowerCase()) ||
      owner?.name?.toLowerCase().includes(search.toLowerCase()) ||
      owner?.phone?.includes(search);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'TRIAL' && (shop.subscription_status === 'TRIAL' || !shop.subscription_status)) ||
      shop.subscription_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* 1. Top Metrics KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Stores */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-black shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Stores</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">{totalShopsCount}</div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Paid</div>
            <div className="text-2xl font-black font-mono text-emerald-800 mt-0.5">{activeCount}</div>
          </div>
        </div>

        {/* Free Trials */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Free Trials</div>
            <div className="text-2xl font-black font-mono text-amber-900 mt-0.5">{trialCount}</div>
          </div>
        </div>

        {/* Expired Stores */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-black shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Expired</div>
            <div className="text-2xl font-black font-mono text-rose-800 mt-0.5">{expiredCount}</div>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar (Search & Status Filter) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by shop name, owner, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm font-medium border-slate-300 rounded-lg"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Switcher Tabs */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-sm font-bold self-start sm:self-auto">
          {[
            { id: 'ALL', label: 'All Stores' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'TRIAL', label: 'Trial' },
            { id: 'EXPIRED', label: 'Expired' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Modern Grid-Bordered Tenants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-500">Loading registered stores...</span>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Store className="w-10 h-10 mx-auto opacity-30 text-slate-600" />
            <p className="text-base font-bold text-slate-800">No stores found</p>
            <p className="text-xs text-slate-500">Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center border border-slate-200">#</th>
                  <th className="px-4 py-3.5 border border-slate-200">Shop & Owner</th>
                  <th className="px-4 py-3.5 border border-slate-200">Contact</th>
                  <th className="px-4 py-3.5 border border-slate-200">Plan & Subscription</th>
                  <th className="px-4 py-3.5 text-center border border-slate-200">Staff</th>
                  <th className="px-4 py-3.5 border border-slate-200">Activity</th>
                  <th className="px-4 py-3.5 text-right border border-slate-200">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShops.map((shop, i) => {
                  const owner = shop.users?.find((u) => u.role === 'SHOP_OWNER') || shop.users?.[0];
                  const staffCount = shop.users?.length || 0;
                  const latestSub = (shop as any).subscription?.[0];
                  const planName =
                    latestSub?.plan?.name ||
                    (shop.subscription_plan === 'TRIAL' ? 'PRO' : shop.subscription_plan || 'PRO');
                  const isTrial = shop.subscription_status === 'TRIAL' || latestSub?.status === 'TRIAL' || !shop.subscription_status;
                  const isExpired = shop.subscription_status === 'EXPIRED' || latestSub?.status === 'EXPIRED';
                  const isActive = !isTrial && !isExpired;

                  const now = new Date();
                  const endDate = latestSub?.current_period_end ? new Date(latestSub.current_period_end) : null;
                  const daysRemaining = endDate
                    ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                    : null;

                  return (
                    <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                      {/* Index */}
                      <td className="px-4 py-3.5 text-center text-sm font-medium text-slate-500 font-mono border border-slate-200">
                        {i + 1}
                      </td>

                      {/* Shop Name & Owner */}
                      <td className="px-4 py-3.5 border border-slate-200">
                        <div className="font-bold text-slate-900 text-base">{shop.name}</div>
                        <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                          <span>Owner: <strong className="text-slate-800">{owner?.name || 'Unassigned'}</strong></span>
                        </div>
                      </td>

                      {/* Contact Phone & Email */}
                      <td className="px-4 py-3.5 border border-slate-200">
                        <div className="font-bold font-mono text-slate-900 text-sm">
                          {owner?.phone || '—'}
                        </div>
                        {owner?.email && (
                          <div className="text-xs text-slate-500 font-medium truncate max-w-[180px]">
                            {owner.email}
                          </div>
                        )}
                      </td>

                      {/* Plan & Subscription Status */}
                      <td className="px-4 py-3.5 border border-slate-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs uppercase px-2.5 py-0.5 rounded bg-slate-900 text-white shadow-2xs">
                            {planName}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                              isTrial
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : isExpired
                                ? 'bg-rose-50 text-rose-900 border-rose-300'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {isTrial ? 'Free Trial' : isExpired ? 'Expired' : 'Active'}
                          </Badge>
                        </div>
                        {isTrial && daysRemaining !== null && (
                          <div className="text-xs text-amber-800 font-bold flex items-center gap-1 mt-1 font-mono">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>{daysRemaining} days remaining</span>
                          </div>
                        )}
                      </td>

                      {/* Staff Count */}
                      <td className="px-4 py-3.5 text-center border border-slate-200">
                        <div className="inline-flex items-center gap-1.5 text-slate-800 font-bold text-sm bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-mono">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>{staffCount}</span>
                        </div>
                      </td>

                      {/* Activity Metrics */}
                      <td className="px-4 py-3.5 border border-slate-200">
                        <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-900 font-bold font-mono">{shop._count?.bill ?? 0}</strong> bills
                          </span>
                          <span>•</span>
                          <span>
                            <strong className="text-slate-900 font-bold font-mono">{shop._count?.customer ?? 0}</strong> customers
                          </span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3.5 text-right text-sm text-slate-600 font-mono border border-slate-200">
                        {new Date(shop.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
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
