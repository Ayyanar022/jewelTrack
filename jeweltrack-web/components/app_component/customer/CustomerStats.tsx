// import { Card, CardContent, CardTitle } from "@/components/ui/card"
// import { TableCell, TableRow } from "@/components/ui/table"
// import api from "@/lib/axios"
// import { useQuery } from "@tanstack/react-query"

// const CustomerStats = ({id}:{id:string}) => {


//   const {data:stats} = useQuery({
//     queryKey:['customer-stats',id],
//     queryFn:async()=> api.get(`/customer/stats/${id}`).then(r=>r.data)
//   })

//   console.log("stats",stats)


//   return (
//     <div className="px-10">

//       <section className="grid grid-cols-2 lg:grid-cols-4 gap-10 mt-5">
//         <Card className="p-4">
//           <CardTitle>Total Bills</CardTitle>
//           <CardContent>
//             {stats?.billStats._count.id}
//           </CardContent>
//         </Card>

//         <Card className="p-4">
//           <CardTitle>Total Purchase</CardTitle>
//           <CardContent>
//             ₹{stats?.billStats._sum.payableAmount?.toLocaleString('en-IN')}
//           </CardContent>
//         </Card>
//       </section>

//       <div className="px-20 h-[2px] bg-amber-200 my-10" />

//       <section className="">
//         <TableRow className="border ">
//           <TableCell className="border">#</TableCell>
//           <TableCell className="border px-5">Metal</TableCell>
//           <TableCell className="border px-5">Purity</TableCell>
//           <TableCell className="border px-5">Total gross wgt</TableCell>
//           <TableCell className="border px-5">Total net wgt</TableCell>
//           <TableCell className="border px-5">Total Amount</TableCell>
//         </TableRow>
//        {stats?.billItemStats.map((item: any,i:number) => (
//         <TableRow key={`${item.metal}-${item.purity}`}>
//           <TableCell className="border ">{i+1}</TableCell>
//           <TableCell className="border ">{item.metal}</TableCell>
//           <TableCell className="border ">{item.purity}</TableCell>
//           <TableCell className="border ">{item._sum.gross_weight?.toFixed(2)}</TableCell>
//           <TableCell className="border ">{item._sum.net_weight?.toFixed(2)}</TableCell>
//           <TableCell className="border ">
//             ₹{item._sum.amount?.toLocaleString('en-IN')}
//           </TableCell>
//         </TableRow>
//       ))}
//       </section>
        
      
//     </div>
//   )
// }

// export default CustomerStats


import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import api from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"
import { Receipt, Wallet } from "lucide-react"

const CustomerStats = ({ id }: { id: string }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['customer-stats', id],
    queryFn: async () => api.get(`/customer/stats/${id}`).then(r => r.data),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="px-1 py-10 text-center text-sm text-slate-400">
        Loading stats…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Summary cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 shadow-none">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-amber-50 flex items-center justify-center">
              <Receipt size={15} className="text-amber-600" />
            </div>
            <CardTitle className="text-xs font-medium text-slate-500">Total Bills</CardTitle>
          </div>
          <CardContent className="p-0 mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {stats?.billStats._count.id ?? 0}
          </CardContent>
        </Card>

        <Card className="p-4 border-slate-200 shadow-none">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-amber-50 flex items-center justify-center">
              <Wallet size={15} className="text-amber-600" />
            </div>
            <CardTitle className="text-xs font-medium text-slate-500">Total Purchase</CardTitle>
          </div>
          <CardContent className="p-0 mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            ₹{stats?.billStats._sum.payableAmount?.toLocaleString('en-IN') ?? 0}
          </CardContent>
        </Card>
      </section>

      {/* Metal / purity breakdown */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100">
          <h3 className="text-sm font-medium text-slate-700">Metal &amp; purity breakdown</h3>
        </div>

        {!stats?.billItemStats?.length ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No purchase data yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 hover:bg-slate-100 border-b border-slate-200">
                <TableHead className="text-[14px] pl-7 uppercase tracking-wide text-slate-500 font-semibold w-10">#</TableHead>
                <TableHead className="text-[14px] uppercase tracking-wide text-slate-500 font-semibold">Metal</TableHead>
                <TableHead className="text-[14px] uppercase tracking-wide text-slate-500 font-semibold">Purity</TableHead>
                <TableHead className="text-[14px] uppercase tracking-wide text-slate-500 font-semibold text-right">Gross wgt (g)</TableHead>
                <TableHead className="text-[14px] uppercase tracking-wide text-slate-500 font-semibold text-right">Net wgt (g)</TableHead>
                <TableHead className="text-[14px] pr-7 uppercase tracking-wide text-slate-500 font-semibold text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.billItemStats.map((item: any, i: number) => (
                <TableRow
                  key={`${item.metal}-${item.purity}`}
                  className={`border-b border-slate-100 last:border-0 hover:bg-amber-50 ${i % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}`}
                >
                  <TableCell className="text-slate-400 pl-7 py-1.5 text-base">{i + 1}</TableCell>
                  <TableCell className="font-medium text-slate-900 py-1.5 text-base">{item.metal}</TableCell>
                  <TableCell className="text-slate-700 py-1.5 text-base">{item.purity}</TableCell>
                  <TableCell className="text-slate-700 py-1.5 text-base text-right tabular-nums">
                    {item._sum.gross_weight?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-slate-700 py-1.5 text-base text-right tabular-nums">
                    {item._sum.net_weight?.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 py-1.5 text-base pr-7 text-right tabular-nums">
                    ₹{item._sum.amount?.toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}

export default CustomerStats
