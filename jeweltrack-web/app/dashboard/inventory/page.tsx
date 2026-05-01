'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/axios"
import { queryClient } from "@/lib/queryClient"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"

interface EntryRows  {
  category:string ,
  purity : "K22" | "K18",
  weight:string ,
  type:"IN"|"OUT",
  adjustment:boolean,
  // stockType:"OWN" |"BORROW",
  reference : string

}

const defaultEntry =  ():EntryRows =>({      
  category:'' ,
  purity : "K22" ,
  weight: "",
  type:"IN",
  adjustment:false,
  // stockType:"OWN" ,
  reference : 'MANUAL'
})

const page = () => {

  const [open,setOpen] = useState(false)
  const [formHeader,setFormHeader]= useState('Add Item')
  const [entryForm,setEntryForm] = useState<EntryRows>(defaultEntry())
  const [error,setError] = useState('')

  const {data:categories} = useQuery({
    queryKey :['categories'],
    queryFn :()=>api.get('/jewellery-category').then(r=>r.data)
  });

  const {data:ledger} = useQuery({
    queryKey :['inventory_ledger'],
    queryFn :()=>api.get('/inventory/inventory-ledger').then(r=>r.data)
  });

  const {mutate,isSuccess} = useMutation({
      mutationFn:(data:any)=>api.post('/inventory/in',data),
        onSuccess:(res)=>{
          queryClient.invalidateQueries({ queryKey: ['inventory_ledger'] })
          setEntryForm(defaultEntry())
          setOpen(false)
        } ,
        onError: (err:any) => {
          console.log(err.response?.data)
        }
  })


  const handleSubmitStock = (e)=>{
    e.preventDefault()
    setError('')
    if(!entryForm.category || !entryForm.purity || !entryForm.weight  )return setError("Fill all Fields")
    mutate({
            category_id:entryForm.category ,
            purity : entryForm.purity ,
            weight:Number(entryForm.weight) ,
            type:entryForm.type,
            reference : entryForm.reference
                })
  } 



  return (
    <div className="w-full min-h-screen">
      <Tabs defaultValue="inventory">
        <TabsList className="">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <div className=" inline-flex gap-4    justify-end w-full  p-2">
           
            <Button onClick={()=>{setOpen(true) ; setEntryForm(p=>({...p,type:'IN' ,reference:"MANUAL"})) ;  setFormHeader("Add Item")  }} 
            variant={"outline"} className=""><span>➕</span>Add Stock</Button>
           
            <Button onClick={()=>{setOpen(true) ;
              setEntryForm(p=>({...p,adjustment:true  ,reference:"ADJUSTMENT" })) ;               
              setFormHeader("Adjustment")}} variant={'outline'}><span>⚙️</span>Adjustment</Button>
          </div>
          <section className="grid grid-cols-7">         
            <div className="col-span-4">

              <table className="w-full table-fixed border border-gray-400">
                <thead>
                  <tr >                  
                  <th className="border border-gray-400 py-1 w-[35px]">#</th>
                  <th className="border border-gray-400 py-1 w-1/4">Category</th>
                  <th className="border border-gray-400 py-1">Purity</th>
                  <th className="border border-gray-400 py-1">Total IN (g)</th>
                  <th className="border border-gray-400 py-1">Total OUT (g)</th>
                  <th className="border border-gray-400 py-1">Borrowed (g)</th>
                  <th className="border border-gray-400 py-1">Balance</th>
                </tr>
                </thead>
                <tbody>
                  {
                    [1,2,3,4].map((r,i)=>(
                    <tr key={i+"inv"}>
                       <td className="border border-gray-400 p-1.5 text-center ">{i+1}</td>
                       <td className="border border-gray-400 p-1.5">Ring</td>
                       <td className="border border-gray-400 p-1.5 text-center">22K</td>
                       <td className="border border-gray-400 p-1.5 text-right">34</td>
                       <td className="border border-gray-400 p-1.5 text-right">12</td>
                       <td className="border border-gray-400 p-1.5 text-right">2</td>
                       <td className="border border-gray-400 p-1.5 text-right font-bold">20</td>
                       
                  </tr>
                    ))

                  }
              
                </tbody>
              </table>



            </div>

            <div className="col-span-3 bg-blue-200">

            </div>

             </section>
        </TabsContent>

        <TabsContent value="ledger">
          <div className="max-w-[900px] mx-auto mt-2">

               <table className="w-full table-fixed border border-gray-400">
                <thead>
                  <tr>                  
                  <th className="border border-gray-400 py-1 w-[35px]">#</th>
                  <th className="border border-gray-400 py-1 ">Date</th>
                  <th className="border border-gray-400 py-1">Type</th>
                  <th className="border border-gray-400 py-1 w-1/4">Category</th>
                  <th className="border border-gray-400 py-1">Purity </th>
                  <th className="border border-gray-400 py-1">weight</th>
                  <th className="border border-gray-400 py-1">StockType</th>
                  <th className="border border-gray-400 py-1">Ref</th>
                  <th className="border border-gray-400 py-1">Ref Id</th>
                </tr>
                </thead>

                <tbody>
                  {
                    ledger?.map((r,i)=>(
                    <tr key={i+"his"}>
                       <td className="border border-gray-400 p-1.5 text-center ">{i+1}</td>
                       <td className="border border-gray-400 p-1.5">{new Date(r?.created_at).toLocaleDateString('en-IN')}</td>
                       <td className="border border-gray-400 p-1.5 text-center">{r?.type}</td>
                       <td className="border border-gray-400 p-1.5 text-start">{r?.category?.name}</td>
                       <td className="border border-gray-400 p-1.5 text-right">{r?.purity}</td>
                       <td className="border border-gray-400 p-1.5 text-right">{r?.weight} g</td>
                       <td className="border border-gray-400 p-1.5 text-center">{r?.stockType}</td>
                       <td className="border border-gray-400 p-1.5 text-center ">{r?.reference}</td>
                       <td className="border border-gray-400 p-1.5 text-center ">{r.reference_id ? r.reference_id : ''}</td>
                       
                  </tr>
                    ))

                  }
              
                </tbody>
              </table>

            
          </div>

        </TabsContent>

      </Tabs>


     {/* Entry -in -out adjustment */}
 

      <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent >
            <DialogHeader className="text-center"><DialogTitle>{formHeader}</DialogTitle></DialogHeader>
              <div className="  p-3">
                <form onSubmit={handleSubmitStock} className="flex flex-col gap-5 px-2">
                
                <select  value={entryForm.category} onChange={(e)=>setEntryForm(p=>({...p,category:e.target.value}))}   className="h-8 text-lg border border-blue-300 px-3">
                <option value='' >select Category</option>
                {
                categories?.map((c:any)=>(
                <option value={c.id} key={c.id}>{c.name}</option>
                ))
                }
                </select>

                <div className="flex gap-5 justify-between">              
                <select value={entryForm.purity} className="h-8 text-lg w-1/2 border border-blue-300 px-3" 
                onChange={(e)=>setEntryForm(p=>({...p,purity:e.target.value as "K22" | "K18"}))}>
                  <option value="K22">22K</option>
                  <option value="K18">18K</option>
                </select>
                { formHeader ==="Adjustment" && (               
                <select value={entryForm.type} className="h-8 text-lg w-1/2 border border-blue-300 px-3" 
                onChange={(e)=>setEntryForm(p=>({...p,type:e.target.value as "IN" | "OUT"}))}>
                  <option value="IN">IN</option>
                 <option value="OUT">OUT</option>
                </select>
                 )
                }
             
                  </div>

                <div className=" flex gap-5">
                <input  step="any"  value={entryForm.weight} min={0} placeholder="weight ( g)"
                 className="h-8 text-lg w-1/2 border border-blue-300 px-3" type="number"
                  onChange={(e)=>setEntryForm(p=>({...p,weight:Number(e.target.value)}))} />
                </div>
               {error ?<span>{error}</span> : "" } 

            <div className="flex gap-6 w-full">              
                <Button className="w-1/2" variant={'secondary'}>Add</Button>
                <Button className="w-1/2" variant={'outline'} onClick={()=>{ useState(defaultEntry());
                   setOpen(false)}}    >clear</Button>
            </div>
                </form>
              </div>
          </DialogContent>    
      </Dialog>

     

    </div>
  )
}

export default page
