'use client'

import { INRFormat } from "@/helper/INR_Formater"
import api from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"
  import { useEffect, useMemo, useState } from "react";



const ItemWiseSales = () => {



const ROWS_PER_PAGE = 5;

const [page, setPage] = useState(1);

const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");

  const {data:itemWiseSaleReport } = useQuery({
    queryKey:['item-wise-sales-report',fromDate,toDate],
    queryFn:()=>api.get(`/reports/item-wise-sales-report?from=${fromDate}&to=${toDate}`).then(r=>r.data)
  })

  const itemWiseSaleCard  = [

    {title:'Total Gold Sold',data:itemWiseSaleReport?.totalBillCount ||0  , },
    {title:'Total Gold 22k Sold',data:itemWiseSaleReport?.totalBillCount ||0  , },
    {title:'Total Gold 18k Sold',data:itemWiseSaleReport?.totalBillCount ||0  , },
    {title:'Total Silver Sold',data:itemWiseSaleReport?.totalBillCount ||0  , },
  ]
  


  const totalPages = Math.ceil( (itemWiseSaleReport?.tableData?.length ?? 0) / ROWS_PER_PAGE );
  const paginatedData = itemWiseSaleReport?.tableData.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  // reset page when filter 
      useEffect(() => {
      setPage(1);
    }, [fromDate, toDate]);

    // console.log("gst report",itemWiseSaleReport)



    console.log(itemWiseSaleReport)


  return (
    <div className="">
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
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 my-5">

        {/* Gold / Silver */}
        {itemWiseSaleReport?.totalGoldAndSilverSale_gm?.map((item: any, i: number) => (
            <div
            key={`metal-${i}`}
            className={`rounded-xl border shadow-sm hover:shadow-lg transition-all duration-200 p-5
            ${
                item.metal === "GOLD"
                ? "bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200"
                : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300"
            }`}
            >
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">
                {item.metal}
                </h2>

                <span className="text-xs bg-white px-2 py-1 rounded-full font-semibold text-slate-600">
                Overall
                </span>
            </div>

            <div className="mt-6 space-y-3">

                <div className="flex justify-between">
                <span className="text-slate-500">Gross Weight</span>
                <span className="font-bold text-slate-800">
                    {item._sum.gross_weight} gm
                </span>
                </div>

                <div className="flex justify-between">
                <span className="text-slate-500">Net Weight</span>
                <span className="font-bold text-blue-700">
                    {item._sum.net_weight} gm
                </span>
                </div>

            </div>
            </div>
        ))}

        {/* Purity */}
        {itemWiseSaleReport?.totalGoldPurityWiseSale_gm?.map((item: any, i: number) => (
            <div
            key={`purity-${i}`}
            className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-lg transition-all duration-200 p-5"
            >
            <div className="flex items-center justify-between">

                <h2 className="text-lg font-bold text-slate-800">
                {item.metal}
                </h2>

                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
                {item.purity}
                </span>

            </div>

            <div className="mt-6 space-y-3">

                <div className="flex justify-between">
                <span className="text-slate-500">Gross Weight</span>
                <span className="font-bold text-slate-800">
                    {item._sum.gross_weight} gm
                </span>
                </div>

                <div className="flex justify-between">
                <span className="text-slate-500">Net Weight</span>
                <span className="font-bold text-green-700">
                    {item._sum.net_weight} gm
                </span>
                </div>

            </div>

            </div>
        ))}

        </section>

        {/* Table data */}
      <section className="bg-white rounded-xl border border-slate-200  shadow-sm overflow-hidden">

        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Daily Item Wise Report
          </h2>
        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead className="bg-slate-100 sticky top-0">

              <tr className="text-slate-700">

                <th className="px-5 py-3 text-center ">#</th>
                <th className="px-5 py-3 text-center">Item Name</th>
                <th className="px-5 py-3 text-center">Purity</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3 text-center">Total Gross Weight (gm)</th>
                <th className="px-5 py-3 text-center">Total Net Weight (gm)</th>
                <th className="px-5 py-3 text-center">Total Sales</th>

              </tr>

            </thead>
                    <tbody>
                    {paginatedData?.map((row: any, i: number) => (
                        <tr
                        key={i}
                        className="border-t border-slate-100 hover:bg-blue-50 even:bg-slate-50"
                        >
                        <td className="px-5 py-3 text-center">
                            {(page - 1) * ROWS_PER_PAGE + i + 1}
                        </td>


                        <td className="px-5 py-3 text-center">
                            {row.name}
                        </td>

                        <td className="px-5 py-3 text-center">
                            {row.purity}
                        </td>

                        <td className="px-5 py-3 text-center">
                            -
                        </td>

                        <td className="px-5 py-3 text-center">
                            {row.total_gross_weight} gm
                        </td>
                        <td className="px-5 py-3 text-center">
                            {row.total_net_weight} gm
                        </td>

                        <td className="px-5 py-3 text-center text-green-700 font-semibold">
                            {INRFormat(row.total_amount)}
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

export default ItemWiseSales
