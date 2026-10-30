'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ShopBasicDetails from '@/components/app_component/settings/ShopBasicDetails';
import ShopBranding from '@/components/app_component/settings/ShopBrandings';
import ShopInvoiceDetails from '@/components/app_component/settings/ShopInvoiceDetails ';
import ShopTaxDetails from '@/components/app_component/settings/ShopTaxDetails';
import ShopSubscription from '@/components/app_component/settings/ShopSubscription';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { Crown, Store, Receipt, FileText, Image as ImageIcon } from 'lucide-react';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'basic';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const { data } = useQuery({
    queryKey: ['shop-profile'],
    queryFn: () => api.get('/settings/shop-profile').then((r) => r.data),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <div className="flex flex-col gap-3 sm:gap-4 max-w-7xl mx-auto w-full px-2.5 sm:px-4 lg:px-8 pb-16">
      {/* Header Bar — Slim single row on mobile */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
            <h1 className="text-xs sm:text-base font-bold text-slate-900 truncate">Shop Settings</h1>
            <span className="hidden sm:inline text-xs text-slate-400 font-normal">(கடை அமைப்புகள்)</span>
          </div>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
            Manage showroom profile, tax information, invoice numbering, and subscription plan.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <div className="overflow-x-auto no-scrollbar scrollbar-none max-w-full pb-0.5">
          <TabsList className="bg-slate-100 p-0.5 sm:p-1 rounded-xl h-auto min-h-9 sm:min-h-10 border border-slate-200 shadow-xs inline-flex gap-0.5 sm:gap-1">
            <TabsTrigger className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer" value="basic">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Shop Profile</span>
            </TabsTrigger>

            <TabsTrigger
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              value="subscription"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Plan & Billing</span>
            </TabsTrigger>

            <TabsTrigger className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer" value="tax">
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span>Tax & GST</span>
            </TabsTrigger>

            <TabsTrigger className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer" value="invoice">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Invoice & Scheme</span>
            </TabsTrigger>

            <TabsTrigger className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer" value="branding">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Branding & Logo</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic">
          <ShopBasicDetails />
        </TabsContent>
        <TabsContent value="subscription" >
          <ShopSubscription />
        </TabsContent>
        <TabsContent value="tax">
          <ShopTaxDetails />
        </TabsContent>
        <TabsContent value="invoice">
          <ShopInvoiceDetails />
        </TabsContent>
        <TabsContent value="branding">
          <ShopBranding logo={data?.logo_url} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}