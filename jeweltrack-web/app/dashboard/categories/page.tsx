'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";




interface Category {
    id:string ;
    name:string;
    metal:'GOLD'|'SILVER';
    default_wastage : number | null ;
    default_making_charge :number | null ;
    touch_22k: number | null;
    touch_18k: number | null;
    touch_24k: number | null;
}

const emptyForm = ()=>({
    name:'',
    metal:'GOLD' as 'GOLD' | 'SILVER',
    default_wastage : '',
    default_making_charge : '',
    touch_22k : '', 
    touch_18k : '' ,
    touch_24k :'', 
})

export default function CategoriesPage (){
    const queryClient = useQueryClient();
    const [showForm , setShowForm ] = useState<boolean>(false);
    const [editingId,setEditingId] = useState<string| null>(null);
    const [form,setForm] = useState(emptyForm());


    const {data :categories , isLoading} = useQuery({
        queryKey : ['categories'],
        queryFn : ()=>api.get('jewellery-category').then(r=>r.data)
    }) 

    const {mutate :save, isPending:saving } = useMutation({
        mutationFn:(data:any)=>editingId 
                ? api.patch(`/jewellery-category/${editingId}`,data)
                : api.post(`/jewellery-category`,data),
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:['categories']});
            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm());

        }
    })

    const {mutate:remove} = useMutation({
        mutationFn : (id:string)=>api.delete(`/jewellery-category/${id}`),
        onSuccess :()=>queryClient.invalidateQueries({queryKey : ['categories']})
    })


    const handleEdit = ( cat :Category) =>{
        setForm({
            name:cat.name ,
            metal :cat.metal,
            default_wastage :cat.default_wastage?.toString() ?? '',
            default_making_charge : cat.default_making_charge?.toString() ?? '',
            touch_22k: cat.touch_22k?.toString() ?? '',
            touch_18k: cat.touch_18k?.toString() ?? '',
            touch_24k: cat.touch_24k?.toString() ?? '',
        })

           setEditingId(cat.id);
            setShowForm(true);
    }


    const handelSubmit = (e :React.FormEvent)=>{
        e.preventDefault();
        save({
            name:form.name ,
            metal :form.metal ,
            ...(form.default_wastage && {default_wastage : Number(form.default_wastage)}),
            ...(form.default_making_charge && {default_making_charge :Number (form.default_making_charge)}),
             ...(form.touch_22k && { touch_22k: Number(form.touch_22k) }),
            ...(form.touch_18k && { touch_18k: Number(form.touch_18k) }),
            ...(form.touch_24k && { touch_24k: Number(form.touch_24k) }),
        })
    }


    const handelCancel = ()=>{
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm());
    }


    return (

        <div className="flex flex-col gap-6 max-w-[950px] mx-auto pb-20 ">
           
            <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                <h1 className="text-xl font-medium text-foreground">Categories </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage jewellery categories with default wastage and touch values
                </p>
                </div>

                {!showForm && (
                <Button className="bg-gold hover:bg-gold/90 text-white"
                    onClick={() => setShowForm(true)}>
                    + New category
                </Button>
                )}
            </div>

            {showForm && (
                <div className="bg-white border border-gold rounded-xl p-6">
                    <h2 className="text-sm font-medium text-foreground mb-5">
                        {editingId ? 'Edit category' : "New category"}
                    </h2>
                    <form onSubmit={handelSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label >Name</Label>
                                <Input
                                placeholder="e.g. Chain, Ring, Bangle"
                                value={form.name}
                                onChange={(e)=>setForm({...form,name:e.target.value})}

                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label >Metal</Label>
                                <select 
                                value={form.metal}
                                onChange={(e)=>setForm({...form,metal:e.target.value as 'GOLD' | 'SILVER'})}
                                className="h-10 rounded-lg border border-input px-3 text-sm bg-white "   >
                                    <option value="GOLD">GOLD</option>
                                    {/* <option value="SILVER">SILVER</option>                                   */}
                                </select>
                            </div>
                        </div>

                         {/* Billing defaults */}
                    <div className="border-t border-gold/20 pt-4">
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                        Billing defaults (for estimate bill)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                        <Label>Default wastage (%)</Label>
                        <Input type="number" placeholder="e.g.  12 "
                            value={form.default_wastage}
                            onChange={(e) => setForm({ ...form, default_wastage: e.target.value })} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                        <Label>Default making charge (₹)</Label>
                        <Input type="number" placeholder="e.g. 500"
                            value={form.default_making_charge}
                            onChange={(e) => setForm({ ...form, default_making_charge: e.target.value })} />
                        </div>
                    </div>
            </div>

                {/* Touch values — only for gold */}
            {form.metal === 'GOLD' && (
              <div className="border-t border-gold/20 pt-4">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                  Touch values (for stock distribution)
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label>Touch 22K</Label>
                    <Input type="number" placeholder="e.g. 6"
                      value={form.touch_22k}
                      onChange={(e) => setForm({ ...form, touch_22k: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Touch 18K</Label>
                    <Input type="number" placeholder="e.g. 7"
                      value={form.touch_18k}
                      onChange={(e) => setForm({ ...form, touch_18k: e.target.value })} />
                  </div>
                  {/* <div className="flex flex-col gap-1.5">
                    <Label>Touch 24K</Label>
                    <Input type="number" placeholder="e.g. 0.02"
                      value={form.touch_24k}
                      onChange={(e) => setForm({ ...form, touch_24k: e.target.value })} />
                  </div> */}
                </div>
              </div>
            )}


            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}
                className="bg-gold hover:bg-gold/90 text-white">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={handelCancel}>
                Cancel
              </Button>
            </div>

                    </form>
                </div>
            )}


            {/* Categories list */}
            <div className="bg-white border border-gold rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gold">
                   <span className=" px-1 text-gold-dark font-bold">{categories?.length ?? 0}  </span> categories
                </div>

                {isLoading ? (
                     <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading...</div>
                ): !categories?.length ? (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                        No categories yet — create your first one
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-yellow-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-base text-gold font-medium">Name</th>
                    <th className="text-left px-5 py-3 text-base text-gold font-medium">Metal</th>
                    <th className="text-left px-5 py-3 text-base text-gold font-medium">Wastage (%)</th>
                    <th className="text-left px-5 py-3 text-base text-gold font-medium">Making (₹)</th>
                    <th className="text-left px-5 py-3 text-base text-gold font-medium">Touch 22K</th>
                    <th className="text-left px-5 py-3 text-base text-gold font-medium">Touch 18K</th>
                    <th className="text-left px-5 py-3 text-base text-gold font-medium">Actions</th>
                </tr>
                        </thead>
                    
                    <tbody>
                        {categories.map((cat:Category)=>(
                            <tr key={cat.id} className="border-t border-gold hover:bg-gold-light/30 transition-colors">
                                <td className="px-5 py-3 text-base font-medium text-foreground">{cat.name}</td>
                                <td className="px-5 py-3 text-lg">
                                    <span className={`text-sm px-3 py-1 rounded-full ${cat.metal === 'GOLD' ? 'bg-gold-light text-gold-dark' : 'bg-gray-100 text-gray-600'}`}>
                                    {cat.metal === 'GOLD' ? 'Gold' : 'Silver'}
                                    </span>
                                </td>
                                 <td className="px-5 py-3 text-lg text-muted-foreground">{cat.default_wastage ?? '—'}</td>
                                <td className="px-5 py-3 text-lg text-muted-foreground">{cat.default_making_charge ?? '—'}</td>
                                <td className="px-5 py-3 text-lg text-muted-foreground">{cat.touch_22k ?? '—'}</td>
                                <td className="px-5 py-3 text-lg text-muted-foreground">{cat.touch_18k ?? '—'}</td>
                                 <td className="px-5 py-3 text-lg">
                                <div className="flex gap-3">
                                <button onClick={() => handleEdit(cat)}
                                    className="text-sm text-gold hover:underline">
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                    if (confirm(`Delete ${cat.name}?`)) remove(cat.id);
                                    }}
                                    className="text-sm text-destructive hover:underline">
                                    Delete
                                </button>
                                </div>
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