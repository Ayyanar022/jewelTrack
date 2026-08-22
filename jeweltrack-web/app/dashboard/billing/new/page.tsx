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
import { Edit2, MapPin, Phone, Search, User, X, Loader2, Printer, Plus, History } from "lucide-react";
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
  const [isGst, setIsGst] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTab, setActiveTab] = useState('new') 

  const firstItemRef = useRef<HTMLSelectElement>(null);
  const customerRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const router = useRouter()
  const activeCurrentTab = searchParams.get('tab') || 'new' ; 
    const pathname = usePathname(); // '/dashboard/billing/new'

  useEffect(()=>{
    setActiveTab(activeCurrentTab)
  },[activeCurrentTab])

  const { data: rate, isLoading: rateLoading } = useQuery({
    queryKey: ['recent-rate'],
    queryFn: () => api.get('rate/recent-rate').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/jewellery-category').then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!rate) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        rate: item.metal === 'GOLD' ? rate.rate_22k ?? 0 : rate.rate_silver ?? 0
      }))
    );
  }, [rate]);

  const debouncedSearch = useDebounce(customerSearch.trim(), 300);

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customer', debouncedSearch],
    queryFn: () => debouncedSearch.length > 1
      ? api.get(`customer/search?q=${debouncedSearch}`).then(r => r.data)
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
    }
  });

  const resetForm = () => {
    setItems([defaultItem(rate?.rate_22k ?? 0)]);
    setOldJewelItem([{
      item_name: 'GOLD',
      purity: '',
      weight: 0,
      rate: 0,
      amount: 0
    }]);
    setPaidAmount('');
    setSelectedCustomer(null);
    setDiscount(0);
    setNotes('');
    setIsGst(true);
    setError('');
    setCustomerSearch('');
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
    items.reduce((sum, i) => sum + i.amount, 0), 0
  );

  const discountedTotal = Math.max((total - discount), 0);
  const gstAmount = Math.max(discountedTotal * (3 / 100), 0);
  const payableAmount = discountedTotal + gstAmount;
  const oldGoldTotalAmount = oldJewelItem?.reduce((cum, val) => cum + Number(val.amount || 0), 0) || 0;
  const remainingPayableAmount = payableAmount - (Number(oldGoldTotalAmount) + Number(paidAmount || 0));

  const handleSubmit = () => {
    setError('');
    
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

    const billData = {
      customer_id: selectedCustomer.id,
      is_gst_bill: isGst,
      discount,
      notes,
      totalAmount: total,
      totalGST: gstAmount,
      payableAmount,
      paid_amount: Number(paidAmount) || 0,
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
    
          <div className="bg-white p-3 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Customer Search */}
         <div className="flex items-center gap-4 flex-1">
            {selectedCustomer ? (
              <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 flex-1">
                <User size={16} className="text-green-600" />
                <span className="font-semibold text-sm">{selectedCustomer.name}</span>
                <span className="flex items-center gap-1 text-gray-600 text-sm">
                  <Phone size={13} />
                  {selectedCustomer.phone}
                </span>
                <span className="flex items-center gap-1 text-gray-600 text-sm">
                  <MapPin size={13} />
                  {selectedCustomer.village}
                </span>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Edit2 size={13} />
                  Change
                </button>
              </div>
            ) : (
              <div className="relative flex-1 max-w-sm">
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

            {/* GST Toggle */}
            <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={isGst}
                onChange={(e) => setIsGst(e.target.checked)}
                className="w-3.5 h-3.5 text-amber-600 border-gray-300 rounded"
              />
              GST
            </label>
          </div>

          {/* Right side - Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
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
            <table className="w-full border-collapse">
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
                <table className="w-full border-collapse">
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
            <div className="bg-white border border-slate-300 rounded-xl shadow-sm p-4 sticky top-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🧾</span>
                  <span>Bill Summary</span>
                </h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${isGst ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-slate-100 text-slate-800 border-slate-300'}`}>
                  {isGst ? 'GST INVOICE' : 'DIRECT BILL'}
                </span>
              </div>

              {/* Breakdown Rows */}
              <div className="space-y-2 text-sm">
                {/* Sub Total */}
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Sub Total</span>
                  <span className="font-bold font-mono text-slate-900 text-base">₹ {Math.round(total).toLocaleString('en-IN')}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-700 font-medium">Discount (₹)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className="w-24 h-8 px-2.5 text-right text-sm font-bold font-mono border border-slate-300 rounded-md focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 outline-none"
                      value={discount || ''}
                      placeholder="0"
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                    {Number(discount) > 0 && (
                      <span className="font-bold font-mono text-rose-600 text-sm">-₹{Math.round(Number(discount)).toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>

                {/* Discounted Subtotal */}
                {Number(discount) > 0 && (
                  <div className="flex justify-between items-center text-slate-600 text-xs pt-0.5">
                    <span>Subtotal After Discount:</span>
                    <span className="font-bold font-mono text-slate-800 text-sm">₹ {Math.round(Number(discountedTotal)).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* GST Details */}
                {isGst && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>CGST (1.5%):</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">₹ {Math.round(gstAmount / 2).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>SGST (1.5%):</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">₹ {Math.round(gstAmount / 2).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* Old Gold Credit */}
                {oldGoldTotalAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-300">
                    <span className="font-bold flex items-center gap-1.5 text-sm">
                      <span>🪙</span>
                      <span>Old Jewel Credit</span>
                    </span>
                    <span className="font-black font-mono text-base">-₹ {Math.round(oldGoldTotalAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Net Payable Banner */}
                <div className="bg-slate-900 text-white p-3.5 rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-300 font-bold">Net Payable</div>
                    <div className="text-xl font-black font-mono mt-0.5">₹ {Math.round(Number(payableAmount)).toLocaleString('en-IN')}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(String(Math.round(Number(payableAmount))))}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer border border-slate-700"
                    title="Auto-fill Full Amount"
                  >
                    Full Pay
                  </button>
                </div>

                {/* Paid Input */}
                <div className="flex justify-between items-center gap-2 pt-1">
                  <span className="text-slate-800 font-bold text-sm">Paid Amount (₹)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className="w-28 h-9 px-2.5 text-right text-sm font-bold font-mono border border-slate-300 rounded-lg focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 outline-none"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Balance Due Status */}
                <div className={`flex justify-between items-center px-3 py-2 rounded-lg border font-bold text-sm ${remainingPayableAmount <= 0 ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-rose-50 text-rose-900 border-rose-300'}`}>
                  <span>{remainingPayableAmount <= 0 ? 'Balance (Cleared)' : 'Balance Due'}</span>
                  <span className="font-mono text-base font-black">
                    {remainingPayableAmount <= 0 ? '₹ 0.00' : `₹ ${Math.round(Number(remainingPayableAmount)).toLocaleString('en-IN')}`}
                  </span>
                </div>

                {/* Notes */}
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Note / Payment Mode (Cash, UPI, Card)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 outline-none bg-slate-50"
                  />
                </div>

                {error && (
                  <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-bold">
                    {error}
                  </div>
                )}

                {/* Submit & Print Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isPending || isPrinting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm h-11 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                >
                  {isPending || isPrinting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                      <span>Saving & Printing Bill...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5 text-amber-400" />
                      <span>Save & Print Invoice</span>
                    </>
                  )}
                </button>
              </div>
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