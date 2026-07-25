'use client'

import { Card } from "@/components/ui/card"
import { INRFormat } from "@/helper/INR_Formater"
import api from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"



const SalesReport = () => {

  const {data:billStats } = useQuery({
    queryKey:['billState'],
    queryFn:()=>api.get(`/reports/sale-stats`).then(r=>r.data)
  })

  const billStatsData = [
    {title:'Sale Amount',data:INRFormat(billStats?.totalSalesAmount._sum.payableAmount ||0)},
    {title:'Gst Amount',data:INRFormat(billStats?.totalGSTAmount._sum.totalGST ||0), },
    {title:'Bill Count',data:billStats?.totalBillCount ||0  , },
    {title:'Gst bill',data:billStats?.totalGstBillCount ||0, },
    {title:'Non gst bill',data:billStats?.totalNonGstBillCount ||0, },
  ]
  

  return (
    <div>
        {/* Filter */}
        <section>
            Filter

        </section>



        {/* Stats */}
        <section className="grid  grid-cols-6 gap-x-7 gap-y-4 p-3 my-3   flex-wrap ">
          {  billStatsData.map((item,i)=>(
            <div className=" border border-blue-200 p-3 px-4 rounded-md  " key={i+"stats2"} >
                <span className="text-xl font-bold">{ item.data}</span>
                <p className="text-sm font-bold text-slate-600">{item.title}</p>
            </div>
          )) }

              <div className=" border border-blue-200 p-3 px-4 rounded-md  " >
                <span className="text-xl font-bold">{billStats?.totalGramSaleGoldAndSilver[0]._sum.net_weight}</span>
                <p className="text-sm font-bold text-slate-600">{billStats?.totalGramSaleGoldAndSilver[0].metal } - {billStats?.totalGramSaleGoldAndSilver[0].purity}</p>
            </div>
              <div className=" border border-blue-200 p-3 px-4 rounded-md  " >
                <span className="text-xl font-bold">{billStats?.totalGramSaleGoldAndSilver[1]._sum.net_weight}</span>
                <p className="text-sm font-bold text-slate-600">{billStats?.totalGramSaleGoldAndSilver[1].metal } - {billStats?.totalGramSaleGoldAndSilver[1].purity}</p>
            </div>
            
        </section>

        {/* Table data */}
        <section>
            table data
        </section>
      
    </div>
  )
}

export default SalesReport
