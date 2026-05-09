'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import api from '@/lib/axios'
import { queryClient } from '@/lib/queryClient'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, MapPinHouse, Outdent, Phone, UserRound } from 'lucide-react'
import React, { use, useState } from 'react'

const BillDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {

   const resolvedParams = use(params)
    const [addPAyment,setAddPayment] = useState('')
    const [opne,setOpen] = useState(false)

    // fetch bill data
    const {data:billDetail }= useQuery({
        queryKey:['bill-detail-payment-entry'],
        queryFn: async()=> api.get(`/bill/bill-detail-payment-entry/${resolvedParams.id}`).then(r=>r.data)
    })

    // calculate total paid amount
    const totalPaidAmount = billDetail?.billPaymentsEntry?.reduce((acc:number,cur:any)=> acc+Number(cur.paid_amount) ,0 );
    const balanceAmount = (billDetail?.payableAmount-totalPaidAmount).toFixed(2)
    
    // new add payment 
    const handleSubmitPayment =  async()=>{
      try{
        if(addPAyment>balanceAmount ) return alert('enter Correct Amount')
         await api.post(`/bill/payment/bill-add-entry/${resolvedParams.id}`, {"addPayment" :addPAyment})
        queryClient.invalidateQueries({queryKey:["bill-detail-payment-entry"]}) 
        setOpen(false)
      }catch(e){
        console.log(e)
      }

    }

  return (
    <div>
{/* <UserRound size={16} /> */}
      <div>
        <section className='flex justify-between'>
          <div>

          <h2 className='font-[600]'>Customer Details</h2>
          <div className='text-base space-y-0.5 mt-1'>
          <p className='flex  items-center  gap-2'><span ><UserRound size={16}/></span>{billDetail?.customer?.name} </p>
          <p className='flex  items-center  gap-2'><span><Phone size={16}/></span>{billDetail?.customer?.phone} </p>
          <p className='flex  items-center  gap-2'><span><MapPinHouse size={16}/></span>{billDetail?.customer?.address} | {billDetail?.customer?.village}  </p>
          </div>
          </div>
          <div>
          <p className='border px-3 shadow-sm mb-1 font-bold'>{billDetail?.bill_number}  </p>
          <p className='flex  items-center  gap-2'><span><CalendarDays size={16}/></span>{new Date(billDetail?.created_at).toLocaleDateString('en-IN')}  </p>

        <Dialog open={opne} onOpenChange={setOpen}>
          <DialogTrigger>
          <Button variant='secondary' className='mt-4 border border-black shadow-md text-green-800 font-bold cursor-pointer'> Add Payment</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle className='text-center'>Payment Entry</DialogTitle>
            </DialogHeader>
            <div className='p-2 mx-auto'>
            <Label className='mb-1 text-base'>Amount</Label>
              <input type="number" value={addPAyment ||''}
              className='outline-none border border-black  h-8 rounded-sm px-4 tracking-wide text-lg'
              placeholder='74690' 
              onChange={(e)=>setAddPayment(Number(e.target.value))} />
              <p className='text-sm text-red-600'>{addPAyment>balanceAmount ? "Invalid Amount" : "" }</p>

              <Button className='mt-5 ' variant='outline' onClick={handleSubmitPayment}>Add Payment</Button>
            </div>
          </DialogContent>

        </Dialog>

          </div>
        </section>

        <section className='mt-2'>
          <table className='border border-black border-collapse w-full table-fixed'>
            <thead>
              <tr className='border border-black '>
              <th className="p-1 w-[30px] border border-black  ">NO </th>
              <th className="w-[100px] border border-black p-1  ">Item</th>
              <th className="w-[70px] border border-black p-1  " >Metal</th>
              <th className="w-[60px] border border-black p-1  ">Purity</th>
              <th className="w-[80px] border border-black p-1  ">Rate/g</th>
              <th className="w-[60px] border border-black p-1  ">GR.WT</th>
              <th className="w-[50px] border border-black p-1  ">Stone</th>
              <th className="w-[60px] border border-black p-1  ">Net.Wt</th>
              <th className="w-[60px] border border-black p-1  ">WST(G)</th>
              <th className="w-[60px] border border-black p-1  ">MC</th>
              <th className="w-[80px] border border-black p-1  ">AMOUNT</th>
              </tr>
            </thead>

            <tbody>
              {
                billDetail && billDetail?.billItem?.map((item:any,i:number)=>(
                  <tr key={item?.id}>
                    <td className='border border-black p-1'>{i+1}</td>
                    <td className='border border-black p-1'>{item?.category?.name}</td>
                    <td className='border border-black p-1 text-center'>{item?.metal}</td>
                    <td className='border border-black p-1 text-center'>{item?.purity}</td>
                    <td className='border border-black p-1 text-right'>{item?.rate}</td>
                    <td className='border border-black p-1 text-center'>{item?.gross_weight}</td>
                    <td className='border border-black p-1 text-center'>{item?.stone}</td>
                    <td className='border border-black p-1 text-center'>{item?.net_weight}</td>
                    <td className='border border-black p-1 text-center'>{item?.wastage}</td>
                    <td className='border border-black p-1 text-right'>{item?.making_charge}</td>
                    <td className='border border-black p-1 text-right'>{item?.amount}</td>
                  </tr>
                ))            
              }
            </tbody>

          </table>

          <div className='flex gap-8 mt-4'>
            <section className='flex-1'>

              <table className='w-full table-fixed max-w-3/5'>
                <thead>
                  <tr>
                  <td className='w-[60px] border border-black text-center p-1'>#</td>
                  <td className=' border border-black text-center p-1'>Paid Amount</td>
                  <td className=' border border-black text-center p-1'>Paid Date </td>
                  </tr>
                  </thead>

                  <tbody>
                    {
                      billDetail?.billPaymentsEntry?.map((p:any,i:number)=>(
                        <tr key={p?.id}>
                          <td className='border border-black text-center p-0.5'>{i+1}</td>
                          <td className='border border-black text-center p-0.5'>{p.paid_amount}</td>
                          <td className='border border-black text-center p-0.5'>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))
                    }
                  </tbody>
              </table>


            </section>
            <section className='w-[1/4]'>
            <table className=''>
              <tbody className='border border-black p-1 px-5'>
                <tr className='border border-black p-1 px-5'>
                  <td className='border border-black p-1 px-5'>Total amount</td>
                  <td className='border border-black p-1 px-5'>{billDetail?.total_amount}</td>
                </tr>
                <tr className='border border-black p-1 px-5'>
                  <td className='border border-black p-1 px-5'>Gst</td>
                  <td className='border border-black p-1 px-5'>{billDetail?.totalGST}</td>
                </tr>
                <tr className='border border-black p-1 px-5'>
                  <td className='border border-black p-1 px-5'>Payable Amount</td>
                  <td className='border border-black p-1 px-5 text-gold font-bold tracking-wide text-lg '>{billDetail?.payableAmount}</td>
                </tr>
                <tr className='border border-black p-1 px-5'>
                  <td className='border border-black p-1 px-5'>Total Paid Amount</td>
                  <td className='border border-black p-1 px-5 text-green-700 font-bold tracking-wide text-lg'>{totalPaidAmount}</td>
                </tr>
                <tr className='border border-black p-1 px-5 bg-red-50 '>
                  <td className='border border-black p-1 px-5'>Balance Amount</td>
                  <td className='border border-black p-1 px-5 text-red-500 font-bold tracking-wide text-lg '>{balanceAmount}</td>
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
