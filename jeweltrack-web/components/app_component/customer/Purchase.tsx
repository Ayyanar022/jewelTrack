import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import api from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"
import { Eye } from "lucide-react"

const Purchase = ({id}:{id:string}) => {

    const {data:bill } = useQuery({
        queryKey:["CustomerBill",id],
        queryFn:async()=> api.get(`/customer/purchase/${id}`).then(r=>r.data)
    })

    console.log("bill ", bill)

  return (
    <div>
      <section className="px-10">
        <Table>
            <TableHeader>
                <TableRow className="bg-white text-lg font-bold">
                        <TableHead className="border text-center ">#</TableHead>
                        <TableHead className="border text-center  font-medium">Bill number</TableHead>
                        <TableHead className="border text-center   ">Date</TableHead>
                        <TableHead className="border text-center ">Total amount</TableHead>
                        <TableHead className="border text-center ">GST</TableHead>
                        <TableHead className="border  text-center">PayableAmount</TableHead>
                        <TableHead className="border text-center">Action</TableHead>
                 
                </TableRow>

            </TableHeader>
            <TableBody>
                {bill?.length>0 && bill.map((bill:any , i:number)=>(
                <TableRow key={bill.id} className="text-base">
                    <TableCell className="text-center">{i+1}</TableCell>                  
                    <TableCell className="text-center">{bill.bill_number}</TableCell>                  
                    <TableCell className="text-center">{new Date(bill.created_at).toLocaleDateString('en-IN')}</TableCell>                  
                    <TableCell className="text-right px-4">{(bill.total_amount).toLocaleString()}</TableCell>                  
                    <TableCell  className={`text-right px-3 ${bill.is_gst_bill ? 'bg-green-200' : ''} `}>{bill.is_gst_bill ? (bill.totalGST).toLocaleString() :""}</TableCell>                  
                    <TableCell className="text-right px-5 font-semibold">{(bill.payableAmount).toLocaleString()}</TableCell>                  
                    <TableCell className=" flex justify-center">
                        <Eye size={15}/>
                    </TableCell>                  

                </TableRow>

                ))}
          
            </TableBody>
        </Table>
      </section>
    </div>
  )
}

export default Purchase
