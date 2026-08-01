import GstReport from '@/components/app_component/reports/GstRport'
import ItemWiseSales from '@/components/app_component/reports/ItemWiseSales'
import SalesReport from '@/components/app_component/reports/SalesReport'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React from 'react'

const page = () => {
  // Sales | Bills | Items | Payments | GST | Stock
  return (
    <div className='lg:px-4'>
       <Tabs className='' defaultValue='sales'>
        <TabsList>
          <TabsTrigger className='px-4' value='sales'>Sales</TabsTrigger>
          <TabsTrigger className='px-4' value='items-wise-sales'>Items wise Sales</TabsTrigger>
          <TabsTrigger className='px-4' value='gst'>GST</TabsTrigger>
          <TabsTrigger className='px-4' value='payments'>Payments</TabsTrigger>
          <TabsTrigger className='px-4' value='stock'>Stock</TabsTrigger>
          <TabsTrigger className='px-4' value='bills'>Bills</TabsTrigger>
        </TabsList>

          <TabsContent value='sales'>
            <SalesReport />
          </TabsContent>
          <TabsContent value='items-wise-sales'>
            <ItemWiseSales />
          </TabsContent>
          <TabsContent value='gst'>
            <GstReport />
          </TabsContent>
          <TabsContent value='payments'></TabsContent>
          <TabsContent value='stock'></TabsContent>
          <TabsContent value='bills'></TabsContent>
       </Tabs>

      
    </div>
  )
}

export default page
