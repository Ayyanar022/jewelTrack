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
import { ArrowLeft, Phone, MapPin, Loader2 } from 'lucide-react';

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
    <div className="flex flex-col gap-3 sm:gap-3.5 max-w-7xl mx-auto w-full pb-10">
      <Tabs defaultValue="loan" className="w-full space-y-3 sm:space-y-3.5">
        {/* Unified Compact Header: Back Button + Customer Info + Integrated Tabs */}
        <div className="bg-white p-3 sm:px-4 sm:py-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Back Button + Customer Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <Link
              href="/dashboard/customers"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Back to Customers"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h1 className="text-xs sm:text-base font-bold text-slate-900 truncate">
                {customer?.name || (isLoading ? 'Loading...' : 'Customer Profile')}
              </h1>

              {customer?.phone && (
                <div className="flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}

              {(customer?.village || customer?.address) && (
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>
                    {customer.village} {customer.address ? `• ${customer.address}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Integrated Tabs List (Mobile full grid, desktop inline) */}
          <div className="w-full md:w-auto">
            <TabsList className="h-8.5 sm:h-10 bg-slate-100 p-0.5 sm:p-1 rounded-lg border border-slate-200 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger
                value="loan"
                className="px-2 sm:px-4 text-[11px] sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs rounded-md cursor-pointer transition-all whitespace-nowrap justify-center"
              >
                🪙 Gold Loans
              </TabsTrigger>
              <TabsTrigger
                value="purchase"
                className="px-2 sm:px-4 text-[11px] sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs rounded-md cursor-pointer transition-all whitespace-nowrap justify-center"
              >
                🧾 Bills
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="px-2 sm:px-4 text-[11px] sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs rounded-md cursor-pointer transition-all whitespace-nowrap justify-center"
              >
                📊 Analytics
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Real Content Sections (Full Screen Height Allocation) */}
        <TabsContent value="loan" className="mt-0 outline-none">
          <CustomerLoans customerId={id as string} />
        </TabsContent>

        <TabsContent value="purchase" className="mt-0 outline-none">
          <Purchase id={id as string} />
        </TabsContent>

        <TabsContent value="stats" className="mt-0 outline-none">
          <CustomerStats id={id as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function CustomerViewWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading customer details...</span>
        </div>
      }
    >
      <CustomerView />
    </Suspense>
  );
}