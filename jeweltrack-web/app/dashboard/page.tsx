
'use client'

import api from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"

export default function DashboardPage(){

    const {data : recentRate } = useQuery({
        queryKey:['recent-rate'],
        queryFn : ()=>api.get('/rate/recent-rate').then(r=>r.data)
    })

    const {data:bills} = useQuery({
        queryKey : ['bills'],
        queryFn :()=>api.get('/bill/all').then(r=>r.data)
    })

const stats = [
    { label: "Today's bills", value: bills?.length ?? 0, sub: 'total created' },
      { label: '22K rate', value: recentRate ? `₹${recentRate.rate_22k}` : '—', sub: 'per gram' },
    { label: '18K rate', value: recentRate ? `₹${recentRate.rate_18k}` : '—', sub: 'per gram' },
    { label: 'Silver rate', value: recentRate ? `₹${recentRate.rate_silver}` : '—', sub: 'per gram' },

]

    return(
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-xl font-medium text-foreground" >Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Welcome to JewelTrack
                </p>
            </div>

            {/* {stat cards} */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {
                    stats.map((s)=>(
                        <div key={s.label} className="bg-white border border-gold rounded-xl p-5">
                            <div className="text-xs text-muted-foreground mb-2">{s.label}</div>
                            <div className="text-2xl font-medium text-foreground mb-2">{s.value}</div>
                            <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
                        </div>
                    ))}
            </div>

           {/* Recent bills */}
            <div className="bg-white border border-gold rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gold">
                <h2 className="text-sm font-medium text-foreground">Recent bills</h2>
                </div>
                {bills?.length === 0 || !bills ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No bills yet — create your first bill
                </div>
                ) : (
                <table className="w-full text-sm">
                    <thead className="bg-gold-light">
                    <tr>
                        <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Bill no</th>
                        <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Customer</th>
                        <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Amount</th>
                        <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Type</th>
                    </tr>
                    </thead>
                    <tbody>
                    {bills?.slice(0, 5).map((bill: any) => (
                        <tr key={bill.id} className="border-t border-gold">
                        <td className="px-5 py-3 text-foreground">{bill.bill_number}</td>
                        <td className="px-5 py-3 text-foreground">{bill.customer?.name}</td>
                        <td className="px-5 py-3 text-foreground">₹{bill.total_amount.toLocaleString()}</td>
                        <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${bill.is_gst_bill ? 'bg-green-50 text-green-700' : 'bg-gold-light text-gold-dark'}`}>
                            {bill.is_gst_bill ? 'GST' : 'Normal'}
                            </span>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                )}
            </div>

        </div>
    )
}