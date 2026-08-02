import ShopBasicDetails from '@/components/app_component/settings/ShopBasicDetails'
import ShopInvoiceDetails from '@/components/app_component/settings/ShopInvoiceDetails '
import ShopTaxDetails from '@/components/app_component/settings/ShopTaxDetails'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React from 'react'

const page = () => {
  // Sales | Bills | Items | Payments | GST | Stock
  return (
    <div className='lg:px-4'>
       <Tabs className='' defaultValue='basic'>
        <TabsList>
          <TabsTrigger className='px-4' value='basic'>Shop Profile Basic Detail</TabsTrigger>
          <TabsTrigger className='px-4' value='tax'>Tax</TabsTrigger>
          <TabsTrigger className='px-4' value='invoice'>Invoice</TabsTrigger>
          <TabsTrigger className='px-4' value='bank'>Bank Details</TabsTrigger>
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
         
       </Tabs>

      
    </div>
  )
}

export default page