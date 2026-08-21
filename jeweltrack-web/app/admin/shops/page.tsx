'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Shop } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Store, Users, FileText, Calendar, ShieldCheck, Loader2 } from 'lucide-react';

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

  const filteredShops = shops.filter((shop) => {
    const owner = shop.users?.find((u) => u.role === 'SHOP_OWNER');
    const matchesSearch =
      shop.name.toLowerCase().includes(search.toLowerCase()) ||
      owner?.name.toLowerCase().includes(search.toLowerCase()) ||
      owner?.phone.includes(search);

    const matchesStatus =
      statusFilter === 'ALL' || shop.subscription_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span>Registered Shops & Tenants</span>
            <Badge variant="outline" className="text-xs bg-gold/10 text-gold border-gold/30">
              {shops.length} Total Shops
            </Badge>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor tenant activity, subscription tiers, staff counts, and transaction volume across all jewellery stores.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by shop name, owner name, or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'TRIAL', 'ACTIVE', 'EXPIRED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-gold text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No shops found matching your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Shop & Owner</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Plan & Status</th>
                  <th className="px-6 py-4 font-semibold">Staff Members</th>
                  <th className="px-6 py-4 font-semibold">Activity</th>
                  <th className="px-6 py-4 font-semibold">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShops.map((shop) => {
                  const owner = shop.users?.find((u) => u.role === 'SHOP_OWNER') || shop.users?.[0];
                  const staffCount = shop.users?.length || 0;
                  return (
                    <tr key={shop.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Shop & Owner */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{shop.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                          <span>Owner: {owner?.name || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{owner?.phone || 'N/A'}</div>
                        {owner?.email && <div className="text-xs text-slate-400">{owner.email}</div>}
                      </td>

                      {/* Plan & Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {shop.subscription_plan}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold px-2 py-0.5 uppercase ${
                              shop.subscription_status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : shop.subscription_status === 'TRIAL'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {shop.subscription_status}
                          </Badge>
                        </div>
                      </td>

                      {/* Staff */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>{staffCount} users</span>
                        </div>
                      </td>

                      {/* Activity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{shop._count?.bill ?? 0}</strong> bills
                          </span>
                          <span>•</span>
                          <span>
                            <strong>{shop._count?.customer ?? 0}</strong> customers
                          </span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(shop.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
