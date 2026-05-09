'use client'

import api from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, MapPinHouse, Phone, UserRound } from 'lucide-react'
import React, { use } from 'react'

const BillDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {

   const resolvedParams = use(params)
  //  console.log("resolvedParams",resolvedParams.id)

    const {data:billDetail }= useQuery({
        queryKey:['bill-detail-payment-entry'],
        queryFn: async()=> api.get(`/bill/bill-detail-payment-entry/${resolvedParams.id}`).then(r=>r.data)
    })

    console.log("billDetail",billDetail)

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

          <div className='flex gap-2 mt-4'>
            <section className='flex-1'>
              

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
                  <td className='border border-black p-1 px-5'>{billDetail?.payableAmount}</td>
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
