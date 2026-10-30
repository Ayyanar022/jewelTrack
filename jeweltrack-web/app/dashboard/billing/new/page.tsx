// 'use client'


// import api from "@/lib/axios";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { useEffect, useRef, useState } from "react";
// import { useDebounce } from "@/hooks/useDebouce";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import BillHistory from "@/components/app_component/BillHistory";
// import { Edit2, Indent, MapPin, Phone, Plus, Search, User, X } from "lucide-react";



// interface BillItem {
//   item_name: string;
//   metal: 'GOLD' | 'SILVER';
//   purity: 'K22' | 'K18' | 'K24';
//   rate: number;
//   gross_weight: number;
//   stone:number;
//   net_weight: number;
//   wastage_pct: number;
//   wastage_weight: number;
//   making_charge: number;
//   amount: number;
//   // category_id:number;
// }

// interface OldJewelItem{
//    item_name : string;
//     purity : string;
//     weight :number;
//     rate  : number;
//     amount :number;
// }

// const calcAmount = (item:BillItem):number=>{
//  return Math.max(Math.round(item.rate * (item.net_weight + item.wastage_weight)+item.making_charge),0)
// }

// const defaultItem = (rate22k =0):BillItem=>({
//   amount:0,rate:rate22k , wastage_pct:0,wastage_weight:0, net_weight:0,gross_weight:0,
//   item_name:'',making_charge:0,metal:'GOLD',purity:"K22",stone:0
// })


// const NewBillPage = () => {

//   const queryclient = useQueryClient();
//   const [items,setItems] = useState<BillItem[]>([defaultItem()])
//   const [oldJewelItem,setOldJewelItem] = useState<OldJewelItem[]>([{   
//     item_name: 'GOLD',
//     purity : '',
//     weight :0,
//     rate  : 0,
//     amount :0
//   }])
//   const [customerSearch,setCustomerSearch] = useState('');
//   const [isGst , setIsGst] = useState(true);
//   const [discount,setDiscount] = useState(0);
//   const [success,setSuccess] = useState('')
//   const [selectedCustomer , setSelectedCustomer] = useState<any>(null) ;
//   const [error,setError] = useState('');
//   const [notes,setNotes] = useState('');
//   const [highlightIndex ,setHighlightIndex] = useState(0); 
//   const firstItemRef = useRef<HTMLInputElement>(null)
//   const customerRef = useRef<HTMLInputElement>(null);
//   const [paid_amount,setPaidAmount] = useState('')




//   const {data :rate} = useQuery({
//     queryKey:['recent-rate'],
//     queryFn:()=>api.get('rate/recent-rate').then(r=>r.data)
//   });

//   const {data:categories} = useQuery({
//     queryKey :['categories'],
//     queryFn :()=>api.get('/jewellery-category').then(r=>r.data)
//   });


//   useEffect(()=>{
//     if(!rate) return

//     setItems((prev)=>
//     prev.map((item)=>({
//       ...item,
//       rate: rate.rate_22k ?? 0
                
//     }))
//     )
//   },[rate])


// const debouncedSearch = useDebounce(customerSearch.trim() , 300)

//   const {data:customers} = useQuery({
//     queryKey:['customer',debouncedSearch],
//     queryFn:()=>debouncedSearch.length>1
//           ? api.get(`customer/search?q=${debouncedSearch}`).then(r=>r.data)
//           :[],
//       enabled:debouncedSearch.length>1 ,
//     })

//     const { mutate , isPending} = useMutation({
//       mutationFn : (data:any)=> api.post('/bill' ,data),
//       onSuccess :(res)=>{
//         // to print bill
//         window.open(`/print/${res.data.id}`, '_blank')

//         queryclient.invalidateQueries({queryKey:['bills']});
//         queryclient.invalidateQueries({queryKey:['inventory_ledger']});
//         queryclient.invalidateQueries({queryKey:['customer-stats',]})
//         queryclient.invalidateQueries({queryKey:['CustomerBill',]})
//         setSuccess(`Bill ${res.data.bill_number} created successfully!`);

//         setItems([defaultItem(rate?.rate_22k ?? 0)])
//         setOldJewelItem([{    item_name: 'GOLD',
//                         purity : '',
//                         weight :0,
//                         rate  : 0,
//                         amount :0}])
//           setPaidAmount('')
//         // addItem()   
//         setSelectedCustomer(null);
//         setDiscount(0);
//         setNotes('');
//         setIsGst(true);   

//       },
//       onError : (e:any)=>{
//         setError(e?.response?.data?.message || 'Something went wrong')
//       }
//     })

//     const updateItem = (index:number ,field: keyof BillItem , value :any)=>{
//         const updated = [...items] ;
//         const item = { ...updated[index] , [field]:value }

//         if(field === 'purity'){
//           item.rate = value ==='K22' ? (rate?.rate_22k  ?? 0) 
//                   : value === 'K18' ? ( rate?.rate_18k ?? 0)
//                   :(rate?.rate_999 ?? 0)
//         }

//         if(field ==='metal'){
//           item.rate = value ==='SILVER' ? (rate?.rate_silver ?? 0 ) : (rate?.rate_22k ?? 0);
//           item.purity = "K22" ;
//         }

//         if(field === 'gross_weight' || field === 'stone'){
//           item.net_weight = Math.max(item.gross_weight-item.stone, 0)
//         }

//         if (field === 'wastage_pct') {
//         item.wastage_weight = item.net_weight > 0
//         ? parseFloat(((item.wastage_pct / 100) * item.net_weight).toFixed(3)) : 0;
//         }

//         if (field === 'wastage_weight') {
//           item.wastage_pct = item.net_weight > 0
//             ? parseFloat(((item.wastage_weight / item.net_weight) * 100).toFixed(2)) : 0;
//         }

//         if(field === 'net_weight' && item.wastage_pct>0){          
//           item.wastage_weight = parseFloat(((item.wastage_pct /100 )* value).toFixed(3))
//         }    

//         // if net weight changes 
//         if(field === "gross_weight" || field==='stone'){
//           if(item.wastage_pct>0){
//             item.wastage_weight= parseFloat(
//               ((item.wastage_pct /100) * item.net_weight).toFixed(3)
//             )
//           }
//         }

//         item.amount = calcAmount(item);
//         updated[index] = item ; 
//         setItems(updated)

//         // Auto add row 
//         if(field ==='making_charge' && index === items.length-1){
//           addItem()
//         }
//         }

//     const selectCategory = (index:number , catId:string)=>{
//       console.log(catId)
//       const cat = categories?.find((c:any)=>c.id===catId)
//       if(!cat) return;
//       const updated = [...items];
//       const item = {...updated[index]}
//       item.item_name = cat.name;
//       item.category_id = cat.id;
//       item.wastage_pct = cat.default_wastage ??0 ;
//       item.wastage_weight =  item.wastage_pct >0 
//             ? parseFloat( (item.net_weight * item.wastage_pct /100).toFixed(2)) : 0 ;
//       item.making_charge = cat.default_making_charge  ?? 0 ;
//       item.amount = calcAmount(item)
//       updated[index] = item;
//       setItems(updated)

//     }


//     const addItem = ()=>{
//       const newItem = defaultItem(rate?.rate_22k ?? 0)
//       setItems(prev => [...prev , newItem])
//     }

  

//     const removeItem = (index:number)=>{
//       setItems(items.filter((_,i)=>i !==index))
//     }

//     const total = Math.max(
//       items.reduce((sum,i)=>sum+i.amount ,0) , 0
//     )

//     const discountedTotal = Math.max((total - discount) ,0 )
//     const gstAmount = Math.max(discountedTotal *(3/100),0)  
//     const payableAmount = discountedTotal + gstAmount

//     const handleSubmit = ()=>{
//       setError('');
//       if(!selectedCustomer) {setError('Please select a customer ') ; return}
//       if(items.length===0) { setError('Add at leaset on eitem'); return}
//       console.log("items",items)

//       mutate({
//       customer_id: selectedCustomer.id,
//       is_gst_bill: isGst,
//       discount,
//       notes,
//       totalAmount :total, // before discount 
//       totalGST :gstAmount , // after discount 
//       payableAmount,   // after discount + gst 
//       paid_amount ,  // actually paid amount
//       billItem: items.filter(i=>i.amount>0).map(item => (
//         {
//         category_id: item.category_id,
//         //  item_name: item.item_name,
//         metal: item.metal,
//         purity: item.metal === 'GOLD' ? item.purity : undefined,
//         rate: item.rate,
//         gross_weight : item.gross_weight,
//         net_weight: item.net_weight,
//         wastage: item.wastage_weight,
//         stone:item.stone,
//         making_charge: item.making_charge,
//         amount: item.amount,

//       })),
//       oldJewelItem : oldJewelItem?.filter((item)=>item.amount>0 ).map((item)=>({
//               item_name: item.item_name,
//               purity : item.purity,
//               weight :Number(item.weight),
//               rate  : Number(item.rate),
//               amount :Number(item.amount)
//       }))

//     });

      

//     }


//     // UX enhancement -----------------------
//     // 1. click enter -> move next cell
//       const moveNext = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
//         if(e.key !=='Enter') return ;

//         e.preventDefault();

//         const inputs = Array.from(
//           document.querySelectorAll('input,select')
//         ) as HTMLElement[]

//         const index = inputs.indexOf(e.currentTarget);
//         if(index > -1 && index < inputs.length -1){
//           inputs[index+1 ].focus()
//         }
//     };

//     // 2.Auto add row - inside updateItem

//     // 3. first time focus 
//     useEffect(()=>{
//       const t = setTimeout(()=>{
//         customerRef.current?.focus();
//       },100)

//       return ()=>clearTimeout(t);
//     },[])


//     //-----------------------------------

//     const handleOldGoldChange = (i:number,e:any)=>{
//       console.log("hello")
//       const {name , value} = e.target ;

    

//       console.log(name,value)
//       setOldJewelItem(prev=>{
//         const updated = [...prev]
//         // updated[i][name] = value ;
//         updated[i] = {
//           ...updated[i] , 
//           [name] :value
//         }

//         const weight = Number(updated[i].weight ||0)
//         const rate = Number(updated[i].rate ||0)

//         updated[i].amount = weight* rate

//         return updated
//       })      
//     }


//     console.log("old",oldJewelItem)

//     const handleOldGoldEnter = (i ,e)=>{
     
//        if (e.key === 'Enter') {
//          e.preventDefault();
//         setOldJewelItem(p=>[
//         ...p,
//         {
//           item_name: 'GOLD',
//           purity : '',
//           weight :0,
//           rate  : 0,
//           amount :0 ,

//         }
//       ])
//       }
//     }

//     const handleRemove = (i)=>{
//       setOldJewelItem((p)=>p.filter((items,index)=> i!=index  ))
//     }

//     const oldGoldTotalAmount = oldJewelItem?.reduce((cum, val)=>cum+ Number(val.amount||0) ,0)
//     console.log("oldGoldAmount",oldGoldTotalAmount)
//     const reminigPayableAmount = (payableAmount ) - (Number(oldGoldTotalAmount) +Number(paid_amount))
//   return (   
    

//   <Tabs defaultValue="new" className="-mt-4 ">

//     <TabsList className="inline-flex h-auto p-1 ml-auto">
//       <TabsTrigger value="new">New Bill</TabsTrigger>
//       <TabsTrigger value="history">History</TabsTrigger>
//     </TabsList>

//       <TabsContent value="new">

//       <div className=" flex flex-col -mt-7">
//         <div className="flex mb-1 items-center justify-between gap-3 w-full ">
//         <div className="">
    
//         {
//           selectedCustomer ? (       

//             <div className="flex gap-x-10 items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
//               <div className="flex items-center gap-3 text-sm text-gray-800">
//                   <User size={16} className="text-green-600" />
//                   <span className="font-medium">  {selectedCustomer.name} </span>
//                   <span className="flex items-center gap-1 text-gray-500"> <Phone size={14} /> {selectedCustomer.phone}  </span>
//                   <span className="flex items-center gap-1 text-gray-500">  <MapPin size={14} />{selectedCustomer.village} </span>
//               </div>

//                 <button  onClick={() => setSelectedCustomer(null)}  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 hover:underline" >
//                 <Edit2 size={14} />
//                 Change
//               </button>
//             </div>
//           ) : (
//          <div className="relative w-[400px] ">

//           <div className="flex items-center gap-2 border border-gold-dark px-3 py-1.5 rounded-md flex-1 max-w-sm bg-white">
//             <Search size={14} className="text-slate-400 shrink-0" />
                  
//           <input ref={ customerRef }
//           placeholder="Search customer..."
//           value={customerSearch}
//           onChange={(e)=>{setCustomerSearch(e.target.value); setHighlightIndex(0)} }
//           onKeyDown={(e)=>{
//             if(e.key === "ArrowDown"){
//                 setHighlightIndex((prev)=> prev <customers.length-1 ? prev+1 :prev)
//             }

//             if(e.key==="ArrowUp"){
//               setHighlightIndex((prev)=>(prev >0 ? prev-1:0))
//             }

//             if(e.key ==="Enter"){
//               const selected = customers?.[highlightIndex];
//               if(selected){
//                 setSelectedCustomer(selected);
//                 setCustomerSearch('')
//                 setTimeout(()=>{
//                     firstItemRef.current?.focus()
//                 },100)
//               }
//             }
//           }}  
//           className=" outline-none flex-1 text-base bg-transparent"
//           />
//           </div>  

//           {customerSearch.trim().length >1 && (
        
//           <div className="absolute w-full  bg-white border mt-1 z-30">
//             {
//               customers?.length >0 ?(
//                   customers?.map((c:any,i:any)=>(
//               <button    className={`px-3 py-1  text-base cursor-pointer w-full text-start  ${i===highlightIndex ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
//                 key={c.id}
//                 onClick={(e)=>{
//                   setSelectedCustomer(c);
//                   setCustomerSearch('');
//                 }}
//               >
//                 {c.name} - {c.phone} - {c.village} 
//               </button>
//             ))
//               ) : (
//                <div className="px-2 py-1 text-xs text-gray-500">
//           No customer found
//         </div>
//               )  }
//           </div>

//            )}
//            </div>
//           )
//         }
              
//         </div>   

//       </div>

//       <div className="flex-1 bg-white border rounded-md overflow-hidden min-h-[220px]">
//         <table className="w-full table-fixed ">
//           <thead className="bg-gray-100 sticky top-0 z-10 ">
//             <tr >
//               <th className="p-2 w-[30px] bg-green-100">NO </th>
//               <th className="w-[100px] bg-yellow-100 ">Item</th>
//               <th className="w-[70px] bg-pink-100" >Metal</th>
//               <th className="w-[60px] bg-cyan-100">Purity</th>
//               <th className="w-[80px] bg-purple-100">Rate/g</th>
//               <th className="w-[60px] bg-yellow-100">GR.WT</th>
//               <th className="w-[50px] bg-blue-100">Stone</th>
//               <th className="w-[60px] bg-purple-100">Net.Wt</th>
//               <th className="w-[60px] bg-blue-100">WST%</th>
//               <th className="w-[60px] bg-cyan-100">WST(G)</th>
//               <th className="w-[60px] bg-red-100">MC</th>
//               <th className="w-[80px] bg-green-100">AMOUNT</th>
//               <th className="w-[40px] bg-rose-100">Act</th>
//                </tr>
//           </thead>

//           <tbody>
//             {
//               items.map((item,i)=>(
//                 <tr key={i+item.item_name} className="border-b border-gray-200 odd:bg-gray-100 even:bg-gray-50 
//                  hover:bg-blue-50 focus-within:bg-blue-50 ">
//                   <td className="w-full px-1.5 py-1.5 align-middle text-center">{i+1}</td>
//                    <td className="px-1.5 py-1.5 align-middle">
//                     <select 
//                      onKeyDown={moveNext} 
//                     ref={firstItemRef}
//                    value={item.category_id || ""}
//                     // onChange={(e)=>updateItem(i,'item_name',e.target.value)}
//                     onChange={(e)=>selectCategory(i,e.target.value)}
//                     className="w-full h-7"
//                     >
//                       <option>Choose item..</option>
//                       {categories?.map((cat:any,i:number)=>(
//                         <option key={i+cat?.name} value={cat.id} >{cat?.name}</option>
//                       ))}
//                     </select>
//                   </td>

//                  <td className="px-1.5 py-1.5 align-middle">
//                     <select value={item?.metal}  onKeyDown={moveNext} 
//                     onChange={(e)=>updateItem(i,'metal',e.target.value)}
//                     className="h-7 w-full "
//                     >
//                       <option value="GOLD">Gold</option>
//                       <option value="SILVER">Silver</option>
//                     </select>
//                   </td>

//                    <td className="px-1.5 py-1.5 align-middle">
//                     {item.metal ==="GOLD"  &&(
//                     <select  onKeyDown={moveNext} 
//                       value={item.purity}
//                       onChange={(e)=>updateItem(i,'purity',e.target.value)}
//                       className="h-7 w-full"
//                     >
//                       <option value="K22">22K</option>
//                       <option value="K18">18K</option>
//                       {/* <option value="K24"></option> */}
//                     </select>
//                     )   }
//                   </td>

//                   <td className="px-1.5 py-1.5 align-middle text-right">
//                     <input type="number" min={0} step="any" value={item.rate || ""} onKeyDown={moveNext} 
//                     onChange={(e)=>updateItem(i,'rate',Number(e.target.value))}
//                     className="h-7  text-right  w-full bg-transparent outline-none px-1.5 py-1.5  focus:bg-white focus:ring-1 focus:ring-gold-dark "
//                     />
//                   </td>

//                    <td className="px-1.5 py-1.5 align-middle text-right">
//                     <input  onKeyDown={moveNext} type="number" min={0} step="any" value={item.gross_weight || ''} 
//                     onChange={(e)=>updateItem(i,'gross_weight',Number(e.target.value))}
//                     className="h-7  w-full bg-transparent  text-base font-semibold text-slate-600 outline-none px-1.5 py-1.5 text-center focus:bg-white focus:ring-1 focus:ring-gold-dark "
//                     />
//                   </td>

//                  <td className="px-1.5 py-1.5 align-middle text-right">
//                     <input  onKeyDown={moveNext} type="number" min={0} step="any" value={item.stone || 0}
//                     onChange={(e)=>updateItem(i,'stone',Number(e.target.value))}
//                     className="h-7  w-full bg-transparent outline-none px-1.5 py-1.5 text-center focus:bg-white focus:ring-1 focus:ring-gold-dark  "
//                     />
//                   </td>
//                    <td className="px-1.5 py-1.5 align-middle text-right">
//                     <input  onKeyDown={moveNext} type="number" min={0} step="any" value={item.net_weight || ''} 
//                     readOnly
//                     // onChange={(e)=>updateItem(i,'net_weight',Number(e.target.value))}
//                     className="h-7  w-full bg-transparent outline-none px-1.5 py-1.5 text-center focus:bg-white focus:ring-1 focus:ring-gold-dark "
//                     />
//                   </td>

//                    <td className="px-1.5 py-1.5 align-middle text-right">
//                     <input  onKeyDown={moveNext} type="number" min={0} step="any" 
//                     value={item.wastage_pct}
//                     onChange={(e)=>updateItem(i,'wastage_pct',Number(e.target.value))}
//                     className="h-7 w-full bg-transparent outline-none px-1.5 py-1.5 text-center focus:bg-white focus:ring-1 focus:ring-gold-dark "
//                     />
//                   </td>

//                    <td className="px-1.5 py-1.5 align-middle text-right">
//                     <input  onKeyDown={moveNext} type="number" min={0} step="any" value={item.wastage_weight}
//                     onChange={(e)=>updateItem(i,'wastage_weight',Number(e.target.value))}
//                     className="h-7   w-full bg-transparent outline-none px-1.5 py-1.5 text-center focus:bg-white focus:ring-1 focus:ring-gold-dark "
//                     />
//                   </td>

//                    <td className="px-1.5 py-1.5 align-middle text-right">
//                     <input  onKeyDown={moveNext} type="number" min={0} step="any" value={item.making_charge } 
//                     onChange={(e)=>updateItem(i,'making_charge',Number(e.target.value))}
//                     className="h-7  w-full bg-transparent outline-none px-1.5 py-1.5 text-base text-center focus:bg-white focus:ring-1 focus:ring-gold-dark "
//                     onFocus={()=>{
//                       if(items.length ===0) return ;
//                       const lastRow = items[items.length-1];
//                       if(lastRow.amount> 0){
//                         addItem()
//                       }
//                     }}
//                     />   
//                   </td>

               

//                     <td className=" font-medium  w-full px-1.5 py-1.5 align-middle text-right  ">
//                       <span className="font-[600] text-green-700 tracking-wide">₹ {Number(item.amount||0).toLocaleString('en-IN')}</span>                       
//                     </td>

//                     <td className=" text-center w-fll px-1.5 py-1.5 align-middle">
//                       <button onClick={()=>removeItem(i)} className="text-red-500 px-1.5 outline-none hover:text-red-700 hover:font-bold transition-all cursor-pointer focus:font-bold focus:text-red-700 ">
//                         ✕
//                       </button>
//                     </td>

//                 </tr>
//               ))
//             }
//           </tbody>

//         </table>
//       </div>

//       <div className=" flex ">

//       <section className=" max-w-[600px] mt-3">
//         <table className="w-full table-fixed border border-black border-collapse ">
//           <thead>
//             <tr>               
//               <th className=" w-10 border border-black   p-1">#</th>
//               <th className="border border-black  p-1 w-[120px]">Item name</th>
//               <th className="border border-black  p-1 ">Purity</th>
//               <th className="border border-black  p-1 ">weight</th>
//               <th className="border border-black  p-1 w-[100px]">Rate</th>
//               <th className="border border-black  p-1 w-[140px]">Amount</th>
//               <th className="border border-black  p-1 ">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//         {
//           oldJewelItem?.map((item,i)=>(

//               <tr className="" key={i+"old"}>
//                       <td className="border border-black  p-1 text-center">
//                        { i+1}
//                       </td>
//                       <td className="border border-black  p-1  ">
//                         <select   name="item_name" value={item.item_name||"GOLD"} onChange={(e)=>handleOldGoldChange(i,e)} className="w-full p-2 text-lg outline-1 " >
//                           <option value="GOLD">GOLD</option>
//                           <option value="Silver">Silver</option>
//                         </select>
//                       </td>
//                       <td className="border border-black  p-1 ">
//                         <input type="text" value={item.purity} name="purity" onChange={(e)=>handleOldGoldChange(i,e)}  className="w-full outline-1 text-lg h-8 text-center " />
//                       </td>
//                       <td className="border border-black  p-1 ">
//                          <input type="number"  value={item.weight} name="weight" onChange={(e)=>handleOldGoldChange(i,e)}  className="w-full outline-1 text-lg h-8 text-center" />
//                       </td>
//                       <td className="border border-black  p-1 ">
//                          <input type="number"  value={item.rate} name="rate" onChange={(e)=>handleOldGoldChange(i,e)} className="w-full outline-1 text-lg h-8 text-center"  onKeyDown={(e) => handleOldGoldEnter(i,e)}/>
//                       </td>
//                       <td className="border border-black  p-1 ">
//                          <input type="number"  value={item.amount} onChange={(e)=>handleOldGoldChange(i,e)}  readOnly name="amount" className="w-full outline-1 text-lg h-8 text-center" />
//                       </td>
//                       <td className="border border-black  p-1 text-center text-red-500 ">
//                        <button onClick={()=>handleRemove(i)} className="text-center"><X /> </button> 
//                       </td>

//                     </tr>

//           ))
//         }
          
//           </tbody>
//         </table>

//       </section>

//       <section className="w-1/3  bg-gray-50 p-2 px-5 my-2 ml-auto ">
//             <div className="flex justify-between ">
//               <span className="text-slate-600"> SubTotal</span>
//              <span>₹ {Math.round(Number(total)).toLocaleString('en-IN')}  </span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-slate-600"> discount</span>
//                  <input className=" outline-none w-20 ring-1 ring-gold px-2" type="number" value={discount||''}  onChange={(e)=>setDiscount(Number(e.target.value))} />
//               <span>₹ {Math.round(Number(discount)).toLocaleString('en-IN')}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-slate-600"> discounted Total</span>           
//               <span>₹ {Math.round(Number(discountedTotal)).toLocaleString('en-IN')}</span>
//             </div>

//             <div className="h-0.5 bg-gold-light my-1">
            
//             </div>

//             {isGst && 

//           <div>
//           <div className="flex justify-between">
//               <span className="text-slate-600"> CGST</span>
//               <span className="text-slate-600">1.5%</span>
//               <span>₹ {Math.round(gstAmount/2).toLocaleString('en-IN')}</span>
//             </div>
//           <div className="flex justify-between">
//               <span className="text-slate-600"> SGST</span>
//               <span className="text-slate-600">1.5%</span>
//               <span> ₹ {Math.round(gstAmount/2).toLocaleString('en-IN')}</span>
//             </div>
//             </div>
            
//             }
            
//           <div className="h-0.5 bg-gold-light my-1">
            
//             </div>

//             <div className="space-y-2">              
//                <div className="flex justify-between">
//                 <span>Payable amount </span>
//                 <span className="text-2xl text-red-600 font-bold"><span className="text-lg">₹ </span>{Math.round(Number(payableAmount))?.toLocaleString('en-IN')}  </span>
//               </div>
//                <div className="flex justify-between">
//                 <span>Old Jewel Amount</span>
//                 <span className="text-2xl text-green-600 font-bold"><span className="text-lg">₹ </span>{Math.round(oldGoldTotalAmount).toLocaleString('en-IN')}  </span>
//               </div>
//                <div className="flex justify-between">
//                 <span>Paid amount </span>
//                 <input type="number" className="border  tracking-wide  border-blue-400 px-1 text-base w-[110px] outline-none" 
//                 value={paid_amount} onChange={(e)=>setPaidAmount(Number(e.target.value)||'')}/>
//                 <span className="text-2xl font-bold text-lime-800 "> ₹ {paid_amount.toLocaleString('en-IN') }</span>
//               </div>
//                <div className="flex justify-between">
//                 <span>Remining Payable amount </span>
//                 <span className="text-2xl text-red-600 font-bold"><span className="text-lg">₹ </span>{Math.round(Number(reminigPayableAmount))?.toLocaleString('en-IN')}  </span>
//               </div>

//             </div>
//                <div className="text-gold-dark border border-gold-dark text-center mt-3">
//               <button onClick={handleSubmit} className="w-full p-0.5">
//                 Print Bill
//               </button>
//             </div>
//       </section>

//       </div>
  
//     </div>
//       </TabsContent>


//       <TabsContent value="history">
//         <BillHistory />
//       </TabsContent>

//   </Tabs>

//   )
// }

// export default NewBillPage








'use client'

import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebouce";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillHistory from "@/components/app_component/BillHistory";
import { Edit2, MapPin, Phone, Search, User, X, Loader2, Printer, Plus, History, AlertCircle, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface BillItem {
  item_name: string;
  metal: 'GOLD' | 'SILVER';
  purity: 'K22' | 'K18' | 'K24';
  rate: number;
  gross_weight: number;
  stone: number;
  net_weight: number;
  wastage_pct: number;
  wastage_weight: number;
  making_charge: number;
  amount: number;
  category_id?: string;
}

interface OldJewelItem {
  item_name: string;
  purity: string;
  weight: number;
  rate: number;
  amount: number;
}

const calcAmount = (item: BillItem): number => {
  return Math.max(Math.round(item.rate * (item.net_weight + item.wastage_weight) + item.making_charge), 0);
}

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const defaultItem = (rate22k = 0): BillItem => ({
  amount: 0,
  rate: rate22k,
  wastage_pct: 0,
  wastage_weight: 0,
  net_weight: 0,
  gross_weight: 0,
  item_name: '',
  making_charge: 0,
  metal: 'GOLD',
  purity: "K22",
  stone: 0,
  category_id: ''
})

const NewBillPage = () => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<BillItem[]>([defaultItem()]);
  const [oldJewelItem, setOldJewelItem] = useState<OldJewelItem[]>([{
    item_name: 'GOLD',
    purity: '',
    weight: 0,
    rate: 0,
    amount: 0
  }]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<string>(getTodayDateStr);
  const [isGst, setIsGst] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const DRAFT_STORAGE_KEY = 'jeweltrack_billing_new_draft';

  const firstItemRef = useRef<HTMLSelectElement>(null);
  const customerRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCurrentTab = searchParams.get('tab') || 'new';
  const pathname = usePathname(); // '/dashboard/billing/new'

  useEffect(() => {
    setActiveTab(activeCurrentTab);
  }, [activeCurrentTab]);

  // Restore draft from localStorage on initial page load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === 'object') {
          if (Array.isArray(draft.items) && draft.items.length > 0) {
            setItems(draft.items);
          }
          if (Array.isArray(draft.oldJewelItem) && draft.oldJewelItem.length > 0) {
            setOldJewelItem(draft.oldJewelItem);
          }
          if (draft.selectedCustomer) setSelectedCustomer(draft.selectedCustomer);
          if (typeof draft.isGst === 'boolean') setIsGst(draft.isGst);
          if (draft.discount !== undefined) setDiscount(Number(draft.discount) || 0);
          if (draft.notes !== undefined) setNotes(draft.notes || '');
          if (draft.paidAmount !== undefined) setPaidAmount(String(draft.paidAmount || ''));
          if (draft.invoiceDate) setInvoiceDate(draft.invoiceDate);
          setHasDraft(true);
        }
      }
    } catch (err) {
      console.error('Failed to restore bill draft from localStorage:', err);
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  // Auto-save draft to localStorage whenever user modifies the bill
  useEffect(() => {
    if (!draftLoaded) return;

    const hasItemsData = items.some(
      (i) => (i.category_id && i.category_id !== '') || (i.gross_weight && i.gross_weight > 0) || (i.amount && i.amount > 0)
    );
    const hasOldGoldData = oldJewelItem.some(
      (o) => (o.weight && o.weight > 0) || (o.amount && o.amount > 0)
    );
    const hasCustomer = !!selectedCustomer;
    const hasNotes = !!notes && notes.trim().length > 0;
    const hasDiscount = Number(discount) > 0;
    const hasPaid = Number(paidAmount) > 0;

    if (hasItemsData || hasOldGoldData || hasCustomer || hasNotes || hasDiscount || hasPaid) {
      const draftPayload = {
        items,
        oldJewelItem,
        selectedCustomer,
        isGst,
        discount,
        notes,
        paidAmount,
        invoiceDate,
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
        setHasDraft(true);
      } catch (err) {
        console.error('Failed to save bill draft:', err);
      }
    }
  }, [draftLoaded, items, oldJewelItem, selectedCustomer, isGst, discount, notes, paidAmount, invoiceDate]);

  const { data: rate, isLoading: rateLoading } = useQuery({
    queryKey: ['recent-rate'],
    queryFn: () => api.get('rate/recent-rate').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/jewellery-category').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data: subscription } = useQuery({
    queryKey: ['shop-current-subscription'],
    queryFn: () => api.get('/subscription/current').then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const isExpired = subscription?.is_expired;

  useEffect(() => {
    if (!rate) return;
    setItems((prev) =>
      prev.map((item) => {
        // Only set default rate for rows that have no custom rate yet
        if (item.rate && item.rate > 0) return item;
        return {
          ...item,
          rate: item.metal === 'GOLD' ? rate.rate_22k ?? 0 : rate.rate_silver ?? 0,
        };
      })
    );
  }, [rate]);

  const debouncedSearch = useDebounce(customerSearch.trim(), 300);

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customer', debouncedSearch],
    queryFn: () =>
      debouncedSearch.length > 1
        ? api.get(`customer/search?q=${debouncedSearch}`).then((r) => r.data)
        : [],
    enabled: debouncedSearch.length > 1,
    staleTime: 1 * 60 * 1000,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => api.post('/bill', data),
    onSuccess: (res) => {
      setIsPrinting(true);
      const printWindow = window.open(`/print/${res.data.id}`, '_blank');

      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['CustomerBill'] });

      toast.success(`Bill ${res.data.bill_number} created successfully!`);
      resetForm();

      setTimeout(() => customerRef.current?.focus(), 500);
      setTimeout(() => {
        if (printWindow) {
          printWindow.close();
        }
        setIsPrinting(false);
      }, 2000);
    },
    onError: (e: any) => {
      setError(e?.response?.data?.message || 'Something went wrong');
      toast.error(e?.response?.data?.message || 'Failed to create bill');
      setIsPrinting(false);
    },
  });

  const resetForm = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {}
    setHasDraft(false);
    setItems([defaultItem(rate?.rate_22k ?? 0)]);
    setOldJewelItem([
      {
        item_name: 'GOLD',
        purity: '',
        weight: 0,
        rate: 0,
        amount: 0,
      },
    ]);
    setPaidAmount('');
    setSelectedCustomer(null);
    setDiscount(0);
    setNotes('');
    setIsGst(true);
    setInvoiceDate(getTodayDateStr());
    setError('');
    setCustomerSearch('');
  };

  const handleClearDraft = () => {
    resetForm();
    toast.info('Draft cleared. Started fresh bill.');
  };

  const updateItem = (index: number, field: keyof BillItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'purity') {
      item.rate = value === 'K22' ? (rate?.rate_22k ?? 0)
        : value === 'K18' ? (rate?.rate_18k ?? 0)
          : (rate?.rate_999 ?? 0);
    }

    if (field === 'metal') {
      item.rate = value === 'SILVER' ? (rate?.rate_silver ?? 0) : (rate?.rate_22k ?? 0);
      item.purity = "K22";
    }

    if (field === 'gross_weight' || field === 'stone') {
      item.net_weight = Math.max(item.gross_weight - item.stone, 0);
    }

    if (field === 'wastage_pct') {
      item.wastage_weight = item.net_weight > 0
        ? parseFloat(((item.wastage_pct / 100) * item.net_weight).toFixed(3)) : 0;
    }

    if (field === 'wastage_weight') {
      item.wastage_pct = item.net_weight > 0
        ? parseFloat(((item.wastage_weight / item.net_weight) * 100).toFixed(2)) : 0;
    }

    if (field === 'net_weight' && item.wastage_pct > 0) {
      item.wastage_weight = parseFloat(((item.wastage_pct / 100) * value).toFixed(3));
    }

    if (field === "gross_weight" || field === 'stone') {
      if (item.wastage_pct > 0) {
        item.wastage_weight = parseFloat(
          ((item.wastage_pct / 100) * item.net_weight).toFixed(3)
        );
      }
    }

    item.amount = calcAmount(item);
    updated[index] = item;
    setItems(updated);
  };

  const selectCategory = (index: number, catId: string) => {
    const cat = categories?.find((c: any) => c.id === catId);
    if (!cat) return;
    
    const updated = [...items];
    const item = { ...updated[index] };
    item.item_name = cat.name;
    item.category_id = cat.id;
    item.wastage_pct = cat.default_wastage ?? 0;
    item.wastage_weight = item.wastage_pct > 0
      ? parseFloat((item.net_weight * item.wastage_pct / 100).toFixed(2)) : 0;
    item.making_charge = cat.default_making_charge ?? 0;
    item.amount = calcAmount(item);
    updated[index] = item;
    setItems(updated);
  };

  const addItem = () => {
    const newItem = defaultItem(rate?.rate_22k ?? 0);
    setItems(prev => [...prev, newItem]);
    setTimeout(() => {
      tableContainerRef.current?.scrollTo({ top: tableContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.warning('At least one item is required');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const total = Math.max(
    items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
    0
  );

  const discountAmount = Math.max(Number(discount) || 0, 0);
  const discountedTotal = Math.max(total - discountAmount, 0);

  // CRITICAL FIX: Only calculate GST if isGst is TRUE!
  const gstAmount = isGst ? Math.max(Math.round(discountedTotal * 0.03), 0) : 0;
  const grossBillAmount = discountedTotal + gstAmount;

  // Old gold exchange credit
  const oldGoldTotalAmount = Math.max(
    oldJewelItem?.reduce((cum, val) => cum + Number(val.amount || 0), 0) || 0,
    0
  );

  // Net Cash/UPI amount payable by customer (Gross Bill minus Old Gold credit)
  const netPayableAmount = Math.max(grossBillAmount - oldGoldTotalAmount, 0);
  const oldGoldExcessAmount = Math.max(oldGoldTotalAmount - grossBillAmount, 0);

  // Paid and Balance Due
  const currentPaid = Math.max(Number(paidAmount) || 0, 0);
  const balanceDue = Math.max(netPayableAmount - currentPaid, 0);
  const changeToReturn = currentPaid > netPayableAmount ? currentPaid - netPayableAmount : 0;

  const handleSubmit = () => {
    setError('');
    
    if (isExpired) {
      toast.error('Subscription plan expired. Official billing is locked. Please switch to Estimate Billing or renew your plan.');
      setError('Subscription expired. Switch to Estimate Billing or renew your plan.');
      return;
    }

    if (!selectedCustomer) {
      toast.error('Please select a customer');
      setError('Please select a customer');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Add at least one item');
      setError('Add at least one item');
      return;
    }
    
    const validItems = items.filter(i => i.amount > 0);
    if (validItems.length === 0) {
      toast.error('All items have zero amount');
      setError('All items have zero amount');
      return;
    }

    let billDateTime: string | undefined;
    if (invoiceDate) {
      const now = new Date();
      const [y, m, d] = invoiceDate.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
      billDateTime = targetDate.toISOString();
    }

    const billData = {
      customer_id: selectedCustomer.id,
      is_gst_bill: isGst,
      bill_date: billDateTime,
      discount: discountAmount,
      notes,
      totalAmount: total,
      totalGST: gstAmount,
      payableAmount: grossBillAmount,
      paid_amount: currentPaid,
      billItem: validItems.map(item => ({
        category_id: item.category_id,
        metal: item.metal,
        purity: item.metal === 'GOLD' ? item.purity : undefined,
        rate: item.rate,
        gross_weight: item.gross_weight,
        net_weight: item.net_weight,
        wastage: item.wastage_weight,
        stone: item.stone,
        making_charge: item.making_charge,
        amount: item.amount,
      })),
      oldJewelItem: oldJewelItem.filter((item) => item.amount > 0).map((item) => ({
        item_name: item.item_name,
        purity: item.purity,
        weight: Number(item.weight),
        rate: Number(item.rate),
        amount: Number(item.amount)
      }))
    };

    mutate(billData);
  };

  const moveNext = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const inputs = Array.from(
      document.querySelectorAll('input,select')
    ) as HTMLElement[];

    const index = inputs.indexOf(e.currentTarget);
    if (index > -1 && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      customerRef.current?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const handleOldGoldChange = (i: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setOldJewelItem(prev => {
      const updated = [...prev];
      updated[i] = {
        ...updated[i],
        [name]: name === 'weight' || name === 'rate' ? Number(value) || 0 : value
      };
      
      const weight = Number(updated[i].weight || 0);
      const rate = Number(updated[i].rate || 0);
      updated[i].amount = weight * rate;
      
      return updated;
    });
  };

  const handleOldGoldEnter = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setOldJewelItem(p => [
        ...p,
        {
          item_name: 'GOLD',
          purity: '',
          weight: 0,
          rate: 0,
          amount: 0,
        }
      ]);
    }
  };

  const handleRemoveOldGold = (i: number) => {
    if (oldJewelItem.length <= 1) {
      toast.warning('At least one old jewelry item is required');
      return;
    }
    setOldJewelItem((p) => p.filter((_, index) => i !== index));
  };

  if (rateLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }



const handleTabChange = (tab: string) => {
  router.replace(`${pathname}?tab=${tab}`, { scroll: false });
};

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-1 ">


    

      <TabsContent value="new" className="space-y-4">
        {/* Subscription Expired Restricted Banner */}
        {isExpired && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-950 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Official Invoicing Locked · Plan Expired
                </div>
                <p className="text-sm font-medium text-rose-900 mt-0.5">
                  Your subscription period has ended. You can still create and print counter estimates using <strong>Estimate Billing</strong> or renew your plan to unlock official GST tax invoices.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/dashboard/billing/estimate"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>🧾 Estimate Billing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/dashboard/settings?tab=subscription"
                className="bg-gradient-to-r from-gold via-amber-400 to-amber-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-xs hover:brightness-105 transition-all"
              >
                ⚡ Renew Plan
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Left side - Customer Search */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
              {selectedCustomer ? (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-emerald-50/80 border border-emerald-200 rounded-lg px-3 py-1.5 flex-1 min-w-[260px]">
                  <User size={15} className="text-emerald-700 shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate max-w-[140px] sm:max-w-none">{selectedCustomer.name}</span>
                  <span className="flex items-center gap-1 text-slate-600 text-xs sm:text-sm shrink-0">
                    <Phone size={12} />
                    {selectedCustomer.phone}
                  </span>
                  <span className="hidden sm:flex items-center gap-1 text-slate-500 text-xs sm:text-sm">
                    <MapPin size={12} />
                    {selectedCustomer.village}
                  </span>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    <Edit2 size={12} />
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <div className="flex items-center gap-2 border border-gray-300 px-2 py-1.5 rounded bg-white focus-within:ring-2 focus-within:ring-amber-500">
                  <Search size={15} className="text-gray-400" />
                  <input
                    ref={customerRef}
                    placeholder="Search customer..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setHighlightIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHighlightIndex((prev) => prev < (customers?.length || 0) - 1 ? prev + 1 : prev);
                      }
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHighlightIndex((prev) => prev > 0 ? prev - 1 : 0);
                      }
                      if (e.key === "Enter") {
                        const selected = customers?.[highlightIndex];
                        if (selected) {
                          setSelectedCustomer(selected);
                          setCustomerSearch('');
                          setTimeout(() => firstItemRef.current?.focus(), 100);
                        }
                      }
                    }}
                    className="flex-1 outline-none text-sm bg-transparent"
                  />
                  {customersLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                </div>

                {customerSearch.trim().length > 1 && customers && customers.length > 0 && (
                  <div className="absolute w-full bg-white border rounded-lg mt-1 shadow-lg z-30 max-h-60 overflow-y-auto">
                    {customers.map((c: any, i: number) => (
                      <button
                        className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors ${i === highlightIndex ? 'bg-amber-50' : ''}`}
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch('');
                        }}
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-gray-500 ml-2">- {c.phone}</span>
                        <span className="text-gray-400 ml-2 text-xs">{c.village}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Invoice / Bill Date Picker */}
            <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500 transition-all shadow-xs">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <label htmlFor="bill-date-input" className="text-xs font-bold text-slate-600 shrink-0 cursor-pointer">
                Bill Date:
              </label>
              <input
                id="bill-date-input"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="text-xs font-black text-slate-900 bg-transparent outline-none cursor-pointer"
              />
              {invoiceDate !== getTodayDateStr() && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Custom Date
                  </span>
                  <button
                    type="button"
                    onClick={() => setInvoiceDate(getTodayDateStr())}
                    className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold underline ml-0.5 cursor-pointer"
                    title="Reset to today"
                  >
                    Today
                  </button>
                </div>
              )}
            </div>

            {/* GST Toggle */}
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer whitespace-nowrap bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors shadow-xs">
              <input
                type="checkbox"
                checked={isGst}
                onChange={(e) => setIsGst(e.target.checked)}
                className="w-3.5 h-3.5 text-amber-600 border-gray-300 rounded cursor-pointer"
              />
              <span className="font-bold text-xs text-slate-800">GST Invoice</span>
            </label>

            {/* Auto-saved draft indicator */}
            {hasDraft && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xs">
                <span>💾 Auto-Saved Draft</span>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="text-emerald-700 hover:text-rose-600 underline font-semibold ml-1 cursor-pointer"
                  title="Discard draft and reset form"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Right side - Tabs */}
          <div className="flex items-center justify-end gap-1 bg-gray-100 p-0.5 rounded-lg self-end xl:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('new')}
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
              onClick={() => setActiveTab('history')}
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

        {/* Bill Items Table - Full Width with Large Font */}
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto" ref={tableContainerRef}>
            <table className="w-full border-collapse min-w-[1075px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[30px]">#</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[150px]">Item</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[90px]">Metal</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[80px]">Purity</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[90px]">Rate/g</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[90px]">Gross Wt</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[70px]">Stone</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[90px]">Net Wt</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[70px]">WST%</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[80px]">WST(g)</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[80px]">MC</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[110px]">Amount</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border border-gray-200 w-[35px]">Act</th>
              </tr>
            </thead>
            <tbody>
    {items.map((item, i) => (
      <tr key={i} className="hover:bg-amber-50/30">
        <td className="px-2 py-1.5 text-center text-sm font-medium text-gray-500 border border-gray-200">{i + 1}</td>
        
        <td className="px-1 py-1 border border-gray-200">
          <select
            onKeyDown={moveNext}
            ref={i === 0 ? firstItemRef : null}
            value={item.category_id || ""}
            onChange={(e) => selectCategory(i, e.target.value)}
            className="w-full h-8 px-1.5 text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          >
            <option value="">Select...</option>
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </td>
        
        <td className="px-1 py-1 border border-gray-200">
          <select
            value={item.metal}
            onKeyDown={moveNext}
            onChange={(e) => updateItem(i, 'metal', e.target.value)}
            className="w-full h-8 px-1.5 text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          >
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
          </select>
        </td>
        
        <td className="px-1 py-1 border border-gray-200">
          {item.metal === "GOLD" && (
            <select
              onKeyDown={moveNext}
              value={item.purity}
              onChange={(e) => updateItem(i, 'purity', e.target.value)}
              className="w-full h-8 px-1.5 text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
            >
              <option value="K22">22K</option>
              <option value="K18">18K</option>
            </select>
          )}
        </td>
        
        <td className="px-1 py-1 border border-gray-200">
          <input
            type="number"
            min={0}
            step="any"
            value={item.rate || ""}
            onKeyDown={moveNext}
            onChange={(e) => updateItem(i, 'rate', Number(e.target.value))}
            className="w-full h-8 px-1.5 text-right text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          />
        </td>
        
        <td className="px-1 py-1 border border-gray-200">
          <input
            onKeyDown={moveNext}
            type="number"
            min={0}
            step="any"
            value={item.gross_weight || ''}
            onChange={(e) => updateItem(i, 'gross_weight', Number(e.target.value))}
            className="w-full h-8 px-1.5 text-right text-sm font-medium bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          />
        </td>
        
        <td className="px-1 py-1 border border-gray-200">
          <input
            onKeyDown={moveNext}
            type="number"
            min={0}
            step="any"
            value={item.stone || 0}
            onChange={(e) => updateItem(i, 'stone', Number(e.target.value))}
            className="w-full h-8 px-1.5 text-right text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          />
        </td>
        
        <td className="px-1 py-1 border border-gray-200">
          <input
            type="number"
            min={0}
            step="any"
            value={item.net_weight || ''}
            readOnly
            className="w-full h-8 px-1.5 text-right text-sm font-medium bg-gray-50 border-0 rounded outline-none cursor-default"
          />
        </td>
        
        <td className="px-1 py-1 border border-gray-200">
          <input
            onKeyDown={moveNext}
            type="number"
            min={0}
            step="any"
            value={item.wastage_pct}
            onChange={(e) => updateItem(i, 'wastage_pct', Number(e.target.value))}
            className="w-full h-8 px-1.5 text-right text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          />
        </td>
        
        <td className="px-1 py-1 border border-gray-200">
          <input
            onKeyDown={moveNext}
            type="number"
            min={0}
            step="any"
            value={item.wastage_weight}
            onChange={(e) => updateItem(i, 'wastage_weight', Number(e.target.value))}
            className="w-full h-8 px-1.5 text-right text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          />
        </td>
        
        <td className="px-1 py-1 border border-gray-200">
          <input
            onKeyDown={moveNext}
            type="number"
            min={0}
            step="any"
            value={item.making_charge}
            onChange={(e) => updateItem(i, 'making_charge', Number(e.target.value))}
            className="w-full h-8 px-1.5 text-right text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
            onFocus={() => {
              if (items.length === 0) return;
              const lastRow = items[items.length - 1];
              if (lastRow.amount > 0) {
                addItem();
              }
            }}
          />
        </td>
        
        <td className="px-2 py-1.5 text-right border border-gray-200">
          <span className="text-sm font-bold text-green-700">
            ₹ {Number(item.amount || 0).toLocaleString('en-IN')}
          </span>
        </td>
        
        <td className="px-1 py-1 text-center border border-gray-200">
          <button
            onClick={() => removeItem(i)}
            className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded hover:bg-red-50"
          >
            <X size={15} />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
          </div>
        </div>

        {/* Two Column Layout: Left - Old Jewel, Right - Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Section - Old Jewelry (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="text-base font-bold text-gray-700">Old Jewelry Exchange</h3>
              </div>
              <div className="overflow-x-auto p-2">
                <table className="w-full border-collapse min-w-[665px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 border border-gray-300 w-[35px]">#</th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 border border-gray-300 w-[130px]">Item</th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 border border-gray-300 w-[100px]">Purity</th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 border border-gray-300 w-[110px]">Weight (g)</th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 border border-gray-300 w-[110px]">Rate</th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 border border-gray-300 w-[140px]">Amount</th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 border border-gray-300 w-[40px]">Act</th>
                  </tr>
                </thead>
                <tbody>
    {oldJewelItem.map((item, i) => (
      <tr key={i} className="hover:bg-amber-50/30">
        <td className="px-2 py-1.5 text-center text-sm font-medium text-gray-500 border border-gray-300">{i + 1}</td>
        
        <td className="px-1 py-1 border border-gray-300">
          <select
            name="item_name"
            value={item.item_name || "GOLD"}
            onChange={(e) => handleOldGoldChange(i, e)}
            className="w-full h-8 px-1.5 text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          >
            <option value="GOLD">GOLD</option>
            <option value="Silver">Silver</option>
          </select>
        </td>
        
        <td className="px-1 py-1 border border-gray-300">
          <input
            type="text"
            value={item.purity}
            name="purity"
            onChange={(e) => handleOldGoldChange(i, e)}
            className="w-full h-8 px-1.5 text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          />
        </td>
        
        <td className="px-1 py-1 border border-gray-300">
          <input
            type="number"
            value={item.weight}
            name="weight"
            onChange={(e) => handleOldGoldChange(i, e)}
            className="w-full h-8 px-1.5 text-right text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          />
        </td>
        
        <td className="px-1 py-1 border border-gray-300">
          <input
            type="number"
            value={item.rate}
            name="rate"
            onChange={(e) => handleOldGoldChange(i, e)}
            onKeyDown={(e) => handleOldGoldEnter(i, e)}
            className="w-full h-8 px-1.5 text-right text-sm bg-transparent border-0 focus:ring-1 focus:ring-amber-400 rounded outline-none"
          />
        </td>
        
        <td className="px-2 py-1.5 text-right border border-gray-300">
          <span className="text-sm font-bold text-green-700">
            ₹ {Number(item.amount || 0).toLocaleString('en-IN')}
          </span>
        </td>
        
        <td className="px-1 py-1 text-center border border-gray-300">
          <button
            onClick={() => handleRemoveOldGold(i)}
            className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded hover:bg-red-50"
          >
            <X size={15} />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
              </div>
            </div>
          </div>

          {/* Right Section - Bill Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-300 rounded-xl shadow-xs p-4 sticky top-4 space-y-3">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                <h3 className="text-base font-bold text-gray-900 leading-tight">Bill Summary</h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    isGst
                      ? 'bg-blue-50 text-blue-900 border-blue-200'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                  }`}
                >
                  {isGst ? 'GST (3%)' : 'DIRECT BILL'}
                </span>
              </div>

              {/* Items Subtotal & Calculations */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-700">
                  <span className="font-medium text-xs uppercase tracking-wider text-gray-600">New Items Subtotal</span>
                  <span className="font-bold font-mono text-gray-900 text-sm">₹ {Math.round(total).toLocaleString('en-IN')}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-600 text-xs font-medium">Discount</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 font-medium">₹</span>
                    <input
                      type="number"
                      min={0}
                      className="w-20 h-7 px-1.5 text-right text-xs font-bold font-mono border border-gray-300 rounded focus:border-gray-600 focus:outline-none bg-white"
                      value={discount || ''}
                      placeholder="0"
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                    {discountAmount > 0 && (
                      <span className="font-mono text-rose-600 text-xs font-bold">-₹{Math.round(discountAmount).toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-gray-500 text-xs">
                    <span>Subtotal After Discount:</span>
                    <span className="font-medium font-mono text-gray-800">₹ {Math.round(discountedTotal).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* GST Details (Only shown if GST Bill) */}
                {isGst && (
                  <div className="flex justify-between items-center text-gray-700 text-xs">
                    <span>GST (3%):</span>
                    <span className="font-mono font-bold text-gray-900">+₹ {Math.round(gstAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Total Bill Value (Before Old Gold) */}
                <div className="flex justify-between items-center text-gray-900 pt-1 border-t border-gray-200 font-bold text-xs">
                  <span>Total Bill Value:</span>
                  <span className="font-mono text-sm">₹ {Math.round(grossBillAmount).toLocaleString('en-IN')}</span>
                </div>

                {/* Old Jewel Credit */}
                {oldGoldTotalAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 pt-0.5 text-xs font-bold">
                    <span>Old Jewel Credit:</span>
                    <span className="font-mono text-sm">
                      - ₹ {Math.round(oldGoldTotalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Net Payable Row */}
              <div className="border-t border-gray-200 pt-2.5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Net Payable
                    </span>
                    <div className="text-xl font-black font-mono text-gray-950">
                      ₹ {Math.round(netPayableAmount).toLocaleString('en-IN')}
                    </div>
                  </div>
                  {netPayableAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaidAmount(String(Math.round(netPayableAmount)))}
                      className="text-xs bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      Full Pay
                    </button>
                  )}
                </div>
              </div>

              {/* Paid Amount Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="paid-amount-input" className="text-gray-700 font-bold text-xs uppercase tracking-wider">
                    Paid Amount (Cash/UPI)
                  </label>
                  {currentPaid > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaidAmount('')}
                      className="text-[11px] text-gray-400 hover:text-rose-600 underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1.5 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    id="paid-amount-input"
                    type="number"
                    min={0}
                    className="w-full h-9 pl-7 pr-3 text-right text-base font-black font-mono border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none bg-white shadow-xs"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Single Payment Status / Balance Box */}
              <div>
                {oldGoldExcessAmount > 0 ? (
                  <div className="p-2.5 rounded-lg border bg-blue-50 border-blue-200 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                        Refund to Customer
                      </div>
                      <div className="text-[11px] text-blue-700">
                        Old gold credit exceeds bill
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-base font-black text-blue-900">
                        ₹ {Math.round(oldGoldExcessAmount + currentPaid).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ) : balanceDue > 0 ? (
                  <div className="p-2.5 rounded-lg border bg-rose-50 border-rose-200 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                        Balance Due
                      </div>
                      <div className="text-[11px] text-rose-600">
                        Pending from customer
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-base font-black text-rose-700">
                        ₹ {Math.round(balanceDue).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ) : changeToReturn > 0 ? (
                  <div className="p-2.5 rounded-lg border bg-amber-50 border-amber-200 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                        Change / Return
                      </div>
                      <div className="text-[11px] text-amber-700">
                        Return excess cash to customer
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-base font-black text-amber-800">
                        ₹ {Math.round(changeToReturn).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg border bg-emerald-50 border-emerald-200 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                        Payment Status
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Fully Settled
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-base font-black text-emerald-800">
                        ₹ 0.00
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <input
                  type="text"
                  placeholder="Note / Payment Mode (Cash, UPI, Card)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none bg-white placeholder:text-gray-400"
                />
              </div>

              {/* Discard Draft link */}
              {hasDraft && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="text-[11px] text-gray-400 hover:text-rose-600 underline font-medium transition-colors cursor-pointer"
                  >
                    Discard draft & start fresh
                  </button>
                </div>
              )}

              {error && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 font-medium">
                  {error}
                </div>
              )}

              {/* Submit & Print Button */}
              <button
                onClick={handleSubmit}
                disabled={isPending || isPrinting || isExpired}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm h-10 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                {isPending || isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Saving & Printing Bill...</span>
                  </>
                ) : isExpired ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Official Invoicing Locked (Plan Expired)</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span>Save & Print Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="history">
       
            {/* <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('new')}
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
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'history' 
                  ? 'bg-white shadow-sm text-amber-700' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <History size={15} />
              History
            </button>
          </div> */}
        <BillHistory activeTab={activeTab} newBill={()=>setActiveTab('new')}  history={()=>setActiveTab('history')} />
      </TabsContent>
    </Tabs>
  );
};
export default function NewBillPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading billing...</div>}>
      <NewBillPage />
    </Suspense>
  );
}