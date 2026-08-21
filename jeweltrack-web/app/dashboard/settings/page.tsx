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
    <div className="space-y-4 max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-10 border border-slate-200 shadow-xs flex-wrap">
          <TabsTrigger className="px-4 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5" value="basic">
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>Shop Profile</span>
          </TabsTrigger>

          <TabsTrigger
            className="px-4 text-xs sm:text-sm font-bold rounded-lg data-[state=active]:bg-gold data-[state=active]:text-white flex items-center gap-1.5 shadow-xs"
            value="subscription"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Plan & Billing</span>
          </TabsTrigger>

          <TabsTrigger className="px-4 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5" value="tax">
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>Tax & GST</span>
          </TabsTrigger>

          <TabsTrigger className="px-4 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5" value="invoice">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Invoice Settings</span>
          </TabsTrigger>

          <TabsTrigger className="px-4 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5" value="branding">
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Branding & Logo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <ShopBasicDetails />
        </TabsContent>
        <TabsContent value="subscription">
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