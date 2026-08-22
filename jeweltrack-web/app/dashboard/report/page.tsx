'use client';

import SalesReport from '@/components/app_component/reports/SalesReport';
import ItemWiseSales from '@/components/app_component/reports/ItemWiseSales';
import GstReport from '@/components/app_component/reports/GstRport';
import LoanReport from '@/components/app_component/reports/LoanReport';
import PendingPayments from '@/components/app_component/reports/PendingPayments';
import CustomerWiseSalesReport from '@/components/app_component/reports/CustomerWiseSalesReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-3.5 max-w-7xl mx-auto px-8 pb-6">
      <Tabs defaultValue="sales" className="w-full space-y-3.5">
        {/* Unified Compact Toolbar Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-amber-700" />
            <h1 className="text-lg font-black text-slate-900">Analytics & Reports</h1>
          </div>

          {/* Integrated Horizontal Scrolling / Wrapping TabsList */}
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto flex flex-wrap gap-1">
            <TabsTrigger
              className="px-3 py-1 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all"
              value="sales"
            >
              📊 Daily Sales
            </TabsTrigger>
            <TabsTrigger
              className="px-3 py-1 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all"
              value="loans"
            >
              🪙 Gold Loans
            </TabsTrigger>
            <TabsTrigger
              className="px-3 py-1 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all"
              value="gst"
            >
              🏛️ GST Summary
            </TabsTrigger>
            <TabsTrigger
              className="px-3 py-1 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all"
              value="items-wise-sales"
            >
              🏷️ Item-Wise
            </TabsTrigger>
            <TabsTrigger
              className="px-3 py-1 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all"
              value="payments"
            >
              ⏳ Pending Credit
            </TabsTrigger>
            <TabsTrigger
              className="px-3 py-1 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all"
              value="customer-sales"
            >
              👥 Customer-Wise
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sales" className="mt-0">
          <SalesReport />
        </TabsContent>

        <TabsContent value="loans" className="mt-0">
          <LoanReport />
        </TabsContent>

        <TabsContent value="gst" className="mt-0">
          <GstReport />
        </TabsContent>

        <TabsContent value="items-wise-sales" className="mt-0">
          <ItemWiseSales />
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          <PendingPayments />
        </TabsContent>

        <TabsContent value="customer-sales" className="mt-0">
          <CustomerWiseSalesReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
