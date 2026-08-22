'use client';

import SalesReport from '@/components/app_component/reports/SalesReport';
import ItemWiseSales from '@/components/app_component/reports/ItemWiseSales';
import GstReport from '@/components/app_component/reports/GstRport';
import LoanReport from '@/components/app_component/reports/LoanReport';
import PendingPayments from '@/components/app_component/reports/PendingPayments';
import CustomerWiseSalesReport from '@/components/app_component/reports/CustomerWiseSalesReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto p-2">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Showroom Analytics & Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">Export sales, GST, loan, and payment reports for auditing and CA filing.</p>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="h-11 bg-slate-100 p-1 rounded-xl flex-wrap">
          <TabsTrigger
            className="px-5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs rounded-lg"
            value="sales"
          >
            📊 Sales Report
          </TabsTrigger>
          <TabsTrigger
            className="px-5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs rounded-lg"
            value="loans"
          >
            🪙 Gold Loans (Girvi)
          </TabsTrigger>
          <TabsTrigger
            className="px-5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs rounded-lg"
            value="gst"
          >
            🏛️ GST Summary (GSTR-1)
          </TabsTrigger>
          <TabsTrigger
            className="px-5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs rounded-lg"
            value="items-wise-sales"
          >
            🏷️ Item Wise Sales
          </TabsTrigger>
          <TabsTrigger
            className="px-5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs rounded-lg"
            value="payments"
          >
            ⏳ Pending Payments (Credit)
          </TabsTrigger>
          <TabsTrigger
            className="px-5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs rounded-lg"
            value="customer-sales"
          >
            👥 Customer Wise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesReport />
        </TabsContent>

        <TabsContent value="loans">
          <LoanReport />
        </TabsContent>

        <TabsContent value="gst">
          <GstReport />
        </TabsContent>

        <TabsContent value="items-wise-sales">
          <ItemWiseSales />
        </TabsContent>

        <TabsContent value="payments">
          <PendingPayments />
        </TabsContent>

        <TabsContent value="customer-sales">
          <CustomerWiseSalesReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
