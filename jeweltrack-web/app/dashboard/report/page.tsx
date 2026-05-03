import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React from 'react'

const page = () => {
  // Sales | Bills | Items | Payments | GST | Stock
  return (
    <div>
       <Tabs>
        <TabsList>
          <TabsTrigger className='px-4' value='sales'>Sales</TabsTrigger>
          <TabsTrigger className='px-4' value='items'>Items</TabsTrigger>
          <TabsTrigger className='px-4' value='gst'>GST</TabsTrigger>
          <TabsTrigger className='px-4' value='payments'>Payments</TabsTrigger>
          <TabsTrigger className='px-4' value='stock'>Stock</TabsTrigger>
          <TabsTrigger className='px-4' value='bills'>Bills</TabsTrigger>
        </TabsList>

          <TabsContent value='sales'></TabsContent>
          <TabsContent value='items'></TabsContent>
          <TabsContent value='gst'></TabsContent>
          <TabsContent value='payments'></TabsContent>
          <TabsContent value='stock'></TabsContent>
          <TabsContent value='bills'></TabsContent>
       </Tabs>

      
    </div>
  )
}

export default page
