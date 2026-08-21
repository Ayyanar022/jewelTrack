// 'use client'

// import { Button } from '@/components/ui/button'
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
// import { Label } from '@/components/ui/label'
// import api from '@/lib/axios'
// import { queryClient } from '@/lib/queryClient'
// import { useQuery } from '@tanstack/react-query'
// import { CalendarDays, MapPinHouse, Outdent, Phone, UserRound } from 'lucide-react'
// import React, { use, useState } from 'react'

// const BillDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {

//    const resolvedParams = use(params)
//     const [addPAyment,setAddPayment] = useState('')
//     const [opne,setOpen] = useState(false)

//     // fetch bill data
//     const {data:billDetail }= useQuery({
//         queryKey:['bill-detail-payment-entry'],
//         queryFn: async()=> api.get(`/bill/bill-detail-payment-entry/${resolvedParams.id}`).then(r=>r.data)
//     })

//     // calculate total paid amount
//     const totalPaidAmount = billDetail?.billPaymentsEntry?.reduce((acc:number,cur:any)=> acc+Number(cur.paid_amount) ,0 );
//     const balanceAmount = (billDetail?.payableAmount-totalPaidAmount).toFixed(2)
    
//     // new add payment 
//     const handleSubmitPayment =  async()=>{
//       try{
//         if(addPAyment>balanceAmount ) return alert('enter Correct Amount')
//          await api.post(`/bill/payment/bill-add-entry/${resolvedParams.id}`, {"addPayment" :addPAyment})
//         queryClient.invalidateQueries({queryKey:["bill-detail-payment-entry"]}) 
//         setAddPayment('')
//         setOpen(false)
//       }catch(e){
//         console.log(e)
//       }

//     }

//   return (
//     <div>
// {/* <UserRound size={16} /> */}
//       <div>
//         <section className='flex justify-between'>
//           <div>

//           <h2 className='font-[600]'>Customer Details</h2>
//           <div className='text-base space-y-0.5 mt-1'>
//           <p className='flex  items-center  gap-2'><span ><UserRound size={16}/></span>{billDetail?.customer?.name} </p>
//           <p className='flex  items-center  gap-2'><span><Phone size={16}/></span>{billDetail?.customer?.phone} </p>
//           <p className='flex  items-center  gap-2'><span><MapPinHouse size={16}/></span>{billDetail?.customer?.address} | {billDetail?.customer?.village}  </p>
//           </div>
//           </div>
//           <div>
//           <p className='border px-3 shadow-sm mb-1 font-bold'>{billDetail?.bill_number}  </p>
//           <p className='flex  items-center  gap-2'><span><CalendarDays size={16}/></span>{new Date(billDetail?.created_at).toLocaleDateString('en-IN')}  </p>

//         <Dialog open={opne} onOpenChange={setOpen}>
//           <DialogTrigger asChild >
//           <Button variant='secondary' className='mt-4 border border-black shadow-md text-green-800 font-bold cursor-pointer'> Add Payment</Button>
//           </DialogTrigger>

//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle className='text-center'>Payment Entry</DialogTitle>
//             </DialogHeader>
//             <div className='p-2 mx-auto'>
//             <Label className='mb-1 text-base'>Amount</Label>
//               <input type="number" value={addPAyment ||''}
//               className='outline-none border border-black  h-8 rounded-sm px-4 tracking-wide text-lg'
//               placeholder='74690' 
//               onChange={(e)=>setAddPayment(Number(e.target.value))} />
//               <p className='text-sm text-red-600'>{addPAyment>balanceAmount ? "Invalid Amount" : "" }</p>

//               <Button className='mt-5 ' variant='outline' onClick={handleSubmitPayment}>Add Payment</Button>
//             </div>
//           </DialogContent>

//         </Dialog>

//           </div>
//         </section>

//         <section className='mt-2'>
//           <table className='border border-black border-collapse w-full table-fixed'>
//             <thead>
//               <tr className='border border-black '>
//               <th className="p-1 w-[30px] border border-black  ">NO </th>
//               <th className="w-[100px] border border-black p-1  ">Item</th>
//               <th className="w-[70px] border border-black p-1  " >Metal</th>
//               <th className="w-[60px] border border-black p-1  ">Purity</th>
//               <th className="w-[80px] border border-black p-1  ">Rate/g</th>
//               <th className="w-[60px] border border-black p-1  ">GR.WT</th>
//               <th className="w-[50px] border border-black p-1  ">Stone</th>
//               <th className="w-[60px] border border-black p-1  ">Net.Wt</th>
//               <th className="w-[60px] border border-black p-1  ">WST(G)</th>
//               <th className="w-[60px] border border-black p-1  ">MC</th>
//               <th className="w-[80px] border border-black p-1  ">AMOUNT</th>
//               </tr>
//             </thead>

//             <tbody>
//               {
//                 billDetail && billDetail?.billItem?.map((item:any,i:number)=>(
//                   <tr key={item?.id}>
//                     <td className='border border-black p-1'>{i+1}</td>
//                     <td className='border border-black p-1'>{item?.category?.name}</td>
//                     <td className='border border-black p-1 text-center'>{item?.metal}</td>
//                     <td className='border border-black p-1 text-center'>{item?.purity}</td>
//                     <td className='border border-black p-1 text-right'>{item?.rate}</td>
//                     <td className='border border-black p-1 text-center'>{item?.gross_weight}</td>
//                     <td className='border border-black p-1 text-center'>{item?.stone}</td>
//                     <td className='border border-black p-1 text-center'>{item?.net_weight}</td>
//                     <td className='border border-black p-1 text-center'>{item?.wastage}</td>
//                     <td className='border border-black p-1 text-right'>{item?.making_charge}</td>
//                     <td className='border border-black p-1 text-right'>{item?.amount}</td>
//                   </tr>
//                 ))            
//               }
//             </tbody>

//           </table>

//           <div className='grid grid-cols-10  mt-4 gap-10'>
         
//             <section className='col-span-3'>
//               <h3 className='font-bold '>Payments Paid</h3>
//               <table className='w-full table-fixed '>
//                 <thead>
//                   <tr>
//                   <td className='w-[60px] border border-black text-center p-1'>#</td>
//                   <td className=' border border-black text-center p-1'>Paid Amount</td>
//                   <td className=' border border-black text-center p-1'>Paid Date </td>
//                   </tr>
//                   </thead>

//                   <tbody>
//                     {
//                       billDetail?.billPaymentsEntry?.map((p:any,i:number)=>(
//                         <tr key={p?.id}>
//                           <td className='border border-black text-center p-0.5'>{i+1}</td>
//                           <td className='border border-black text-center p-0.5'>{Number(p.paid_amount).toLocaleString('en-IN')}</td>
//                           <td className='border border-black text-center p-0.5'>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
//                         </tr>
//                       ))
//                     }
//                   </tbody>
//               </table>
//             </section>
           
//             <section className='col-span-4'>
//                <h3 className='font-bold '>Old Jewel Item</h3>
//               <table className='w-full table-fixed '>
//                 <thead>
//                   <tr>
//                   <td className='w-[30px] border border-black text-center p-1 '>#</td>
//                   <td className=' border border-black text-center p-1'>Jewel</td>
//                   <td className='w-[60px] border border-black text-center p-1'>Purity </td>
//                   <td className='w-[80px] border border-black text-center p-1'>Weight </td>
//                   <td className=' border border-black text-center p-1'>Rate </td>
//                   <td className=' border border-black text-center p-1'>Amount </td>
//                   </tr>
//                   </thead>


//                   <tbody>
//                     {
//                       billDetail?.oldGoldEntry?.map((p:any,i:number)=>(
//                         <tr key={p?.id}>
//                           <td className='border border-black text-center p-0.5'>{i+1}</td>
//                           <td className='border border-black text-center p-0.5'>{p.item_name}</td>
//                           <td className='border border-black text-center p-0.5'>{p.purity}</td>
//                           <td className='border border-black text-center p-0.5'>{p.weight}</td>
//                           <td className='border border-black text-center p-0.5'>{Number(p.rate).toLocaleString('en-IN')}</td>
//                           <td className='border border-black text-center p-0.5'>{Number(p.amount).toLocaleString('en-IN')}</td>
//                         </tr>
//                       ))
//                     }
//                   </tbody>
//               </table>
//             </section>


//             <section className='col-span-3 '>
//             <table className=''>
//               <tbody className='border border-black p-1 px-5'>
//                 <tr className='border border-black p-1 px-5'>
//                   <td className='border border-black p-1 px-5'>Total amount</td>
//                   <td className='border border-black p-1 px-5'>{Number(billDetail?.total_amount).toLocaleString('en-IN')}</td>
//                 </tr>
//                 <tr className='border border-black p-1 px-5'>
//                   <td className='border border-black p-1 px-5'>Gst</td>
//                   <td className='border border-black p-1 px-5'>{Number(billDetail?.totalGST).toLocaleString('en-IN')}</td>
//                 </tr>
//                 <tr className='border border-black p-1 px-5'>
//                   <td className='border border-black p-1 px-5'>Payable Amount</td>
//                   <td className='border border-black p-1 px-5 text-gold font-bold tracking-wide text-lg '>{Number(billDetail?.payableAmount).toLocaleString('en-IN')}</td>
//                 </tr>
//                 <tr className='border border-black p-1 px-5'>
//                   <td className='border border-black p-1 px-5'>Total Paid Amount</td>
//                   <td className='border border-black p-1 px-5 text-green-700 font-bold tracking-wide text-lg'>{Number(totalPaidAmount).toLocaleString('en-IN')}</td>
//                 </tr>
//                 <tr className='border border-black p-1 px-5 bg-red-50 '>
//                   <td className='border border-black p-1 px-5'>Balance Amount</td>
//                   <td className='border border-black p-1 px-5 text-red-500 font-bold tracking-wide text-lg '>{Number(balanceAmount).toLocaleString('en-IN')}</td>
//                 </tr>
              
//               </tbody>
//               </table>
//             </section>

//           </div>
//         </section>
        
//       </div>
      
//     </div>
//   )
// }

// export default BillDetailPage



'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import api from '@/lib/axios'
import { queryClient } from '@/lib/queryClient'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, MapPinHouse, Phone, UserRound, Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation';
import React, { use, useState } from 'react'
import { toast } from 'sonner'

const BillDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = use(params)
  const [addPayment, setAddPayment] = useState('')
  const [open, setOpen] = useState(false)

  const router = useRouter();

  // fetch bill data
  const { data: billDetail, isLoading, error } = useQuery({
    queryKey: ['bill-detail-payment-entry', resolvedParams.id],
    queryFn: async () => api.get(`/bill/bill-detail-payment-entry/${resolvedParams.id}`).then(r => r.data)
  })

  // calculate total paid amount
  const totalPaidAmount = billDetail?.billPaymentsEntry?.reduce(
    (acc: number, cur: any) => acc + Number(cur.paid_amount), 
    0
  ) || 0

  // calculation for old jewel amount 
  const oldJewelAmount =  billDetail?.oldGoldEntry?.reduce((total:number, curr:any):number=> curr?.amount+total , 0)

  // console.log("oldJewelAmount",oldJewelAmount)
  const balanceAmount = (billDetail?.payableAmount || 0) - (totalPaidAmount + oldJewelAmount)

  // new add payment 
  const handleSubmitPayment = async () => {
    try {
      const paymentAmount = Number(addPayment)
      
      if (!paymentAmount || paymentAmount <= 0) {
        toast.error('Please enter a valid amount')
        return
      }
      
      if (paymentAmount > balanceAmount) {
        toast.error(`Amount cannot exceed balance: ₹${balanceAmount.toLocaleString('en-IN')}`)
        return
      }

      await api.post(`/bill/payment/bill-add-entry/${resolvedParams.id}`, { 
        addPayment: paymentAmount 
      })
      
      queryClient.invalidateQueries({ queryKey: ['bill-detail-payment-entry'] })
      setAddPayment('')
      setOpen(false)
      toast.success('Payment added successfully!')
    } catch (e: any) {
      console.log(e)
      toast.error(e?.response?.data?.message || 'Failed to add payment')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-600">
        Failed to load bill details
      </div>
    )
  }

  return (
    <div>
      <div>
         <button
        onClick={() => router.push('/dashboard/billing/new?tab=history')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to History
      </button>
        <section className='flex justify-between'>
          <div>
            <h2 className='font-[600]'>Customer Details</h2>
            <div className='text-base space-y-0.5 mt-1'>
              <p className='flex items-center gap-2'>
                <UserRound size={16}/>
                {billDetail?.customer?.name}
              </p>
              <p className='flex items-center gap-2'>
                <Phone size={16}/>
                {billDetail?.customer?.phone}  
              </p>
              <p className='flex items-center gap-2'>
                <MapPinHouse size={16}/>
                {billDetail?.customer?.address} | {billDetail?.customer?.village}
              </p>
            </div>
          </div>
          
          <div>
            <p className='border px-3 shadow-sm mb-1 font-bold'>{billDetail?.bill_number}</p>
            <p className='flex items-center gap-2'>
              <CalendarDays size={16}/>
              {new Date(billDetail?.created_at).toLocaleDateString('en-IN')}
            </p>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant='secondary' className='mt-4 border border-black shadow-md text-green-800 font-bold cursor-pointer'>
                  Add Payment
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle className='text-center'>Payment Entry</DialogTitle>
                </DialogHeader>
                <div className='p-2 mx-auto'>
                  <Label className='mb-1 text-base'>Amount</Label>
                  <input 
                    type="number" 
                    value={addPayment || ''}
                    className='outline-none border border-black h-8 rounded-sm px-4 tracking-wide text-lg'
                    placeholder='Enter amount'
                    onChange={(e) => setAddPayment(e.target.value)}
                  />
                  {Number(addPayment) > balanceAmount && (
                    <p className='text-sm text-red-600'>
                      Max: ₹{balanceAmount.toLocaleString('en-IN')}
                    </p>
                  )}
                  <Button 
                    className='mt-5' 
                    variant='outline' 
                    onClick={handleSubmitPayment}
                    disabled={!addPayment || Number(addPayment) > balanceAmount}
                  >
                    Add Payment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Bill Items Table */}
        <section className='mt-2'>
          <table className='border border-black border-collapse w-full table-fixed'>
            <thead>
              <tr className='border border-black'>
                <th className="p-1 w-[30px] border border-black">#</th>
                <th className="w-[100px] border border-black p-1">Item</th>
                <th className="w-[70px] border border-black p-1">Metal</th>
                <th className="w-[60px] border border-black p-1">Purity</th>
                <th className="w-[80px] border border-black p-1">Rate/g</th>
                <th className="w-[60px] border border-black p-1">GR.WT</th>
                <th className="w-[50px] border border-black p-1">Stone</th>
                <th className="w-[60px] border border-black p-1">Net.Wt</th>
                <th className="w-[60px] border border-black p-1">WST(G)</th>
                <th className="w-[60px] border border-black p-1">MC</th>
                <th className="w-[80px] border border-black p-1">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {billDetail?.billItem?.map((item: any, i: number) => (
                <tr key={item?.id}>
                  <td className='border border-black p-1 text-center'>{i + 1}</td>
                  <td className='border border-black p-1'>{item?.category?.name}</td>
                  <td className='border border-black p-1 text-center'>{item?.metal}</td>
                  <td className='border border-black p-1 text-center'>{item?.purity}</td>
                  <td className='border border-black p-1 text-right'>{item?.rate}</td>
                  <td className='border border-black p-1 text-center'>{item?.gross_weight}</td>
                  <td className='border border-black p-1 text-center'>{item?.stone}</td>
                  <td className='border border-black p-1 text-center'>{item?.net_weight}</td>
                  <td className='border border-black p-1 text-center'>{item?.wastage}</td>
                  <td className='border border-black p-1 text-right'>{item?.making_charge}</td>
                  <td className='border border-black p-1 text-right'>{Number(item?.amount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className='grid grid-cols-10 mt-4 gap-10'>
            {/* Payments Section */}
            <section className='col-span-3'>
              <h3 className='font-bold'>Payments Paid</h3>
              <table className='w-full table-fixed'>
                <thead>
                  <tr>
                    <td className='w-[60px] border border-black text-center p-1'>#</td>
                    <td className='border border-black text-center p-1'>Paid Amount</td>
                    <td className='border border-black text-center p-1'>Paid Date</td>
                  </tr>
                </thead>
                <tbody>
                  {billDetail?.billPaymentsEntry?.map((p: any, i: number) => (
                    <tr key={p?.id}>
                      <td className='border border-black text-center p-0.5'>{i + 1}</td>
                      <td className='border border-black text-center p-0.5'>
                        ₹{Number(p.paid_amount).toLocaleString('en-IN')}
                      </td>
                      <td className='border border-black text-center p-0.5'>
                        {new Date(p.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {(!billDetail?.billPaymentsEntry || billDetail.billPaymentsEntry.length === 0) && (
                    <tr>
                      <td colSpan={3} className='border border-black text-center p-2 text-gray-500'>
                        No payments recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Old Jewel Section */}
            <section className='col-span-4'>
              <h3 className='font-bold'>Old Jewel Item</h3>
              <table className='w-full table-fixed'>
                <thead>
                  <tr>
                    <td className='w-[30px] border border-black text-center p-1'>#</td>
                    <td className='border border-black text-center p-1'>Jewel</td>
                    <td className='w-[60px] border border-black text-center p-1'>Purity</td>
                    <td className='w-[80px] border border-black text-center p-1'>Weight</td>
                    <td className='border border-black text-center p-1'>Rate</td>
                    <td className='border border-black text-center p-1'>Amount</td>
                  </tr>
                </thead>
                <tbody>
                  {billDetail?.oldGoldEntry?.map((p: any, i: number) => (
                    <tr key={p?.id}>
                      <td className='border border-black text-center p-0.5'>{i + 1}</td>
                      <td className='border border-black text-center p-0.5'>{p.item_name}</td>
                      <td className='border border-black text-center p-0.5'>{p.purity}</td>
                      <td className='border border-black text-center p-0.5'>{p.weight}</td>
                      <td className='border border-black text-center p-0.5'>
                        ₹{Number(p.rate).toLocaleString('en-IN')}
                      </td>
                      <td className='border border-black text-center p-0.5'>
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {(!billDetail?.oldGoldEntry || billDetail.oldGoldEntry.length === 0) && (
                    <tr>
                      <td colSpan={6} className='border border-black text-center p-2 text-gray-500'>
                        No old jewelry items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Summary Section */}
            <section className='col-span-3'>
              <table className='w-full'>
                <tbody className='border border-black'>
                  <tr className='border border-black'>
                    <td className='border border-black p-2'>Total amount</td>
                    <td className='border border-black p-2 text-right'>
                      ₹{Number(billDetail?.total_amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className='border border-black'>
                    <td className='border border-black p-2'>GST</td>
                    <td className='border border-black p-2 text-right'>
                      ₹{Number(billDetail?.totalGST).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className='border border-black bg-amber-50'>
                    <td className='border border-black p-2 font-bold'>Payable Amount</td>
                    <td className='border border-black p-2 text-right font-bold text-amber-700 text-lg'>
                      ₹{Number(billDetail?.payableAmount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className='border border-black bg-green-50'>
                    <td className='border border-black p-2 font-bold'>Total Paid</td>
                    <td className='border border-black p-2 text-right font-bold text-green-700 text-lg'>
                      ₹{totalPaidAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className='border border-black bg-green-50'>
                    <td className='border border-black p-2 font-bold'>Total OldJewell Amount</td>
                    <td className='border border-black p-2 text-right font-bold text-green-700 text-lg'>
                      ₹{oldJewelAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className={`border border-black ${balanceAmount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <td className='border border-black p-2 font-bold'>Balance</td>
                    <td className={`border border-black p-2 text-right font-bold text-lg ${balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{balanceAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </section>
      </div>
    </div>
  )
}

export default BillDetailPage