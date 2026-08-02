// 'use client'

// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import api from "@/lib/axios"
// import { queryClient } from "@/lib/queryClient"
// import { useMutation, useQuery } from "@tanstack/react-query"
// import { useState } from "react"

// interface EntryRows  {
//   category:string ,
//   purity : "K22" | "K18",
//   weight:string ,
//   type:"IN"|"OUT",
//   adjustment:boolean,
//   // stockType:"OWN" |"BORROW",
//   reference : string

// }

// const defaultEntry =  ():EntryRows =>({      
//   category:'' ,
//   purity : "K22" ,
//   weight: "",
//   type:"IN",
//   adjustment:false,
//   // stockType:"OWN" ,
//   reference : 'ADD'
// })

// const page = () => {

//   const [open,setOpen] = useState(false)
//   const [formHeader,setFormHeader]= useState('Add Item')
//   const [entryForm,setEntryForm] = useState<EntryRows>(defaultEntry())
//   const [error,setError] = useState('')
//   const [leadgerPage,setLeadgerPage] = useState(1)

//   const {data:categories} = useQuery({
//     queryKey :['categories'],
//     queryFn :()=>api.get('/jewellery-category').then(r=>r.data),
//       refetchOnWindowFocus: false,
//       staleTime: 1000 * 60 * 20,  // 20 mins

//   });

//   const {data:ledger} = useQuery({
//     queryKey :['inventory_ledger',leadgerPage],
//     queryFn :()=>api.get(`/inventory/inventory-ledger?page=${leadgerPage}`).then(r=>r.data),
//     refetchOnWindowFocus: false,
//     placeholderData: (prev)=>prev, // ✅ smooth pagination
//     staleTime: 1000 * 60 * 5,  // 20 mins
//   });

//   const {data:inventoryTotal}= useQuery({
//     queryKey:['inventoryTotal'],
//     queryFn: async()=>api.get('/inventory/inventory-total').then(r=>r.data),
//      refetchOnWindowFocus: false,
//     staleTime: 1000 * 60 * 5,  // 20 mins
//   })

//   console.log("inventoryTotal",inventoryTotal)

//   const {mutate,isSuccess} = useMutation({
//       mutationFn:(data:any)=>api.post('/inventory/in',data),
//         onSuccess:(res)=>{
//           queryClient.invalidateQueries({ queryKey: ['inventory_ledger'] })
//           queryClient.invalidateQueries({ queryKey: ['inventoryTotal'] })
//           setEntryForm(defaultEntry())
//           setOpen(false)
//         } ,
//         onError: (err:any) => {
//           console.log(err.response?.data)
//         }
//   })


//   const handleSubmitStock = (e)=>{
//     e.preventDefault()
//     setError('')
//     if(!entryForm.category || !entryForm.purity || !entryForm.weight  )return setError("Fill all Fields")
//     mutate({
//             category_id:entryForm.category ,
//             purity : entryForm.purity ,
//             weight:Number(entryForm.weight) ,
//             type:entryForm.type,
//             reference : entryForm.reference
//                 })
//   } 



//   return (
//     <div className="w-full min-h-screen">
//       <Tabs defaultValue="inventory">
//         <TabsList className="">
//           <TabsTrigger value="inventory">Inventory</TabsTrigger>
//           <TabsTrigger value="ledger">Ledger</TabsTrigger>
//         </TabsList>

//         <TabsContent value="inventory">
//           <div className=" inline-flex gap-4    justify-end w-full  p-2">
           
//             <Button onClick={()=>{setOpen(true) ; setEntryForm(p=>({...p,type:'IN' ,reference:"ADD"})) ;  setFormHeader("Add Item")  }} 
//             variant={"outline"} className=""><span>➕</span>Add Stock</Button>
           
//             <Button onClick={()=>{setOpen(true) ;
//               setEntryForm(p=>({...p,adjustment:true  ,reference:"ADJUSTMENT" })) ;               
//               setFormHeader("Adjustment")}} variant={'outline'}><span>⚙️</span>Adjustment</Button>
//           </div>
//           <section className="grid grid-cols-7">         
//             <div className="col-span-5">

//               <table className="w-full table-fixed border border-gray-400">
//                 <thead>
//                   <tr >                  
//                   <th className="border border-gray-400 py-1 w-[35px]">#</th>
//                   <th className="border border-gray-400 py-1 w-1/4">Category</th>
//                   <th className="border border-gray-400 py-1">Purity</th>
//                   <th className="border border-gray-400 py-1">Total IN (g)</th>
//                   <th className="border border-gray-400 py-1">Total OUT (g)</th>
//                   <th className="border border-gray-400 py-1">Borrowed (g)</th>
//                   <th className="border border-gray-400 py-1">Balance</th>
//                 </tr>
//                 </thead>
                
//                 <tbody>
//                   {
//                     inventoryTotal?.map((r:any,i:number)=>(
//                     <tr key={r.category_id+i+"inv"}>
//                        <td className="border border-gray-400 p-1.5 text-center ">{i+1}</td>
//                        <td className="border border-gray-400 p-1.5">{r?.category_name}</td>
//                        <td className="border border-gray-400 p-1.5 text-center">{r?.purity}</td>
//                        <td className="border border-gray-400 p-1.5 text-right">{r?.total_in.toFixed(2)}</td>
//                        <td className="border border-gray-400 p-1.5 text-right">{r?.total_out.toFixed(2)}</td>
//                        <td className="border border-gray-400 p-1.5 text-right">{r?.total_borrowed.toFixed(2)}</td>
//                        <td className="border border-gray-400 p-1.5 text-right font-bold">{r?.balance.toFixed(2)}</td>
                       
//                   </tr>
//                     ))

//                   }
              
//                 </tbody>
//               </table>



//             </div>

//             <div className="col-span-2 bg-blue-200">

//             </div>

//              </section>
//         </TabsContent>

//         <TabsContent value="ledger">
//           <div className="max-w-[1000px]  mx-auto mt-2">

//                <table className="w-full table-fixed border border-gray-400">
//                 <thead>
//                   <tr>                  
//                   <th className="border border-gray-400 py-1 w-[35px]">#</th>
//                   <th className="border border-gray-400 py-1 w-[90px] ">Date</th>
//                   <th className="border border-gray-400 py-1 w-[80px]">Type</th>
//                   <th className="border border-gray-400 py-1 w-[150px]">Category</th>
//                   <th className="border border-gray-400 py-1 w-[70px] text-center">Purity </th>
//                   <th className="border border-gray-400 py-1 w-[90px] ">weight (g)</th>
//                   <th className="border border-gray-400 py-1 w-[120px]">StockType</th>
//                   <th className="border border-gray-400 py-1 w-[130px]">Ref</th>
//                   <th className="border border-gray-400 py-1 w-[110px]">Ref Id</th>
//                 </tr>
//                 </thead>

//                 <tbody>
//                   {  !ledger?.map ? (
//                     <tr className="p-6 ">
//                       <td colSpan={9} className="text-center p-6 text-slate-600">No Data</td>
//                     </tr>
//                    ) : (                    
               
//                     ledger?.map((r:any,i:number)=>(
//                     <tr key={i+"his"}>
//                        <td className="border border-gray-400 p-1.5 text-center ">{i+1}</td>
//                        <td className="border border-gray-400 p-1.5">{new Date(r?.created_at).toLocaleDateString('en-IN')}</td>
//                        <td className={`border border-gray-400 p-1.5 text-center ${r?.type ==='IN' ? 'bg-green-200' :'bg-red-200'}`}>{r?.type}</td>
//                        <td className="border border-gray-400 p-1.5 text-start">{r?.category?.name}</td>
//                        <td className="border border-gray-400 p-1.5 text-center">{r?.purity ==="K22" ?"22k":"18k"}</td>
//                        <td className="border border-gray-400 p-1.5 text-right px-2 font-bold">{(r?.weight).toFixed(2)} </td>
//                        <td className="border border-gray-400 p-1.5 text-center">{r?.stockType}</td>
//                        <td className="border border-gray-400 p-1.5 text-center ">{r?.reference}</td>
//                        <td className="border border-gray-400 p-1.5 text-center ">{r.reference_id ? r.reference_id : ''}</td>
                       
//                   </tr>
//                     ))   )

//                   }
              
//                 </tbody>
//               </table>

//                   <div className="flex gap-7 justify-end p-4">
//                     <Button variant={"outline"}  disabled={leadgerPage ===1} onClick={()=>setLeadgerPage(p=> p>1 ? p-1 :p)} className="">← Prev</Button>
//                     <Button variant={"outline"} disabled={ledger?.length<10 } onClick={()=>setLeadgerPage(p=> p+1)} className="">next →</Button>
                    
//                   </div>
            
//           </div>

//         </TabsContent>

//       </Tabs>


//      {/* Entry -in -out adjustment */}
 

//       <Dialog open={open} onOpenChange={setOpen}>
//           <DialogContent >
//             <DialogHeader className="text-center"><DialogTitle>{formHeader}</DialogTitle></DialogHeader>
//               <div className="  p-3">
//                 <form onSubmit={handleSubmitStock} className="flex flex-col gap-5 px-2">
                
//                 <select  value={entryForm.category} onChange={(e)=>setEntryForm(p=>({...p,category:e.target.value}))}   className="h-8 text-lg border border-blue-300 px-3">
//                 <option value='' >select Category</option>
//                 {
//                 categories?.map((c:any)=>(
//                 <option value={c.id} key={c.id}>{c.name}</option>
//                 ))
//                 }
//                 </select>

//                 <div className="flex gap-5 justify-between">              
//                 <select value={entryForm.purity} className="h-8 text-lg w-1/2 border border-blue-300 px-3" 
//                 onChange={(e)=>setEntryForm(p=>({...p,purity:e.target.value as "K22" | "K18"}))}>
//                   <option value="K22">22K</option>
//                   <option value="K18">18K</option>
//                 </select>
//                 { formHeader ==="Adjustment" && (               
//                 <select value={entryForm.type} className="h-8 text-lg w-1/2 border border-blue-300 px-3" 
//                 onChange={(e)=>setEntryForm(p=>({...p,type:e.target.value as "IN" | "OUT"}))}>
//                   <option value="IN">IN</option>
//                  <option value="OUT">OUT</option>
//                 </select>
//                  )
//                 }
             
//                   </div>

//                 <div className=" flex gap-5">
//                 <input  step="any"  value={entryForm.weight} min={0} placeholder="weight ( g)"
//                  className="h-8 text-lg w-1/2 border border-blue-300 px-3" type="number"
//                   onChange={(e)=>setEntryForm(p=>({...p,weight:Number(e.target.value)}))} />
//                 </div>
//                {error ?<span>{error}</span> : "" } 

//             <div className="flex gap-6 w-full">              
//                 <Button className="w-1/2" variant={'secondary'}>Add</Button>
//                 <Button className="w-1/2" variant={'outline'} onClick={()=>{ setEntryForm(defaultEntry());
//                    setOpen(false)}}    >clear</Button>
//             </div>
//                 </form>
//               </div>
//           </DialogContent>    
//       </Dialog>

     

//     </div>
//   )
// }

// export default page







'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/axios"
import { queryClient } from "@/lib/queryClient"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

interface EntryRows {
  category: string,
  purity: "K22" | "K18",
  weight: string,
  type: "IN" | "OUT",
  adjustment: boolean,
  reference: string
}

const defaultEntry = (): EntryRows => ({
  category: '',
  purity: "K22",
  weight: "",
  type: "IN",
  adjustment: false,
  reference: 'ADD'
})

const page = () => {

  const [open, setOpen] = useState(false)
  const [formHeader, setFormHeader] = useState('Add Item')
  const [entryForm, setEntryForm] = useState<EntryRows>(defaultEntry())
  const [error, setError] = useState('')
  const [leadgerPage, setLeadgerPage] = useState(1)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/jewellery-category').then(r => r.data),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 20,
  });

  const { data: ledger } = useQuery({
    queryKey: ['inventory_ledger', leadgerPage],
    queryFn: () => api.get(`/inventory/inventory-ledger?page=${leadgerPage}`).then(r => r.data),
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  const { data: inventoryTotal } = useQuery({
    queryKey: ['inventoryTotal'],
    queryFn: async () => api.get('/inventory/inventory-total').then(r => r.data),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  })

  // Aggregate summary for the quick-stats panel — derived from existing data, no new API calls
  const summary = useMemo(() => {
    if (!inventoryTotal?.length) return null
    return inventoryTotal.reduce((acc: any, r: any) => ({
      totalIn: acc.totalIn + (r.total_in || 0),
      totalOut: acc.totalOut + (r.total_out || 0),
      totalBorrowed: acc.totalBorrowed + (r.total_borrowed || 0),
      totalBalance: acc.totalBalance + (r.balance || 0),
    }), { totalIn: 0, totalOut: 0, totalBorrowed: 0, totalBalance: 0 })
  }, [inventoryTotal])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => api.post('/inventory/in', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inventory_ledger'] })
      queryClient.invalidateQueries({ queryKey: ['inventoryTotal'] })
      setEntryForm(defaultEntry())
      setOpen(false)
    },
    onError: (err: any) => {
      console.log(err.response?.data)
      setError(err.response?.data?.message || "Something went wrong")
    }
  })

  const handleSubmitStock = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!entryForm.category || !entryForm.purity || !entryForm.weight) return setError("Fill all Fields")
    mutate({
      category_id: entryForm.category,
      purity: entryForm.purity,
      weight: Number(entryForm.weight),
      type: entryForm.type,
      reference: entryForm.reference
    })
  }

  
    return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-4 md:px-8">
      <div className="max-w-[1300px] mx-auto">

        <div className="mb-4">
          <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500">Track stock, adjustments, and movement history</p>
        </div>

        <Tabs defaultValue="inventory">
          <div className="flex items-center justify-between mb-3">
            <TabsList>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="ledger">Ledger</TabsTrigger>
            </TabsList>

            <div className="flex gap-3">
              <Button
                onClick={() => { setOpen(true); setEntryForm(p => ({ ...p, type: 'IN', reference: "ADD" })); setFormHeader("Add Item") }}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <span>➕</span>Add Stock
              </Button>

              <Button
                onClick={() => { setOpen(true); setEntryForm(p => ({ ...p, adjustment: true, reference: "ADJUSTMENT" })); setFormHeader("Adjustment") }}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <span>⚙️</span>Adjustment
              </Button>
            </div>
          </div>

          <TabsContent value="inventory">
            <section className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              <div className="lg:col-span-5">
                <Card className="overflow-hidden border-slate-200 p-0">
                  <table className="w-full table-fixed text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="py-2.5 px-2 w-[40px] font-medium text-left">#</th>
                        <th className="py-2.5 px-2 w-1/4 font-medium text-left">Category</th>
                        <th className="py-2.5 px-2 font-medium text-center">Purity</th>
                        <th className="py-2.5 px-2 font-medium text-right">Total IN (g)</th>
                        <th className="py-2.5 px-2 font-medium text-right">Total OUT (g)</th>
                        <th className="py-2.5 px-2 font-medium text-right">Borrowed (g)</th>
                        <th className="py-2.5 px-2 font-medium text-right pr-4">Balance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {!inventoryTotal?.length ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400">No inventory data</td>
                        </tr>
                      ) : (
                        inventoryTotal.map((r: any, i: number) => (
                          <tr
                            key={r.category_id + i + "inv"}
                            className={`border-t border-slate-100 ${i % 2 ? 'bg-slate-50/50' : 'bg-white'} hover:bg-blue-50/50 transition-colors`}
                          >
                            <td className="py-2 px-2 text-slate-400">{i + 1}</td>
                            <td className="py-2 px-2 font-medium text-slate-800">{r?.category_name}</td>
                            <td className="py-2 px-2 text-center">
                              <Badge variant="secondary" className="font-normal">
                                {r?.purity === "K22" ? "22K" : "18K"}
                              </Badge>
                            </td>
                            <td className="py-2 px-2 text-right text-emerald-700">{r?.total_in.toFixed(2)}</td>
                            <td className="py-2 px-2 text-right text-rose-700">{r?.total_out.toFixed(2)}</td>
                            <td className="py-2 px-2 text-right text-amber-700">{r?.total_borrowed.toFixed(2)}</td>
                            <td className="py-2 px-2 text-right font-bold text-slate-900 pr-4">{r?.balance.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </Card>
              </div>

              <div className="lg:col-span-2">
              <Card className="border-slate-200 p-3 h-full">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Overall Summary</h3>
                  {summary ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5">
                        <span className="text-sm text-slate-600">Total IN</span>
                        <span className="font-semibold text-emerald-700">{summary.totalIn.toFixed(2)} g</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2.5">
                        <span className="text-sm text-slate-600">Total OUT</span>
                        <span className="font-semibold text-rose-700">{summary.totalOut.toFixed(2)} g</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2.5">
                        <span className="text-sm text-slate-600">Borrowed</span>
                        <span className="font-semibold text-amber-700">{summary.totalBorrowed.toFixed(2)} g</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-3 mt-1">
                        <span className="text-sm text-slate-200">Net Balance</span>
                        <span className="font-bold text-white text-base">{summary.totalBalance.toFixed(2)} g</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No data yet</p>
                  )}
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="ledger">
            <div className="max-w-[1100px] mx-auto">
              <Card className="overflow-hidden border-slate-200 p-0">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="py-2.5 px-2 w-[35px] font-medium text-left">#</th>
                      <th className="py-2.5 px-2 w-[90px] font-medium text-left">Date</th>
                      <th className="py-2.5 px-2 w-[80px] font-medium text-center">Type</th>
                      <th className="py-2.5 px-2 w-[150px] font-medium text-left">Category</th>
                      <th className="py-2.5 px-2 w-[70px] font-medium text-center">Purity</th>
                      <th className="py-2.5 px-2 w-[90px] font-medium text-right">Weight (g)</th>
                      <th className="py-2.5 px-2 w-[120px] font-medium text-center">Stock Type</th>
                      <th className="py-2.5 px-2 w-[130px] font-medium text-center">Ref</th>
                      <th className="py-2.5 px-2 w-[110px] font-medium text-center">Ref Id</th>
                    </tr>
                  </thead>

                  <tbody>
                    {!ledger?.map ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-400">No Data</td>
                      </tr>
                    ) : (
                      ledger.map((r: any, i: number) => (
                        <tr key={i + "his"} className={`border-t border-slate-100 ${i % 2 ? 'bg-slate-50/50' : 'bg-white'} hover:bg-blue-50/50 transition-colors`}>
                          <td className="py-2 px-2 text-slate-400">{i + 1}</td>
                          <td className="py-2 px-2 text-slate-600">{new Date(r?.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="py-2 px-2 text-center">
                            <Badge className={r?.type === 'IN' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                              {r?.type}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 font-medium text-slate-800">{r?.category?.name}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{r?.purity === "K22" ? "22k" : "18k"}</td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900">{(r?.weight).toFixed(2)}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{r?.stockType}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{r?.reference}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{r.reference_id ? r.reference_id : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>

              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-slate-500">Page {leadgerPage}</span>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" disabled={leadgerPage === 1} onClick={() => setLeadgerPage(p => p > 1 ? p - 1 : p)}>
                    ← Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={ledger?.length < 10} onClick={() => setLeadgerPage(p => p + 1)}>
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>{formHeader}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitStock} className="flex flex-col gap-4 pt-2">

              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <select
                  value={entryForm.category}
                  onChange={(e) => setEntryForm(p => ({ ...p, category: e.target.value }))}
                  className="h-9 text-sm border border-slate-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value=''>Select category</option>
                  {categories?.map((c: any) => (
                    <option value={c.id} key={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 w-1/2">
                  <Label>Purity</Label>
                  <select
                    value={entryForm.purity}
                    className="h-9 text-sm border border-slate-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    onChange={(e) => setEntryForm(p => ({ ...p, purity: e.target.value as "K22" | "K18" }))}
                  >
                    <option value="K22">22K</option>
                    <option value="K18">18K</option>
                  </select>
                </div>

                {formHeader === "Adjustment" && (
                  <div className="flex flex-col gap-1.5 w-1/2">
                    <Label>Type</Label>
                    <select
                      value={entryForm.type}
                      className="h-9 text-sm border border-slate-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      onChange={(e) => setEntryForm(p => ({ ...p, type: e.target.value as "IN" | "OUT" }))}
                    >
                      <option value="IN">IN</option>
                      <option value="OUT">OUT</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Weight (g)</Label>
                <input
                  step="any"
                  value={entryForm.weight}
                  min={0}
                  placeholder="0.00"
                  className="h-9 text-sm border border-slate-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  type="number"
                  onChange={(e) => setEntryForm(p => ({ ...p, weight: e.target.value }))}
                />
              </div>

              {error ? <span className="text-sm text-rose-600">{error}</span> : null}

              <div className="flex gap-3 w-full pt-1">
                <Button type="submit" className="w-1/2" disabled={isPending}>
                  {isPending ? "Saving..." : "Add"}
                </Button>
                <Button
                  type="button"
                  className="w-1/2"
                  variant="outline"
                  onClick={() => { setEntryForm(defaultEntry()); setOpen(false) }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}

export default page
