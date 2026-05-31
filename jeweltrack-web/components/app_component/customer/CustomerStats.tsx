import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { TableCell, TableRow } from "@/components/ui/table"
import api from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"

const CustomerStats = ({id}:{id:string}) => {


  const {data:stats} = useQuery({
    queryKey:['customer-stats',id],
    queryFn:async()=> api.get(`/customer/stats/${id}`).then(r=>r.data)
  })

  console.log("stats",stats)


  return (
    <div className="px-10">

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-10 mt-5">
        <Card className="p-4">
          <CardTitle>Total Bills</CardTitle>
          <CardContent>
            {stats?.billStats._count.id}
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardTitle>Total Purchase</CardTitle>
          <CardContent>
            ₹{stats?.billStats._sum.payableAmount?.toLocaleString('en-IN')}
          </CardContent>
        </Card>
      </section>

      <div className="px-20 h-[2px] bg-amber-200 my-10" />

      <section className="">
        <TableRow className="border ">
          <TableCell className="border">#</TableCell>
          <TableCell className="border px-5">Metal</TableCell>
          <TableCell className="border px-5">Purity</TableCell>
          <TableCell className="border px-5">Total gross wgt</TableCell>
          <TableCell className="border px-5">Total net wgt</TableCell>
          <TableCell className="border px-5">Total Amount</TableCell>
        </TableRow>
       {stats?.billItemStats.map((item: any,i:number) => (
        <TableRow key={`${item.metal}-${item.purity}`}>
          <TableCell className="border ">{i+1}</TableCell>
          <TableCell className="border ">{item.metal}</TableCell>
          <TableCell className="border ">{item.purity}</TableCell>
          <TableCell className="border ">{item._sum.gross_weight?.toFixed(2)}</TableCell>
          <TableCell className="border ">{item._sum.net_weight?.toFixed(2)}</TableCell>
          <TableCell className="border ">
            ₹{item._sum.amount?.toLocaleString('en-IN')}
          </TableCell>
        </TableRow>
      ))}
      </section>
        
      
    </div>
  )
}

export default CustomerStats
