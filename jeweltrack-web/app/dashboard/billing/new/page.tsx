'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebouce";
import { Span } from "next/dist/trace";



interface BillItem {
  item_name: string;
  metal: 'GOLD' | 'SILVER';
  purity: 'K22' | 'K18' | 'K24';
  rate: number;
  weight: number;
  wastage_pct: number;
  wastage_weight: number;
  making_charge: number;
  amount: number;
  stone:number;
}

const calcAmount = (item:BillItem):number=>{
 return Math.max(Math.round(item.rate * (item.weight + item.wastage_weight)+item.making_charge),0)
}

const defaultItem = (rate22k =0):BillItem=>({
  amount:0,rate:rate22k , wastage_pct:0,wastage_weight:0, weight:0,
  item_name:'',making_charge:0,metal:'GOLD',purity:"K22",stone:0
})


const NewBillPage = () => {

  const queryclient = useQueryClient();
  const [items,setItems] = useState<BillItem[]>([])
  const [customerSearch,setCustomerSearch] = useState('');
  const [isGst , setIsGst] = useState(false);
  const [discount,setDiscount] = useState(0);
  const [success,setSuccess] = useState('')
  const [selectedCustomer , setSelectedCustomer] = useState<any>(null) ;
  const [error,setError] = useState('');
  const [notes,setNotes] = useState('');
  const [highlightIndex ,setHighlightIndex] = useState(0); 
  const firstItemRef = useRef<HTMLInputElement>(null)


  const {data :rate} = useQuery({
    queryKey:['recent-rate'],
    queryFn:()=>api.get('rate/recent-rate').then(r=>r.data)
  });

  const {data:categories} = useQuery({
    queryKey :['categories'],
    queryFn :()=>api.get('/jewellery-category').then(r=>r.data)
  });


const debouncedSearch = useDebounce(customerSearch.trim() , 300)
  const {data:customers} = useQuery({
    queryKey:['customer',debouncedSearch],
    queryFn:()=>debouncedSearch.length>1
          ? api.get(`customer/search?q=${debouncedSearch}`).then(r=>r.data)
          :[],
      enabled:debouncedSearch.length>1 ,
    })

    const { mutate , isPending} = useMutation({
      mutationFn : (data:any)=> api.post('/bill' ,data),
      onSuccess :(res)=>{
        queryclient.invalidateQueries({queryKey:['bills']});
        setSuccess(`Bill ${res.data.bill_number} created successfully!`);
        setItems([]);
        setSelectedCustomer(null);
        setDiscount(0);
        setNotes('');
        setIsGst(false);        
      },
      onError : (e:any)=>{
        setError(e?.response?.data?.message || 'Something went wrong')
      }
    })

    const updateItem = (index:number ,field: keyof BillItem , value :any)=>{
        const updated = [...items] ;
        const item = { ...updated[index] , [field]:value }

        if(field === 'purity'){
          item.rate = value ==='K22' ? (rate?.rate_22k  ?? 0) 
                  : value === 'K18' ? ( rate?.rate_18k ?? 0)
                  :(rate?.rate_999 ?? 0)
        }

        if(field ==='metal'){
          item.rate = value ==='SILVER' ? (rate?.rate_silver ?? 0 ) : (rate?.rate_22k ?? 0);
          item.purity = "K22" ;
        }

        if (field === 'wastage_pct') {
      item.wastage_weight = item.weight > 0
        ? parseFloat(((value / 100) * item.weight).toFixed(3)) : 0;
    }
    if (field === 'wastage_weight') {
      item.wastage_pct = item.weight > 0
        ? parseFloat(((value / item.weight) * 100).toFixed(2)) : 0;
    }

        if(field === 'weight' && item.wastage_pct>0){
          item.wastage_weight = parseFloat(((item.wastage_pct /100 )* value).toFixed(3))
        }

        item.amount = calcAmount(item);
        updated[index] = item ; 
        setItems(updated)
        }

    const selectCategory = (index:number , catId:string)=>{
      const cat = categories?.find((c:any)=>c.id===catId)
      if(!cat) return;
      const updated = [...items];
      const item = {...updated[index]}
      item.item_name = cat.name;
      item.wastage_pct = cat.default_wastage ??0 ;
      item.wastage_weight =  item.wastage_pct >0 
            ? parseFloat( (item.weight * item.wastage_pct /100).toFixed(2)) : 0 ;
      item.making_charge = cat.default_making_charge  ?? 0 ;
      item.amount = calcAmount(item)
      updated[index] = item;
      setItems(updated)

    }

    const addItem = ()=>{
      setItems([...items , defaultItem(rate?.rate22k ?? 0)])
    }

    useEffect(()=>{
      addItem()
    },[])

    const removeItem = (index:number)=>{
      setItems(items.filter((_,i)=>i !==index))
    }

    const total = Math.max(
      items.reduce((sum,i)=>sum+i.amount ,0)-discount , 0
    )

    const handleSubmit = ()=>{
      setError('');
      if(!selectedCustomer) {setError('Please select a customer ') ; return}
      if(items.length===0) { setError('Add at leaset on eitem'); return}

mutate({
      customer_id: selectedCustomer.id,
      is_gst_bill: isGst,
      discount,
      notes,
      billItem: items.map(item => ({
        item_name: item.item_name,
        metal: item.metal,
        purity: item.metal === 'GOLD' ? item.purity : undefined,
        rate: item.rate,
        weight: item.weight,
        wastage: item.wastage_weight,
        making_charge: item.making_charge,
        amount: item.amount,
      })),
    });

    }

    

  // return (
  //   <div className="flex flex-col gap-5 max-w-4xl">
      
  //     <div className="flex items-center justify-between">
  //       <div>
  //         <h1 className="text-xl font-medium text-foreground">New Bill</h1>        
  //       </div>
  //         <a href="dashboard/billing/history"
  //         className="text-xs text-gold border border-gold/30 p-3 py-1.5 rounded-lg hover:bg-gold-light transition-colors"
  //         >Vew bill history</a>
  //     </div>

  //     {success && (
  //       <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
  //         {success}
  //       </div>
  //     )}

  //     {/* {customer} */}
  //     <div className="bg-white border border-gold rounded-xl p-5">
  //       <h2 className="text-sm font-medium text-foreground mb-4">
  //         Customer
  //       </h2>

  //       {selectedCustomer ? (
  //         <div className="flex items-center justify-between bg-gold-light border border-gold rounded-lg px-4 py-3">
  //           <div>
  //             <span className="text-sm font-medium text-foreground">{selectedCustomer.name}</span>
  //             <span className="text-xs text-muted-foreground ml-2 ">{selectedCustomer.phone} · {selectedCustomer.village}</span>
  //           </div>
  //           <button onClick={()=>setSelectedCustomer(null)}
  //           className="text-xs text-muted-foreground hover:text-destructive" > 
  //             Change 
  //           </button>
  //         </div>
  //       ) : (
  //         <div className="relative">
  //           <Input 
  //           placeholder="Search by phone or name..."
  //           value={customerSearch}
  //           onChange={(e)=>setCustomerSearch(e.target.value)} 
  //           />
  //           {
  //             customers?.map((c:any)=>(
  //               <div key={c.id} 
  //               onClick={()=>{setSelectedCustomer(c); setCustomerSearch('');}}
  //               className="px-4 py-2.5 hover:bg-gold-light cursor-pointer text-sm border-b border-gold/30 last:border-0"
  //               >
  //                 <span className="font-medium">{c.name}</span>
  //                 <span className="text-muted-foreground ml-2 text-xs">{c.phone} . {c.village}</span>
  //               </div>
  //             ))
  //           }
  //         </div>
  //       )}

  //     </div>

  //     {/* Items */}
  //     <div className="flex flex-col gap-3">
  //       {items.map((item,i)=>(
  //         <div key={i} className="bg-white border border-gold rounded-xl p-5">
  //           <div className="flex items-center justify-between mb-4">
  //             <span className="text-xs font-medium text-gold-light px-2 py-1 rounded-full">
  //               Item {i +1}
  //             </span>
  //             {items.length>1 && (
  //               <button onClick={()=>removeItem(i)}>
  //                 Remove
  //               </button>
  //             )}
  //           </div>

  //           <div className=" grid grid-cols-2 md:grid-cols-3 gap-3 ,b-3">
  //             {
  //               categories?.length>0 && (
  //                 <div className="flex flex-col gap-1">
  //                   <label htmlFor="" className="text-xs text-muted-foreground ">Category</label>
  //                   <select  onChange={(e)=>selectCategory(i,e.target.value)} 
  //                     className="h-9 rounded-lg border border-input px-3 text-sm bg-white"
  //                     >
  //                     <option>Quick fill..</option>
  //                     {categories.map((c:any)=>(
  //                       <option key={c.id} value={c.id}>{c.name}</option>
  //                     ))}
  //                   </select>
  //                 </div>
  //               )}

  //               <div className="flex flex-col gap-1">
  //                 <label >Item name</label>
  //                 <input type="text" placeholder="e.g. Chain" 
  //                   value={item.item_name}
  //                   onChange={(e)=>updateItem(i,'item_name',e.target.value)}
  //                 />
  //               </div>

  //               <div className="flex flex-col gap-1">
  //                 <label className="text-xs text-muted-foreground" htmlFor="">Metal</label>
  //                 <select 
  //                 value={item.metal}
  //                 onChange={(e)=>updateItem(i,'metal',e.target.value)}
  //                 className="h-9 rounded-lg border-input px-3 text-sm bg-white"
  //                 >
  //                   <option value="GOLD">Gold</option>
  //                   <option value="SILVER">Silver</option>
  //                 </select>

  //               </div>
  //           </div>

  //            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
  //             {item.metal === 'GOLD' && (
  //               <div className="flex flex-col gap-1">
  //                 <label className="text-xs text-muted-foreground">Purity</label>
  //                 <select value={item.purity}
  //                   onChange={(e) => updateItem(i, 'purity', e.target.value)}
  //                   className="h-9 rounded-lg border border-input px-3 text-sm bg-white">
  //                   <option value="K22">22K</option>
  //                   <option value="K18">18K</option>
  //                   <option value="K24">24K</option>
  //                 </select>
  //               </div>
  //             )}
  //             <div className="flex flex-col gap-1">
  //               <label className="text-xs text-muted-foreground">Rate (₹/g)</label>
  //               <Input type="number" value={item.rate || ''}
  //                 onChange={(e) => updateItem(i, 'rate', Number(e.target.value))} />
  //             </div>
  //             <div className="flex flex-col gap-1">
  //               <label className="text-xs text-muted-foreground">Weight (g)</label>
  //               <Input type="number" value={item.weight || ''}
  //                 onChange={(e) => updateItem(i, 'weight', Number(e.target.value))} />
  //             </div>
  //             <div className="flex flex-col gap-1">
  //               <label className="text-xs text-muted-foreground">Wastage (g)</label>
  //               <Input type="number" value={item.wastage_weight || ''}
  //                 onChange={(e) => updateItem(i, 'wastage_weight', Number(e.target.value))} />
  //             </div>
  //           </div>

  //                  <div className="grid grid-cols-2 gap-3">
  //             <div className="flex flex-col gap-1">
  //               <label className="text-xs text-muted-foreground">Making charge (₹)</label>
  //               <Input type="number" value={item.making_charge || ''}
  //                 onChange={(e) => updateItem(i, 'making_charge', Number(e.target.value))} />
  //             </div>
  //             <div className="flex items-end">
  //               <div className="w-full bg-gold-light border border-gold rounded-lg px-4 py-2 flex justify-between items-center">
  //                 <span className="text-xs text-muted-foreground">Amount</span>
  //                 <span className="text-base font-medium text-gold">
  //                   ₹{item.amount.toLocaleString('en-IN')}
  //                 </span>
  //               </div>
  //             </div>
  //           </div>


  //         </div>
  //       ))}

  //        <button onClick={addItem}
  //         className="border border-dashed border-gold text-gold px-4 py-2.5 rounded-lg text-sm hover:bg-gold-light transition-colors self-start">
  //         + Add item
  //       </button>

  //     </div>


  //      {/* Bill options + total */}
  //     {items.length > 0 && (
  //       <div className="bg-white border border-gold rounded-xl p-5 flex flex-col gap-4">
  //         <div className="grid grid-cols-2 gap-4">
  //           <div className="flex flex-col gap-1.5">
  //             <Label>Discount (₹)</Label>
  //             <Input type="number" value={discount || ''}
  //               onChange={(e) => setDiscount(Number(e.target.value))}
  //               placeholder="0" />
  //           </div>
  //           <div className="flex flex-col gap-1.5">
  //             <Label>Notes</Label>
  //             <Input placeholder="Optional notes" value={notes}
  //               onChange={(e) => setNotes(e.target.value)} />
  //           </div>
  //         </div>
  //         <div className="flex items-center gap-2">
  //           <input type="checkbox" id="gst" checked={isGst}
  //             onChange={(e) => setIsGst(e.target.checked)}
  //             className="w-4 h-4 accent-gold" />
  //           <label htmlFor="gst" className="text-sm text-foreground cursor-pointer">
  //             GST bill
  //           </label>
  //         </div>
  //         <div className="flex items-center justify-between bg-gold-light border border-gold rounded-lg px-5 py-4">
  //           <span className="text-sm font-medium text-foreground">Total amount</span>
  //           <span className="text-xl font-medium text-gold">
  //             ₹{total.toLocaleString('en-IN')}
  //           </span>
  //         </div>
  //       </div>
  //     )}

  //     {error && (
  //       <p className="text-sm text-destructive bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
  //         {error}
  //       </p>
  //     )}

  //     <Button onClick={handleSubmit} disabled={isPending}
  //       className="bg-gold hover:bg-gold/90 text-white w-full py-3">
  //       {isPending ? 'Creating bill...' : 'Create bill'}
  //     </Button>



     
  //   </div>
  // )


  return (
    <div className=" flex flex-col min-h-screen  ">
      <div className="flex items-center justify-between gap-3 w-full ">
        <div className="">
    
        {
          selectedCustomer ? (
            <div className="flex items-center gap-4 ">
           
            <span className="font-medium ">
            {selectedCustomer.name} - {selectedCustomer.village} - {selectedCustomer.phone}
            </span>           
            <button onClick={()=>setSelectedCustomer(null)} className="text-base text-red-500">Chnage</button>
            </div>
          ) : (
         <div className="relative w-72 ">
          <input 
          placeholder="Search customer..."
          value={customerSearch}
          onChange={(e)=>{setCustomerSearch(e.target.value); setHighlightIndex(0)} }
          onKeyDown={(e)=>{
            if(e.key === "ArrowDown"){
                setHighlightIndex((prev)=> prev <customers.length-1 ? prev+1 :prev)
            }

            if(e.key==="ArrowUp"){
              setHighlightIndex((prev)=>(prev >0 ? prev-1:0))
            }

            if(e.key ==="Enter"){
              const selected = customers?.[highlightIndex];
              if(selected){
                setSelectedCustomer(selected);
                setCustomerSearch('')
                setTimeout(()=>{
                    firstItemRef.current?.focus()
                },100)
              }
            }
          }}  
          className="h-8 text-sm px-2 border border-gold-dark rounded-sm"
          />

          {customerSearch.trim().length >1 && (
        
          <div className="absolute w-full bg-white border mt-1 z-10">
            {
              customers?.length >0 ?(
                  customers?.map((c:any,i:any)=>(
              <div  className={`px-2 py-1 text-sm cursor-pointer ${i===highlightIndex ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                key={c.id}
                onClick={()=>{
                  setSelectedCustomer(c);
                  setCustomerSearch('');
                }}
              >
                {c.name} - {c.phone} - {c.village} 
              </div>
            ))
              ) : (
               <div className="px-2 py-1 text-xs text-gray-500">
          No customer found
        </div>
              )  }
          </div>

           )}
           </div>
          )
        }

              
        </div>
    
       <div className="px-2 py-1 text-sm text-blue-600 cursor-pointer hover:bg-gray-100">
        + Add New Customer
       </div>

      </div>

      <div className="flex-1 bg-white border rounded-md overflow-hidden ">
        <table className="w-full ">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-2">NO </th>
              <th>Item</th>
              <th>Metal</th>
              <th>Purity</th>
              <th>Rate/g</th>
              <th>GR.WT</th>
              <th>Net.Wt</th>
              <th>WST%</th>
              <th>WST(G)</th>
              <th>MC</th>
              <th>Stone</th>
              <th>AMOUNT</th>
              <th>Act</th>
               </tr>
          </thead>
          <tbody>
            {
              items.map((item,i)=>(
                <tr key={i} className="border-t ">
                  <td>{i+1}</td>
                  <td>
                    <select 
                    value={item?.item_name}
                    onChange={(e)=>updateItem(i,'item_name',e.target.value)}
                    >
                      {categories?.map((cat:any,i:number)=>(
                        <option key={i+cat?.name}>{cat?.name}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <select value={item?.metal} 
                    onChange={(e)=>updateItem(i,'metal',e.target.value)}
                    className="h-7 "
                    >
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">silver</option>
                    </select>
                  </td>

                  <td>
                    {item.metal ==="GOLD" ? (
                    <select 
                      value={item.purity}
                      onChange={(e)=>updateItem(i,'purity',e.target.value)}
                      className="h-7 "
                    >
                      <option value="K22">22K</option>
                      <option value="K18">18K</option>
                      {/* <option value="K24"></option> */}
                    </select>
                    ):(<span>none</span>)}      
                  </td>

                  <td>
                    <input type="number" value={item.rate || ""}
                    onChange={(e)=>updateItem(i,'rate',Number(e.target.value))}
                    className="h-7  w-20"
                    />
                  </td>

                  <td>
                    <input type="number" value={item.weight || ''} 
                    onChange={(e)=>updateItem(i,'weight',Number(e.target.value))}
                    className="h-7 w-16"
                    />
                  </td>
                  <td>
                    <input type="number" value={item.weight || ''} 
                    onChange={(e)=>updateItem(i,'weight',Number(e.target.value))}
                    className="h-7 w-16"
                    />
                  </td>

                  <td>
                    <input type="number" 
                    value={item.wastage_weight}
                    onChange={(e)=>updateItem(i,'wastage_weight',Number(e.target.value))}
                    className="w-16 h-7"
                    />
                  </td>

                  <td>
                    <input type="number" value={item.wastage_pct}
                    onChange={(e)=>updateItem(i,'wastage_pct',Number(e.target.value))}
                    className="w-16 h-7"
                    />
                  </td>

                  <td>
                    <input type="number" vlaue={item.making_charge ||'  '} 
                    onChange={(e)=>updateItem(i,'making_charge',Number(e.target.value))}
                    className="w-16 h-7"
                    />   
                  </td>

                    <td>
                      <input type="number" value={item.stone || 0}
                      onChange={(e)=>updateItem(i,'stone',Number(e.target.value))}
                      className="w-16 h-7"
                      />
                    </td>

                    <td className="text-right pr-2 font-medium">
                       ₹{item.amount}
                    </td>

                    <td>
                      <button onClick={()=>removeItem(i)} className="text-red-500 ">
                        ✕
                      </button>
                    </td>

                </tr>
              ))
            }
          </tbody>

        </table>
      </div>
    </div>
  )

}

export default NewBillPage






