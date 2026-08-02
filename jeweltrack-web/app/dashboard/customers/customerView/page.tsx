// 'use client'

// import CustomerStats from "@/components/app_component/customer/CustomerStats"
// import Purchase from "@/components/app_component/customer/Purchase"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { useSearchParams } from "next/navigation"



// const CustomerView = () => {
//   const searchParm = useSearchParams()
//   const id = searchParm.get('id')
//   return (
//     <div>
//         <Tabs defaultValue="stats">
//           <TabsList className="">
//             <TabsTrigger value="stats" className="px-4 text-base"> Stats </TabsTrigger>
//             <TabsTrigger value="purchase" className="px-4 text-base">Purchase </TabsTrigger>
//             <TabsTrigger value="loan" className="px-4 text-base"> Loan</TabsTrigger>
//           </TabsList>

//           <TabsContent  value="stats">
//            <CustomerStats id={id}/>
//           </TabsContent>

//           <TabsContent  value="purchase">
//             <Purchase id={id} />
//           </TabsContent>

//           <TabsContent  value="loan">
//             loan
//           </TabsContent>

//         </Tabs>
      
//     </div>
//   )
// }

// export default CustomerView



'use client'

import CustomerStats from "@/components/app_component/customer/CustomerStats"
import Purchase from "@/components/app_component/customer/Purchase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"

const CustomerView = () => {
  const searchParm = useSearchParams()
  const id = searchParm.get('id')

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="stats">
        <TabsList className="h-9 bg-slate-100 p-1">
          <TabsTrigger
            value="stats"
            className="px-4 text-sm data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
          >
            Stats
          </TabsTrigger>
          <TabsTrigger
            value="purchase"
            className="px-4 text-sm data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
          >
            Purchase
          </TabsTrigger>
          <TabsTrigger
            value="loan"
            className="px-4 text-sm data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
          >
            Loan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-4 mx-4">
          <CustomerStats id={id as string} />
        </TabsContent>

        <TabsContent value="purchase" className="mt-4">
          <Purchase id={id as string} />
        </TabsContent>

        <TabsContent value="loan" className="mt-4">
          <div className="px-4 py-10 text-center text-sm text-slate-400 bg-white border border-slate-200 rounded-lg">
            Loan tracking coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CustomerView