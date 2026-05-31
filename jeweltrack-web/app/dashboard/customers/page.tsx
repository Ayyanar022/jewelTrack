
'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, PenIcon, View } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";





export default function CustomersPage(){

  const router = useRouter()

  const queryClient = useQueryClient();
  const [ form ,setForm] = useState({ name: '', phone: '', village: '', address: '' })
  const [search, setSearch] = useState('');
  const [showForm ,setShowForm] = useState(false);
  const [error, setError] = useState('')
  const [editUser , setEditUser] = useState('')

  const {data:customer} = useQuery({
      queryKey:['customers',search],
      queryFn:()=>search
        ? api.get(`/customer/search?q=${search}`).then(r=>r.data)
        : api.get(`/customer/all`).then(r=>r.data),
        gcTime: 5 * 60 * 1000, 
  });

  // create user 
  const {mutate , isPending} = useMutation({
    mutationFn : (data:any) =>api.post('/customer',data),
    onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:['customers']});
      setForm({ name: '', phone: '', village: '', address: '', });
      setShowForm(false);
    },
    onError:(e:any)=>{
      setError(e?.response?.data?.message || 'Something went wrong')
    }

  });

  // update user 
  const {mutate :updateUserMutate , isPending:UpdateUserLoading} = useMutation({
    mutationFn : ({id ,data}:any)=>api.put(`/customer/${id}`,data),
    onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:['customers']})
       setForm({ name: '', phone: '', village: '', address: '', });
        setShowForm(false);
        setEditUser('')
    },
    onError:(e:any)=>{
      setError(e?.response?.data?.message || 'Something went wrong'  )
    }
  })


  const handleSubmit = (e :React.FormEvent)=>{
    e.preventDefault();
    setError('');
    if(editUser ===''){
      mutate(form);
    }else{
      updateUserMutate({id:editUser , data:form})
    }
    setEditUser('')
  }



  // edit User 
  const handleEdit = (id:string)=>{
    const user = customer?.find((f:any)=>f.id ===id)
    if(user){
      setForm(user)
      setShowForm(true)
      setEditUser(id)
    }

  }

  const resetForm = ()=>{
    setShowForm(false) 
    setEditUser('');
    setForm({ name: '', phone: '', village: '', address: '', });
  }
  



return (
  <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between">
       <div>
          <h1 className="text-xl font-medium text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your customer profiles</p>
        </div>

        <Button
        className="bg-gold hover:bg-gold/90 text-white"
        onClick={()=>setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New customer'}
        </Button>
    </div>

    {/* create forms */}
    {showForm && (
      <div className="bg-white border border-gold rounded-xl p-6">
        <h2 className="text-sm font-medium text-foreground mb-4">New customer</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-1.5">
                <Label>Name</Label>
                <Input placeholder="Customer name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
               <div className="flex flex-col gap-1.5">
                <Label>Phone</Label>
                <Input placeholder="10 digit number" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

             <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Village / Area</Label>
                <Input placeholder="e.g. Erode" value={form.village}
                  onChange={(e) => setForm({ ...form, village: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Address (optional)</Label>
                <Input placeholder="Full address" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
             {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={isPending} className="bg-gold hover:bg-gold/90 text-white">
                {isPending ? "Saving...": "Save customer"}
              </Button>

              <Button type="button" variant='outline' onClick={resetForm} >
                Cancel
              </Button>
            </div>          

          </form>
      </div>
    ) }


    {/* Search */}
    <Input 
    placeholder="Search by name, phone or village..."
    value={search}
    onChange={(e)=>setSearch(e.target.value)}
    className="max-w-sm"
    />

    {/* Customer list */}
    <div className="bg-white border border-gold rounded-xl overflow-hidden  ">
      <div className="px-5 py-2 border-b border-gold">
        <h2 className="text-sm font-medium text-foreground">
          Search by name, phone or village..."
        </h2>
      </div>

      {!customer?.length ? (
             <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No customers yet
          </div>
      ):(

         <table className="w-full text-sm">
            <thead className="bg-gold-light">
              <tr>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Name</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Phone</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Village</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Address</th>
                <th className=" px-5 py-3 text-xs text-muted-foreground font-medium">Address</th>
              </tr>
            </thead>
            <tbody>
              {customer.map((c: any) => (
                <tr key={c.id} className="border-t border-gold hover:bg-gold-light/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.village}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.address || '—'}</td>
                  <td className="px-5 py-3 text-muted-foreground flex justify-around">
                    <button onClick={()=>handleEdit(c.id)}><PenIcon size={16}/></button>
                    <button onClick={()=> router.push(`/dashboard/customers/customerView?id=${c.id}`)}  >  <Eye size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

      ) }

    </div>

  </div>
)








}