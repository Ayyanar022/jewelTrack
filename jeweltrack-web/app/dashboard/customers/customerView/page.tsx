'use client'

import CustomerStats from "@/components/app_component/customer/CustomerStats"
import Purchase from "@/components/app_component/customer/Purchase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"



const CustomerView = () => {
  const searchParm = useSearchParams()
  const id = searchParm.get('id')
  return (
    <div>
        <Tabs defaultValue="stats">
          <TabsList className="">
            <TabsTrigger value="stats" className="px-4 text-base"> Stats </TabsTrigger>
            <TabsTrigger value="purchase" className="px-4 text-base">Purchase </TabsTrigger>
            <TabsTrigger value="loan" className="px-4 text-base"> Loan</TabsTrigger>
          </TabsList>

          <TabsContent  value="stats">
           <CustomerStats />
          </TabsContent>

          <TabsContent  value="purchase">
            <Purchase id={id} />
          </TabsContent>

          <TabsContent  value="loan">
            loan
          </TabsContent>

        </Tabs>
      
    </div>
  )
}

export default CustomerView
