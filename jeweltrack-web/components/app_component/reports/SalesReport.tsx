'use client'

import { INRFormat } from "@/helper/INR_Formater"
import api from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"
  import { useEffect, useMemo, useState } from "react";



const SalesReport = () => {



const ROWS_PER_PAGE = 5;

const [page, setPage] = useState(1);

const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");

  const {data:billStats } = useQuery({
    queryKey:['sale-stats',fromDate,toDate],
    queryFn:()=>api.get(`/reports/sale-stats?from=${fromDate}&to=${toDate}`).then(r=>r.data)
  })

  const billStatsData = [
    {title:'Sale Amount',data:INRFormat(billStats?.totalSalesAmount._sum.payableAmount ||0)},
    {title:'Gst Amount',data:INRFormat(billStats?.totalGSTAmount._sum.totalGST ||0), },
    {title:'Bill Count',data:billStats?.totalBillCount ||0  , },
    {title:'Gst bill',data:billStats?.totalGstBillCount ||0, },
    {title:'Non gst bill',data:billStats?.totalNonGstBillCount ||0, },
  ]
  


  const totalPages = Math.ceil( (billStats?.tableData?.length ?? 0) / ROWS_PER_PAGE );
  const paginatedData = billStats?.tableData.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  // reset page when filter 
      useEffect(() => {
      setPage(1);
    }, [fromDate, toDate]);


  return (
    <div>
        {/* Filter */}
        <section className="bg-white rounded-xl border p-5 mb-6">

        <div className="flex flex-wrap gap-4 items-end">

            <div>
                <label className="text-sm text-gray-500 block mb-1">
                    From
                </label>

                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                />
            </div>

            <div>
                <label className="text-sm text-gray-500 block mb-1">
                    To
                </label>

                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                />
            </div>

            <button
                onClick={() => {
                    setFromDate("");
                    setToDate("");
                }}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300"
            >
                Clear
            </button>

        </div>

    </section>



        {/* Stats */}
{/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 gap-x-8 my-5">

        {billStatsData.map((item, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5"
          >
            <h2 className="text-2xl font-bold text-slate-900">
              {item.data} 
            </h2>

            <p className="mt-2 text-sm text-slate-500 font-medium">
              {item.title}
            </p>
          </div>
        ))}

        
        {billStats?.totalGramSaleGoldAndSilver?.map((item: any, i: number) => (
          <div
            key={i}
            className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5"
          >
            <h2 className="text-2xl font-bold text-amber-700">
              {item._sum.net_weight} <span className="text-sm">gm</span>
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-600">
              {item.metal} • {item.purity}
            </p>
          </div>
        ))}

      </section>

        {/* Table data */}
      <section className="bg-white rounded-xl border border-slate-200 max-w-[700px]  shadow-sm overflow-hidden">

        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Daily Sales Summary
          </h2>
        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead className="bg-slate-100 sticky top-0">

              <tr className="text-slate-700">

                <th className="px-5 py-3 text-center ">#</th>
                <th className="px-5 py-3 text-center">Date</th>
                <th className="px-5 py-3 text-center">Bills Count</th>
                <th className="px-5 py-3 text-center">Sales</th>
                <th className="px-5 py-3 text-center">GST</th>

              </tr>

            </thead>

            <tbody>

              {paginatedData?.map((row: any, i: number) => (

                <tr
                  key={row.date + i}
                  className="border-t border-slate-100 hover:bg-blue-50 transition-colors even:bg-slate-50"
                >

                  <td className="px-5 py-3 font-medium text-center">
                    {(page - 1) * ROWS_PER_PAGE + i + 1}
                  </td>

                  <td className="px-5 py-3 text-center">
                    {row.date.split("T")[0]}
                  </td>

                  <td className="px-5 py-3 text-center font-medium">
                    {row.billcount}
                  </td>

                  <td className="px-5 py-3 text-center font-semibold text-green-700">
                    {INRFormat(row.totalsaleamount)}
                  </td>

                  <td className="px-5 py-3  text-blue-700 font-medium text-center">
                    {INRFormat(row.totalgst)}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
         
          <div className="flex items-center justify-between px-5 py-4 border-t">

      <span className="text-sm text-gray-500">
          Page {page} of {totalPages || 1}
      </span>

      <div className="flex gap-2">

          <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 border rounded-lg disabled:opacity-40"
          >
              Previous
          </button>

          <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border rounded-lg disabled:opacity-40"
          >
              Next
          </button>

      </div>

          </div>

      </section>
      
    </div>
  )
}

export default SalesReport
