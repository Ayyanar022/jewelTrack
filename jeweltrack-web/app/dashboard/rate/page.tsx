'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/axios"
import { queryClient } from "@/lib/queryClient"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { table } from "console"
import { useState } from "react"


const page = () => {
  const queryClient = useQueryClient()

  const [form,setForm] = useState({ rate_silver :"" ,  rate_999 :"",  rate_18k :"",rate_22k:""})

  // get latest rate
  const {data:latest} = useQuery({
    queryKey:['recent-rate'],
    queryFn:()=>api.get('/rate/recent-rate').then(r=>r.data)
  })

  // get rate history
  const {data :history} = useQuery({
    queryKey:['rate-history'],
    queryFn:()=>api.get('rate/rate-history').then(r=>r.data)
  })

  const {mutate , isPending} = useMutation({   
    mutationFn: (data: any)=>api.post('/rate',data),
    onSuccess:(res)=>{
      queryClient.invalidateQueries({queryKey:['recent-rate']});
      queryClient.invalidateQueries({queryKey:['rate-history']});
      setForm({ rate_silver :"" ,  rate_999 :"",  rate_18k :"",rate_22k:""});

    },    
  })
 
  // update NEW  rate
  const handleUpdateRate = (e: React.FormEvent)=>{
    e.preventDefault()
    mutate({
      rate_22k :Number (form.rate_22k),
      rate_18k :Number(form.rate_18k),
      rate_silver :Number(form.rate_silver),
      ...(form.rate_999 && {rate_999 :Number(form.rate_999)})
    });
  }

  // auto calculating 18k from 22k
  const handle22kChange = ( val:string)=>{
    const rate22 = Number(val) ;
    const rate18 = Math.round(rate22 * 0.818);
    setForm({...form, rate_22k:val , rate_18k:String(rate18)});
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">Gold Rate</h1>
        <p className="text-sm text-muted-foreground mt-1">Update today's rates — auto fills in billing</p>
      </div>

      {/* Current rate */}
      {
        latest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
               { label: '22K rate', value: latest.rate_22k },
            { label: '18K rate', value: latest.rate_18k },
            { label: 'Silver rate', value: latest.rate_silver },
            { label: '999 rate', value: latest.rate_999 ?? '—' },
            ].map((r:any)=>(
              <div key={r.label} className="bg-white border border-gold rounded-xl p-5">
                                <div className="text-xs text-muted-foreground mb-2">{r.label}</div>
              <div className="text-2xl font-medium text-gold">
                {r.value !== '—' ? `₹${r.value}` : '—'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">per gram</div>
              </div>
            ))}

          </div>
        )
      }


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* "update form" */}
        <div className="bg-white border border-gold rounded-xl p-6">
            <h2 className="text-sm font-medium text-foreground mb-5">
              Update rates
            </h2>
            <form onSubmit={handleUpdateRate} className="flex flex-col gap-4" >
              <div className="grid grid-cols-2 gap-4 ">
                <div className="flex flex-col gap-1.5">
                  <Label>22k rate (₹/g)</Label>
                  <Input 
                  type="number"
                  placeholder="e.g . 6200"
                  value={form.rate_22k}
                  onChange={(e)=>handle22kChange(e.target.value)}
                  />               

                </div>
                 <div className="flex flex-col gap-1.5">
                <Label>18K rate (₹/g)</Label>
                <Input
                  type="number"
                  placeholder="Auto calculated"
                  value={form.rate_18k}
                  onChange={(e) => setForm({ ...form, rate_18k: e.target.value })}
                />
              </div>  
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Silver rate (₹/g)</Label>
                  <Input 
                  type="number"
                  placeholder="e.g. 85"
                  value={form.rate_silver}
                  onChange={(e)=>setForm({...form , rate_silver:e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>999 rate (optional)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 6600"
                      value={form.rate_999}
                      onChange={(e) => setForm({ ...form, rate_999: e.target.value })}
                    />
              </div>

              </div>

          <Button disabled={isPending} className="bg-gold hover:bg-gold/90 text-white" type="submit">
            {isPending ? 'Updating...' : 'update rates '}
          </Button>
      </form>
        </div>

        {/* History */}
        <div className="bg-white border border-gold rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gold">
            <h2 className="text-sm font-medium text-foreground">Rate history</h2>
          </div>
          <div className="overflow-auto max-h-72">
            {!history?.length ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No history yet
              </div>
            ):(      

              <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold bg-gold/5">
              <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground">Date</th>
              <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground">22K</th>
              <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground">18K</th>
              <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground">24K</th>
              <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground">Silver</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0,3).map((r: any) => (
              <tr key={r.id} className="border-b border-gold/30 hover:bg-gold/5 transition-colors">
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3 text-right text-foreground font-medium">₹{r.rate_22k}</td>
                <td className="px-5 py-3 text-right text-foreground font-medium">₹{r.rate_18k}</td>
                <td className="px-5 py-3 text-right text-foreground font-medium">₹{r.rate_999 ?? '—'}</td>
                <td className="px-5 py-3 text-right text-foreground font-medium">₹{r.rate_silver}</td>
              </tr>
            ))}
          </tbody>
        </table>

            ) }

          </div>

        </div>




      </div>
    </div>
  )
}

export default page
