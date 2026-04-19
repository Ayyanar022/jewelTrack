import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useQueries, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Eye, Fullscreen, Printer, Search, View } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
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

    const handleSearch = ()=>{

    }

    return (

        <div className="">
              

           <div>
            {/* Search toolbar */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 border border-gold-dark px-3 py-1.5 rounded-md flex-1 max-w-sm bg-white">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                    className="outline-none flex-1 text-sm bg-transparent"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Bill no, customer, phone…"
                />
                </div>
                <Button size="sm" onClick={handleSearch}>Search</Button>
            </div>

            {/* Table */}
            <div className="border border-gray-200 overflow-hidden bg-white">
                <Table>
                <TableHeader>
                    <TableRow className=" border border-sidebar-dark/40 bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-10 text-sm uppercase tracking-wide text-gold-dark font-[600] ">#</TableHead>
                    <TableHead className="text-sm uppercase tracking-wide text-gold-dark font-[600]">Bill no</TableHead>
                    <TableHead className="text-sm uppercase tracking-wide text-gold-dark font-[600]">Customer</TableHead>
                    <TableHead className="text-sm uppercase tracking-wide text-gold-dark font-[600]">Phone</TableHead>
                    <TableHead className="text-sm uppercase tracking-wide text-gold-dark font-[600]">Village</TableHead>
                    <TableHead className="text-sm uppercase tracking-wide text-gold-dark font-[600]">Date</TableHead>
                    <TableHead className="text-sm uppercase tracking-wide text-gold-dark font-[600]">GST</TableHead>
                    <TableHead className="text-sm uppercase tracking-wide text-gold-dark font-[600] text-right">Amount</TableHead>
                    <TableHead className="text-sm uppercase tracking-wide text-gold-dark font-[600] text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                        Loading bills…
                        </TableCell>
                    </TableRow>
                    ) : data?.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                        <p className="text-slate-400 text-sm">No bills found</p>
                        </TableCell>
                    </TableRow>
                    ) : (
                    data?.map((bill: any, i: number) => (
                        <TableRow key={bill.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-slate-700 text-sm">{i + 1}</TableCell>
                        <TableCell>
                            <span className="font-mono text-base bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {bill.bill_number}
                            </span>
                        </TableCell>
                        <TableCell className="font-medium text-base">{bill.customer.name}</TableCell>
                        <TableCell className="text-slate-800 text-base">{bill.customer.phone}</TableCell>
                        <TableCell className="text-slate-800 text-base">{bill.customer.village}</TableCell>
                        <TableCell className="text-slate-800 text-base">
                            {new Date(bill.created_at).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="text-slate-700 text-[13px]">
                           {bill.is_gst_bill && (
                            <span className="ml-1.5  bg-green-50 text-green-700 font-medium px-1.5 py-0.5 rounded">
                                GST
                            </span>
                            )}
                        </TableCell>

                        <TableCell className="text-right">
                            <span className="font-semibold text-slate-600 text-base ">
                            ₹ {Number(bill.payableAmount).toLocaleString('en-IN')}
                            </span>
                           
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => setSelectedBill(bill)}
                                className="p-1.5 cursor-pointer rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                title="View bill"
                            >
                                <Eye size={16} strokeWidth={1.5} />
                            </button>                       
                            </div>
                        </TableCell>
                        </TableRow>
                    ))
                    )}
                </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400">Showing {data?.length ?? 0} bills</span>
                <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>← Prev</Button>
                <Button variant="outline" size="sm" disabled>Next →</Button>
                </div>
            </div>
            </div>


        <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
  <DialogContent className="max-w-[95vw] w-[95vw] p-2">
      <DialogTitle>Bill Details</DialogTitle>

    {selectedBill && (
      <>
        <div  className="overflow-auto max-h-[85vh] print-area">
        {/* <div  className="print-area"> */}
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