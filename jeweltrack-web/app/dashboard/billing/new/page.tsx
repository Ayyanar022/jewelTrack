'use client'


import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebouce";
import BillTemplate from "@/components/app_component/BillTemplate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillHistory from "@/components/app_component/BillHistory";



interface BillItem {
  item_name: string;
  metal: 'GOLD' | 'SILVER';
  purity: 'K22' | 'K18' | 'K24';
  rate: number;
  gross_weight: number;
  stone:number;
  net_weight: number;
  wastage_pct: number;
  wastage_weight: number;
  making_charge: number;
  amount: number;
}

const calcAmount = (item:BillItem):number=>{
 return Math.max(Math.round(item.rate * (item.net_weight + item.wastage_weight)+item.making_charge),0)
}

const defaultItem = (rate22k =0):BillItem=>({
  amount:0,rate:rate22k , wastage_pct:0,wastage_weight:0, net_weight:0,gross_weight:0,
  item_name:'',making_charge:0,metal:'GOLD',purity:"K22",stone:0
})


const NewBillPage = () => {

  const queryclient = useQueryClient();
  const [items,setItems] = useState<BillItem[]>([defaultItem()])
  const [customerSearch,setCustomerSearch] = useState('');
  const [isGst , setIsGst] = useState(true);
  const [discount,setDiscount] = useState(0);
  const [success,setSuccess] = useState('')
  const [selectedCustomer , setSelectedCustomer] = useState<any>(null) ;
  const [error,setError] = useState('');
  const [notes,setNotes] = useState('');
  const [highlightIndex ,setHighlightIndex] = useState(0); 
  const firstItemRef = useRef<HTMLInputElement>(null)
  const customerRef = useRef<HTMLInputElement>(null);
  const [printBill,setPrintBill] = useState(null);



  const {data :rate} = useQuery({
    queryKey:['recent-rate'],
    queryFn:()=>api.get('rate/recent-rate').then(r=>r.data)
  });

  const {data:categories} = useQuery({
    queryKey :['categories'],
    queryFn :()=>api.get('/jewellery-category').then(r=>r.data)
  });


  useEffect(()=>{
    if(!rate) return

    setItems((prev)=>
    prev.map((item)=>({
      ...item,
      rate: rate.rate_22k ?? 0
                
    }))
    )
  },[rate])


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
        const billData ={
          billNo : res.data.bill_number,
          customer:selectedCustomer,
          items,
          total,
          gstAmount,
          payableAmount,
          discount,
          isGst,
        }

        setPrintBill(billData) // for print

        setTimeout(() => {
          window.print()// trigger print          
        }, 200);

        queryclient.invalidateQueries({queryKey:['bills']});
        setSuccess(`Bill ${res.data.bill_number} created successfully!`);

        setItems([]);
        setSelectedCustomer(null);
        setDiscount(0);
        setNotes('');
        setIsGst(false);   
        addItem()   

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

        if(field === 'gross_weight' || field === 'stone'){
          item.net_weight = Math.max(item.gross_weight-item.stone, 0)
        }

        if (field === 'wastage_pct') {
        item.wastage_weight = item.net_weight > 0
        ? parseFloat(((item.wastage_pct / 100) * item.net_weight).toFixed(3)) : 0;
        }

        if (field === 'wastage_weight') {
          item.wastage_pct = item.net_weight > 0
            ? parseFloat(((item.wastage_weight / item.net_weight) * 100).toFixed(2)) : 0;
        }

        if(field === 'net_weight' && item.wastage_pct>0){          
          item.wastage_weight = parseFloat(((item.wastage_pct /100 )* value).toFixed(3))
        }    

        // if net weight changes 
        if(field === "gross_weight" || field==='stone'){
          if(item.wastage_pct>0){
            item.wastage_weight= parseFloat(
              ((item.wastage_pct /100) * item.net_weight).toFixed(3)
            )
          }
        }

        item.amount = calcAmount(item);
        updated[index] = item ; 
        setItems(updated)

        // Auto add row 
        if(field ==='making_charge' && index === items.length-1){
          addItem()
        }
        }

    const selectCategory = (index:number , catId:string)=>{
      console.log(catId)
      const cat = categories?.find((c:any)=>c.id===catId)
      if(!cat) return;
      const updated = [...items];
      const item = {...updated[index]}
      item.item_name = cat.name;
      item.category_id = cat.id;
      item.wastage_pct = cat.default_wastage ??0 ;
      item.wastage_weight =  item.wastage_pct >0 
            ? parseFloat( (item.net_weight * item.wastage_pct /100).toFixed(2)) : 0 ;
      item.making_charge = cat.default_making_charge  ?? 0 ;
      item.amount = calcAmount(item)
      updated[index] = item;
      setItems(updated)

    }


    const addItem = ()=>{
      const newItem = defaultItem(rate?.rate_22k ?? 0)
      setItems(prev => [...prev , newItem])
    }

  

    const removeItem = (index:number)=>{
      setItems(items.filter((_,i)=>i !==index))
    }

    const total = Math.max(
      items.reduce((sum,i)=>sum+i.amount ,0)-discount , 0
    )

    const discountedTotal = Math.max((total - discount) ,0 )
    const gstAmount = Math.max(discountedTotal *(3/100),0)  
    const payableAmount = discountedTotal + gstAmount

    const handleSubmit = ()=>{
      setError('');
      if(!selectedCustomer) {setError('Please select a customer ') ; return}
      if(items.length===0) { setError('Add at leaset on eitem'); return}

      mutate({
      customer_id: selectedCustomer.id,
      is_gst_bill: isGst,
      discount,
      notes,
      billItem: items.filter(i=>i.amount>0).map(item => (
        {
        item_name: item.item_name,
        metal: item.metal,
        purity: item.metal === 'GOLD' ? item.purity : undefined,
        rate: item.rate,
        gross_weight : item.gross_weight,
        net_weight: item.net_weight,
        wastage: item.wastage_weight,
        stone:item.stone,
        making_charge: item.making_charge,
        amount: item.amount,

      })),
    });

      

    }


    // UX enhancement -----------------------
    // 1. click enter -> move next cell
      const moveNext = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key !=='Enter') return ;

        e.preventDefault();

        const inputs = Array.from(
          document.querySelectorAll('input,select')
        ) as HTMLElement[]

        const index = inputs.indexOf(e.currentTarget);
        if(index > -1 && index < inputs.length -1){
          inputs[index+1 ].focus()
        }
    };

    // 2.Auto add row - inside updateItem

    // 3. first time focus 
    useEffect(()=>{
      const t = setTimeout(()=>{
        customerRef.current?.focus();
      },100)

      return ()=>clearTimeout(t);
    },[])


    //-----------------------------------
// console.log("categories",categories)

    
  return (   
    

  <Tabs defaultValue="new" className="-mt-4">

    <TabsList className="inline-flex h-auto p-1 ml-auto">
      <TabsTrigger value="new">New Bill</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger>
    </TabsList>

      <TabsContent value="new">

            <div className=" flex flex-col -mt-7">
      <div className="flex mb-1 items-center justify-between gap-3 w-full ">
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
          <input ref={ customerRef }
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
        
          <div className="absolute w-full  bg-white border mt-1 z-30">
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
{/*     
       <div className="px-2 py-1 text-sm text-blue-600 cursor-pointer hover:bg-gray-100">
        + Add New Customer
       </div> */}
   

      </div>

      <div className="flex-1 bg-white border rounded-md overflow-hidden min-h-[220px]">
        <table className="w-full table-fixed ">
          <thead className="bg-gray-100 sticky top-0 z-10 ">
            <tr >
              <th className="p-2 w-[30px] bg-green-200">NO </th>
              <th className="w-[100px] bg-yellow-200">Item</th>
              <th className="w-[70px] bg-pink-200" >Metal</th>
              <th className="w-[60px] bg-yellow-200">Purity</th>
              <th className="w-[80px] bg-green-200">Rate/g</th>
              <th className="w-[60px] bg-yellow-200">GR.WT</th>
              <th className="w-[50px] bg-blue-200">Stone</th>
              <th className="w-[60px] bg-orange-200">Net.Wt</th>
              <th className="w-[60px] bg-yellow-200">WST%</th>
              <th className="w-[60px] bg-red-200">WST(G)</th>
              <th className="w-[60px] bg-yellow-200">MC</th>
              <th className="w-[80px] bg-yellow-200">AMOUNT</th>
              <th className="w-[40px] bg-rose-200">Act</th>
               </tr>
          </thead>
          <tbody>
            {
              items.map((item,i)=>(
                <tr key={i+item.item_name} className="border-b border-gray-200 odd:bg-white even:bg-gray-50 
                 hover:bg-blue-50 focus-within:bg-blue-50 ">
                  <td className="w-full px-1.5 py-1.5 align-middle text-center">{i+1}</td>
                   <td className="px-1.5 py-1.5 align-middle">
                    <select 
                     onKeyDown={moveNext} 
                    ref={firstItemRef}
                   value={item.category_id || ""}
                    // onChange={(e)=>updateItem(i,'item_name',e.target.value)}
                    onChange={(e)=>selectCategory(i,e.target.value)}
                    className="w-full h-7"
                    >
                      <option>Choose item..</option>
                      {categories?.map((cat:any,i:number)=>(
                        <option key={i+cat?.name} value={cat.id} >{cat?.name}</option>
                      ))}
                    </select>
                  </td>

                 <td className="px-1.5 py-1.5 align-middle">
                    <select value={item?.metal}  onKeyDown={moveNext} 
                    onChange={(e)=>updateItem(i,'metal',e.target.value)}
                    className="h-7 w-full "
                    >
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                    </select>
                  </td>

                   <td className="px-1.5 py-1.5 align-middle">
                    {item.metal ==="GOLD"  &&(
                    <select  onKeyDown={moveNext} 
                      value={item.purity}
                      onChange={(e)=>updateItem(i,'purity',e.target.value)}
                      className="h-7 w-full"
                    >
                      <option value="K22">22K</option>
                      <option value="K18">18K</option>
                      {/* <option value="K24"></option> */}
                    </select>
                    )   }
                  </td>

                  <td className="px-1.5 py-1.5 align-middle text-right">
                    <input type="text" value={item.rate || ""} onKeyDown={moveNext} 
                    onChange={(e)=>updateItem(i,'rate',Number(e.target.value))}
                    className="h-7  text-right  w-full bg-transparent outline-none px-1.5 py-1.5 text-base focus:bg-white focus:ring-1 focus:ring-gold-dark "
                    />
                  </td>

                   <td className="px-1.5 py-1.5 align-middle text-right">
                    <input  onKeyDown={moveNext} type="text" value={item.gross_weight || ''} 
                    onChange={(e)=>updateItem(i,'gross_weight',Number(e.target.value))}
                    className="h-7  w-full bg-transparent  outline-none px-1.5 py-1.5 text-base focus:bg-white focus:ring-1 focus:ring-gold-dark "
                    />
                  </td>

                 <td className="px-1.5 py-1.5 align-middle text-right">
                    <input  onKeyDown={moveNext} type="text" value={item.stone || 0}
                    onChange={(e)=>updateItem(i,'stone',Number(e.target.value))}
                    className="h-7  w-full bg-transparent outline-none px-1.5 py-1.5 text-base focus:bg-white focus:ring-1 focus:ring-gold-dark  "
                    />
                  </td>
                   <td className="px-1.5 py-1.5 align-middle text-right">
                    <input  onKeyDown={moveNext} type="text" value={item.net_weight || ''} 
                    readOnly
                    // onChange={(e)=>updateItem(i,'net_weight',Number(e.target.value))}
                    className="h-7  w-full bg-transparent outline-none px-1.5 py-1.5 text-base focus:bg-white focus:ring-1 focus:ring-gold-dark "
                    />
                  </td>

                   <td className="px-1.5 py-1.5 align-middle text-right">
                    <input  onKeyDown={moveNext} type="text" 
                    value={item.wastage_pct}
                    onChange={(e)=>updateItem(i,'wastage_pct',Number(e.target.value))}
                    className="h-7 w-full bg-transparent outline-none px-1.5 py-1.5 text-base focus:bg-white focus:ring-1 focus:ring-gold-dark "
                    />
                  </td>

                   <td className="px-1.5 py-1.5 align-middle text-right">
                    <input  onKeyDown={moveNext} type="text" value={item.wastage_weight}
                    onChange={(e)=>updateItem(i,'wastage_weight',Number(e.target.value))}
                    className="h-7   w-full bg-transparent outline-none px-1.5 py-1.5 text-base focus:bg-white focus:ring-1 focus:ring-gold-dark "
                    />
                  </td>

                   <td className="px-1.5 py-1.5 align-middle text-right">
                    <input  onKeyDown={moveNext} type="text" value={item.making_charge ||'  '} 
                    onChange={(e)=>updateItem(i,'making_charge',Number(e.target.value))}
                    className="h-7  w-full bg-transparent outline-none px-1.5 py-1.5 text-base focus:bg-white focus:ring-1 focus:ring-gold-dark "
                    onFocus={()=>{
                      if(items.length ===0) return ;
                      const lastRow = items[items.length-1];
                      if(lastRow.amount> 0){
                        addItem()
                      }
                    }}
                    />   
                  </td>

               

                    <td className=" font-medium  w-full px-1.5 py-1.5 align-middle text-right  ">
                      <span className="font-[600] text-green-700 tracking-wide">₹ {Number(item.amount||0).toLocaleString('en-IN')}</span>                       
                    </td>

                    <td className=" text-center w-fll px-1.5 py-1.5 align-middle">
                      <button onClick={()=>removeItem(i)} className="text-red-500 px-1.5 outline-none hover:text-red-700 hover:font-bold transition-all cursor-pointer focus:font-bold focus:text-red-700 ">
                        ✕
                      </button>
                    </td>

                </tr>
              ))
            }
          </tbody>

        </table>
      </div>

      <div className="w-1/3  bg-gray-50 p-2 px-5 my-2 ml-auto ">
            <div className="flex justify-between ">
              <span className="text-slate-600"> SubTotal</span>
             <span>₹ {Math.round(Number(total)).toLocaleString('en-IN')}  </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600"> discount</span>
                 <input className=" outline-none w-20 ring-1 ring-gold px-2" type="number" value={discount||''}  onChange={(e)=>setDiscount(Number(e.target.value))} />
              <span>₹ {Math.round(Number(discount)).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600"> discounted Total</span>           
              <span>₹ {Math.round(Number(discountedTotal)).toLocaleString('en-IN')}</span>
            </div>

            <div className="h-0.5 bg-gold-light my-1">
            
            </div>

            {isGst && 

          <div>
          <div className="flex justify-between">
              <span className="text-slate-600"> CGST</span>
              <span className="text-slate-600">1.5%</span>
              <span>₹ {Math.round(gstAmount/2).toLocaleString('en-IN')}</span>
            </div>
          <div className="flex justify-between">
              <span className="text-slate-600"> SGST</span>
              <span className="text-slate-600">1.5%</span>
              <span> ₹ {Math.round(gstAmount/2).toLocaleString('en-IN')}</span>
            </div>
            </div>
            
            }
            
          <div className="h-0.5 bg-gold-light my-1">
            
            </div>

            <div>              
               <div className="flex justify-between">
                <span>Payable Amount </span>
                <span className="text-2xl text-red-600 font-bold"><span className="text-lg">₹ </span>{Math.round(payableAmount).toLocaleString('en-IN')}  </span>
              </div>

            </div>
               <div className="text-gold-dark border border-gold-dark text-center mt-3">
              <button onClick={handleSubmit} className="w-full p-0.5">
                Print Bill
              </button>
            </div>
      </div>
  
    </div>

    {printBill && (
      <div className="print-area">
        <BillTemplate data={printBill} />
      </div>
    )}
      </TabsContent>

      <TabsContent value="history">

        <BillHistory />
      </TabsContent>

  </Tabs>

  )
}

export default NewBillPage






