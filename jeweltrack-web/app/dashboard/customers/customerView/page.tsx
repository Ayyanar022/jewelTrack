'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import CustomerStats from "@/components/app_component/customer/CustomerStats";
import Purchase from "@/components/app_component/customer/Purchase";
import CustomerLoans from "@/components/app_component/customer/CustomerLoans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, User, Phone, MapPin, Home, Calendar } from 'lucide-react';

const CustomerView = () => {
  const searchParm = useSearchParams();
  const id = searchParm.get('id');

  // Fetch customer details
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer-detail', id],
    queryFn: async () => {
      const res = await api.get(`/customer/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto p-2 space-y-2">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* Customer Profile Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-gold flex items-center justify-center font-black text-2xl border border-amber-300">
            {customer?.name ? customer.name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900">{customer?.name || (isLoading ? 'Loading...' : 'Customer Profile')}</h1>
              <span className="bg-amber-50 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-200">
                Customer
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap text-sm text-slate-600 mt-1.5">
              {customer?.phone && (
                <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer?.village && (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{customer.village}</span>
                </div>
              )}
              {customer?.address && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Home className="w-4 h-4 text-slate-400" />
                  <span>{customer.address}</span>
                </div>
              )}
              {customer?.created_at && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Since {new Date(customer.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="loan">
        <TabsList className="h-11 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger
            value="loan"
            className="px-6 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs rounded-lg"
          >
            🪙 Gold / Silver Loans
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="px-6 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs rounded-lg"
          >
            📊 Purchase Analytics
          </TabsTrigger>
          <TabsTrigger
            value="purchase"
            className="px-6 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs rounded-lg"
          >
            🧾 Purchase Bills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loan" className="mt-4">
          <CustomerLoans customerId={id as string} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <CustomerStats id={id as string} />
        </TabsContent>

        <TabsContent value="purchase" className="mt-4">
          <Purchase id={id as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function CustomerViewWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading customer details...</div>}>
      <CustomerView />
    </Suspense>
  );
}