'use client'

import ShopBasicDetails from '@/components/app_component/settings/ShopBasicDetails'
import ShopBranding from '@/components/app_component/settings/ShopBrandings'
import ShopInvoiceDetails from '@/components/app_component/settings/ShopInvoiceDetails '
import ShopTaxDetails from '@/components/app_component/settings/ShopTaxDetails'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import React from 'react'

const page = () => {
  // Sales | Bills | Items | Payments | GST | Stock

        const { data } = useQuery({
        queryKey: ["shop-profile"],
        queryFn: () =>
            api.get("/settings/shop-profile").then((r) => r.data),

        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        });

  return (
    <div className='lg:px-4'>
       <Tabs className='' defaultValue='basic'>
        <TabsList>
          <TabsTrigger className='px-4' value='basic'>Shop Profile Basic Detail</TabsTrigger>
          <TabsTrigger className='px-4' value='tax'>Tax</TabsTrigger>
          <TabsTrigger className='px-4' value='invoice'>Invoice</TabsTrigger>
          {/* <TabsTrigger className='px-4' value='bank'>Bank Details</TabsTrigger> */}
          <TabsTrigger className='px-4' value='branding'>Branding</TabsTrigger>
        
        </TabsList>

          <TabsContent value='basic'>
                <ShopBasicDetails />
          </TabsContent>
          <TabsContent value='tax'>
                <ShopTaxDetails />
          </TabsContent>
          <TabsContent value='invoice'>
                <ShopInvoiceDetails />
          </TabsContent>
          <TabsContent value='branding'>
                <ShopBranding  logo={data?.logo_url}/>
          </TabsContent>
         
       </Tabs>

      
    </div>
  )
}

export default page