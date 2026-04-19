import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useQueries, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Fullscreen, Printer, View } from "lucide-react";
import { Dialog, DialogContent } from "../ui/dialog";
import BillTemplate from "./BillTemplate";



export default function BillHistory(){

    const [search,setSearch] = useState('');
    const [selectedBill,setSelectedBill]= useState(null)
   
   
    const {data,isLoading}  = useQuery({
        queryKey:['bill-history',search],
        queryFn:()=>api.get(`/bill/all?search=${search}`).then(r=>r.data)

    });


    const handlePrint = ()=>{
          window.print();
    }

    return (

        <div className="">
            {/* search  */}
            <div className="flex gap-3 items-center">
                <div className="flex gap-2 border border-gold-dark  px-2 p-1 rounded items-center w-[330px]">
                <span>🔍</span>
                <input onChange={(e)=>setSearch(e.target.value)} className="outline-none flex-1  text-lg tracking-wide" type="text" placeholder="Search bill no / customer / phone" />
                </div>
                <Button size={"lg"}>Search</Button>                
            </div>

            <div>
                <Table>
                    <TableHeader>
                        <TableRow>  
                            <TableHead>#</TableHead>
                            <TableHead>Bill No</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Village</TableHead>
                            <TableHead>Date</TableHead>             
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Action</TableHead>

                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data?.map((bill:any,i:number)=>(
                            <TableRow key={bill.id}>
                                <TableCell>{i+1}</TableCell>
                                <TableCell>{bill.bill_number}</TableCell>
                                <TableCell>{bill.customer.name}</TableCell>
                                <TableCell>{bill.customer.phone}</TableCell>
                                <TableCell>{bill.customer.village}</TableCell>
                                <TableCell>{new Date(bill.created_at).toLocaleDateString('en-IN')}</TableCell>
                                <TableCell className="text-right">
                                ₹ {Number(bill.payableAmount).toLocaleString('en-IN')}
                            </TableCell>
                                <TableCell className="text-center space-x-4">
                                    <button onClick={()=>setSelectedBill(bill)}> <Fullscreen size={16} strokeWidth={1}/> </button>
                                    {/* <button onClick={()=>{
                                        setSelectedBill(bill)
                                       handlePrint()
                                    }} > <Printer size={16} strokeWidth={1} /> </button> */}
                                </TableCell>
                                {/* <Fullscreen strokeWidth={1} /> */}


                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex justify-end gap-3 mt-5">
                    <Button variant='outline'>Prev</Button>
                    <Button variant='outline'>Next</Button>
                </div>
        
            </div>


        <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
  <DialogContent className="max-w-[95vw] w-[95vw] p-2">
    {selectedBill && (
      <>
        {/* <div  className="overflow-auto max-h-[85vh] print-area"> */}
        <div  className="print-area">
          <BillTemplate data={selectedBill} />
        </div>
        <div className="text-right mt-2">
          <button onClick={handlePrint}>Print</button>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>
            
        </div>
    )
}