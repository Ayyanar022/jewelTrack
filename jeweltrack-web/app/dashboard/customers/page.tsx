
// 'use client'

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import api from "@/lib/axios";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
// import { Eye, PenIcon, View } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useState } from "react";





// export default function CustomersPage(){

//   const router = useRouter()

//   const queryClient = useQueryClient();
//   const [ form ,setForm] = useState({ name: '', phone: '', village: '', address: '' })
//   const [search, setSearch] = useState('');
//   const [showForm ,setShowForm] = useState(false);
//   const [error, setError] = useState('')
//   const [editUser , setEditUser] = useState('')

//   const {data:customer} = useQuery({
//       queryKey:['customers',search],
//       queryFn:()=>search
//         ? api.get(`/customer/search?q=${search}`).then(r=>r.data)
//         : api.get(`/customer/all`).then(r=>r.data),
//         gcTime: 5 * 60 * 1000, 
//   });

//   // create user 
//   const {mutate , isPending} = useMutation({
//     mutationFn : (data:any) =>api.post('/customer',data),
//     onSuccess:()=>{
//       queryClient.invalidateQueries({queryKey:['customers']});
//       setForm({ name: '', phone: '', village: '', address: '', });
//       setShowForm(false);
//     },
//     onError:(e:any)=>{
//       setError(e?.response?.data?.message || 'Something went wrong')
//     }

//   });

//   // update user 
//   const {mutate :updateUserMutate , isPending:UpdateUserLoading} = useMutation({
//     mutationFn : ({id ,data}:any)=>api.put(`/customer/${id}`,data),
//     onSuccess:()=>{
//       queryClient.invalidateQueries({queryKey:['customers']})
//        setForm({ name: '', phone: '', village: '', address: '', });
//         setShowForm(false);
//         setEditUser('')
//     },
//     onError:(e:any)=>{
//       setError(e?.response?.data?.message || 'Something went wrong'  )
//     }
//   })


//   const handleSubmit = (e :React.FormEvent)=>{
//     e.preventDefault();
//     setError('');
//     if(editUser ===''){
//       mutate(form);
//     }else{
//       updateUserMutate({id:editUser , data:form})
//     }
//     setEditUser('')
//   }



//   // edit User 
//   const handleEdit = (id:string)=>{
//     const user = customer?.find((f:any)=>f.id ===id)
//     if(user){
//       setForm(user)
//       setShowForm(true)
//       setEditUser(id)
//     }

//   }

//   const resetForm = ()=>{
//     setShowForm(false) 
//     setEditUser('');
//     setForm({ name: '', phone: '', village: '', address: '', });
//   }
  



// return (
//   <div className="flex flex-col gap-6">
//     <div className="flex items-center justify-between">
//        <div>
//           <h1 className="text-xl font-medium text-foreground">Customers</h1>
//           <p className="text-sm text-muted-foreground mt-1">Manage your customer profiles</p>
//         </div>

//         <Button
//         className="bg-gold hover:bg-gold/90 text-white"
//         onClick={()=>setShowForm(!showForm)}
//         >
//           {showForm ? 'Cancel' : '+ New customer'}
//         </Button>
//     </div>

//     {/* create forms */}
//     {showForm && (
//       <div className="bg-white border border-gold rounded-xl p-6">
//         <h2 className="text-sm font-medium text-foreground mb-4">New customer</h2>
//           <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//             <div className="grid grid-cols-2 gap-4">
//                <div className="flex flex-col gap-1.5">
//                 <Label>Name</Label>
//                 <Input placeholder="Customer name" value={form.name}
//                   onChange={(e) => setForm({ ...form, name: e.target.value })} />
//               </div>
//                <div className="flex flex-col gap-1.5">
//                 <Label>Phone</Label>
//                 <Input placeholder="10 digit number" value={form.phone}
//                   onChange={(e) => setForm({ ...form, phone: e.target.value })} />
//               </div>
//             </div>

//              <div className="grid grid-cols-2 gap-4">
//               <div className="flex flex-col gap-1.5">
//                 <Label>Village / Area</Label>
//                 <Input placeholder="e.g. Erode" value={form.village}
//                   onChange={(e) => setForm({ ...form, village: e.target.value })} />
//               </div>
//               <div className="flex flex-col gap-1.5">
//                 <Label>Address (optional)</Label>
//                 <Input placeholder="Full address" value={form.address}
//                   onChange={(e) => setForm({ ...form, address: e.target.value })} />
//               </div>
//             </div>
//              {error && <p className="text-xs text-destructive">{error}</p>}
//             <div className="flex gap-3">
//               <Button type="submit" disabled={isPending} className="bg-gold hover:bg-gold/90 text-white">
//                 {isPending ? "Saving...": "Save customer"}
//               </Button>

//               <Button type="button" variant='outline' onClick={resetForm} >
//                 Cancel
//               </Button>
//             </div>          

//           </form>
//       </div>
//     ) }


//     {/* Search */}
//     <Input 
//     placeholder="Search by name, phone or village..."
//     value={search}
//     onChange={(e)=>setSearch(e.target.value)}
//     className="max-w-sm"
//     />

//     {/* Customer list */}
//     <div className="bg-white border border-gold rounded-xl overflow-hidden  ">
//       <div className="px-5 py-2 border-b border-gold">
//         <h2 className="text-sm font-medium text-foreground">
//           Search by name, phone or village..."
//         </h2>
//       </div>

//       {!customer?.length ? (
//              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
//             No customers yet
//           </div>
//       ):(

//          <table className="w-full text-sm">
//             <thead className="bg-gold-light">
//               <tr>
//                 <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Name</th>
//                 <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Phone</th>
//                 <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Village</th>
//                 <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Address</th>
//                 <th className=" px-5 py-3 text-xs text-muted-foreground font-medium">Address</th>
//               </tr>
//             </thead>
//             <tbody>
//               {customer.map((c: any) => (
//                 <tr key={c.id} className="border-t border-gold hover:bg-gold-light/30 transition-colors">
//                   <td className="px-5 py-3 font-medium text-foreground">{c.name}</td>
//                   <td className="px-5 py-3 text-muted-foreground">{c.phone}</td>
//                   <td className="px-5 py-3 text-muted-foreground">{c.village}</td>
//                   <td className="px-5 py-3 text-muted-foreground">{c.address || '—'}</td>
//                   <td className="px-5 py-3 text-muted-foreground flex justify-around">
//                     <button onClick={()=>handleEdit(c.id)}><PenIcon size={16}/></button>
//                     <button onClick={()=> router.push(`/dashboard/customers/customerView?id=${c.id}`)}  >  <Eye size={16}/></button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//       ) }

//     </div>

//   </div>
// )








// }


'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, PenIcon, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomersPage() {
  const router = useRouter()
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', village: '', address: '' })
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('')
  const [editUser, setEditUser] = useState('')

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => search
      ? api.get(`/customer/search?q=${search}`).then(r => r.data)
      : api.get(`/customer/all`).then(r => r.data),
    gcTime: 5 * 60 * 1000,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => api.post('/customer', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setForm({ name: '', phone: '', village: '', address: '' });
      setShowForm(false);
    },
    onError: (e: any) => {
      setError(e?.response?.data?.message || 'Something went wrong')
    }
  });

  const { mutate: updateUserMutate, isPending: UpdateUserLoading } = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/customer/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setForm({ name: '', phone: '', village: '', address: '' });
      setShowForm(false);
      setEditUser('')
    },
    onError: (e: any) => {
      setError(e?.response?.data?.message || 'Something went wrong')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (editUser === '') {
      mutate(form);
    } else {
      updateUserMutate({ id: editUser, data: form })
    }
  }

  const handleEdit = (id: string) => {
    const user = customer?.find((f: any) => f.id === id)
    if (user) {
      setForm(user)
      setShowForm(true)
      setEditUser(id)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditUser('');
    setForm({ name: '', phone: '', village: '', address: '' });
    setError('');
  }

  const isEditing = editUser !== '';

  return (
    <div className="flex flex-col gap-3 px-5">
      {/* Header — single compact row: title, search, action */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Customers</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search name, phone, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-64 pl-8 text-sm border-slate-300 focus-visible:ring-amber-500"
            />
          </div>
          <Button
            size="sm"
            className="h-8 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
          >
            {showForm ? (
              <span className="flex items-center gap-1"><X size={14} /> Cancel</span>
            ) : (
              <span className="flex items-center gap-1"><Plus size={14} /> New</span>
            )}
          </Button>
        </div>
      </div>

      {/* Create / edit form — compact, collapses when not needed */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 w-40">
              <Label className="text-[11px] text-slate-500">Name</Label>
              <Input
                placeholder="Customer name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-8 text-sm border-slate-300 focus-visible:ring-amber-500"
              />
            </div>
            <div className="flex flex-col gap-1 w-36">
              <Label className="text-[11px] text-slate-500">Phone</Label>
              <Input
                placeholder="10 digit number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-8 text-sm border-slate-300 focus-visible:ring-amber-500"
              />
            </div>
            <div className="flex flex-col gap-1 w-36">
              <Label className="text-[11px] text-slate-500">Village / Area</Label>
              <Input
                placeholder="e.g. Erode"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                className="h-8 text-sm border-slate-300 focus-visible:ring-amber-500"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <Label className="text-[11px] text-slate-500">Address (optional)</Label>
              <Input
                placeholder="Full address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="h-8 text-sm border-slate-300 focus-visible:ring-amber-500"
              />
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isPending || UpdateUserLoading}
              className="h-8 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isPending || UpdateUserLoading ? "Saving..." : isEditing ? "Update" : "Save"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={resetForm} className="h-8 border-slate-300 text-slate-600">
              Cancel
            </Button>

            {error && <p className="text-xs text-red-600 basis-full">{error}</p>}
          </form>
        </div>
      )}

      {/* Customer table — the main surface, optimized for density and scan-ability */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">Loading customers…</div>
        ) : !customer?.length ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            {search ? "No customers match your search." : "No customers yet."}
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0">
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="text-left px-3 pl-7 py-2 text-[14px] uppercase tracking-wide text-slate-500 font-semibold ">#</th>
                <th className="text-left px-3 py-2 text-[14px] uppercase tracking-wide text-slate-500 font-semibold">Name</th>
                <th className="text-left px-3 py-2 text-[14px] uppercase tracking-wide text-slate-500 font-semibold">Phone</th>
                <th className="text-left px-3 py-2 text-[14px] uppercase tracking-wide text-slate-500 font-semibold">Village</th>
                <th className="text-left px-3 py-2 text-[14px] uppercase tracking-wide text-slate-500 font-semibold">Address</th>
                <th className="text-right px-3 py-2 pr-7 text-[14px] uppercase tracking-wide text-slate-500 font-semibold w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customer.map((c: any, i: number) => (
                <tr
                  key={c.id}
                  className={`border-b border-slate-100 last:border-0 hover:bg-amber-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}`}
                >
                  <td className="px-3 py-1.5 text-base pl-7 font-medium text-slate-900 whitespace-nowrap">{i+1}</td>
                  <td className="px-3 py-1.5 text-base font-medium text-slate-900 whitespace-nowrap">{c.name}</td>
                  <td className="px-3 py-1.5 text-base text-slate-700 tabular-nums whitespace-nowrap">{c.phone}</td>
                  <td className="px-3 py-1.5 text-base text-slate-700 whitespace-nowrap">{c.village}</td>
                  <td className="px-3 py-1.5 text-base text-slate-600 truncate max-w-[240px]">{c.address || '—'}</td>
                  <td className="px-3 py-1.5 text-base pr-7">
                    <div className="flex justify-end gap-2 gapx-4">
                      <button
                        onClick={() => handleEdit(c.id)}
                        title="Edit customer"
                        className="h-7 w-7 flex items-center justify-center rounded text-slate-500 hover:text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <PenIcon size={14} />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/customers/customerView?id=${c.id}`)}
                        title="View customer"
                        className="h-7 w-7 flex items-center justify-center rounded text-slate-500 hover:text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!!customer?.length && (
          <div className="px-3 py-1.5 border-t  border-slate-100 text-[14px] text-slate-400">
            {customer.length} customer{customer.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}