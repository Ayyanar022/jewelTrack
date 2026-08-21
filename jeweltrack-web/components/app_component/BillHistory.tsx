import {  useState } from "react";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {  useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Eye,  History,  Plus,  PrinterXIcon,  Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import BillTemplate from "./BillTemplate";

import Link from "next/link";

interface Params {
    newBill:()=>void;
    history:()=>void;
    activeTab:string;
}



export default function BillHistory({newBill ,history ,activeTab}:Params){

    const [search,setSearch] = useState('');
    const [selectedBill,setSelectedBill]= useState(null)
    const [page,setPage] = useState(1)
    const LIMIT = 7 ;
   
   
    const {data,isLoading}  = useQuery({
        queryKey:['bill-history',search,page],
        queryFn:()=>api.get(`/bill/all?search=${search}&page=${page}&limit=${LIMIT}`).then(r=>r.data)

    });


    const handlePrint = ()=>{
          window.print();
    }

    const handleSearch = ()=>{

    }


    return (

        <div className="">

            {/* searchbar and tab navigation  */}

        <div className="bg-white p-3 rounded-lg border shadow-sm mb-2">
        <div className="flex items-center justify-between gap-4">
            {/* Left side - Search toolbar */}
            <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 border border-gray-300 px-2 py-1.5 rounded bg-white focus-within:ring-2 focus-within:ring-amber-500 flex-1 max-w-sm">
                <Search size={15} className="text-gray-400" />
                <input
                className="flex-1 outline-none text-sm bg-transparent"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by bill no, customer, phone..."
                />
            </div>
            
            <div className="flex items-center gap-1.5">
                <button
                onClick={handleSearch}
                className="px-3 py-1.5 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
                >
                Today
                </button>
                <button
                onClick={handleSearch}
                className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                Week
                </button>
                <button
                onClick={handleSearch}
                className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                Month
                </button>
            </div>
            </div>

            {/* Right side - Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
            <button
                onClick={newBill}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'new' 
                    ? 'bg-white shadow-sm text-amber-700' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
            >
                <Plus size={15} />
                New Bill
            </button>
            <button
                onClick={history}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'history' 
                    ? 'bg-white shadow-sm text-amber-700' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
            >
                <History size={15} />
                History
            </button>
            </div>
        </div>
        </div>          
          
                        

        <div>
        

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
                    <TableCell className="text-center ">
                        <div className="flex items-center justify-center gap-2">
                        <Link href={`/dashboard/billing/${bill.id}`}>                        
                        <button
                            // onClick={()=> router.push(`/billing/${bill.id}`) }
                            className="p-1.5 cursor-pointer rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                            title="View bill"
                        >
                            <Eye size={16} strokeWidth={1.5} />
                        </button>     
                            </Link>   

                                <button
                            // onClick={() => setSelectedBill(bill)}
                            onClick={()=>  window.open(`/print/${bill.id}`, '_blank')}
                            className="p-1.5 cursor-pointer rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                            title="View bill"
                        >
                            <PrinterXIcon size={16} strokeWidth={1.5} />
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
            <Button variant="outline" size="sm" onClick={()=>setPage(p=>p-1)} disabled={page===1}>← Prev</Button>
            <Button variant="outline" size="sm" onClick={()=>setPage(p=>p+1)} disabled={data?.length<LIMIT}>Next →</Button>
            </div>
        </div>
        </div>


            
        </div>
    )
}