'use client'

import BillTemplate from "@/components/app_component/BillTemplate"
import api from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"
import { use, useEffect, useRef } from "react"

export default function PrintBillPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const printed = useRef(false)

  const { data } = useQuery({
    queryKey: ['bill', resolvedParams.id],
    queryFn: () => api.get(`/bill/${resolvedParams.id}`).then(r => r.data)
  })

  console.log("data bill",data)

useEffect(() => {
  if (!data) return
  if (printed.current) return
  printed.current = true

  window.addEventListener('afterprint', () => window.close())
  window.print()
}, [data])

  if (!data) return <p style={{ padding: 20, fontFamily: 'sans-serif' }}>Preparing bill...</p>

  return (
    <div className="print-page">
      <BillTemplate data={data} />
    </div>
  )
}