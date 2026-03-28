
'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import  { useState } from "react";




export default function RegisterPage(){
    const router = useRouter();
    // const {setToken} = useAu
    const [form, setForm] = useState({name:"",owner_name:"",phone:"",password:""})
    const [error,setError] = useState('')
    const [confirmPassword,setConfirmPassword] = useState('')

    const {mutate,isPending} = useMutation({
        mutationFn:(data:typeof form)=>api.post("/auth/register",data),
        onSuccess:(res)=>{
          router.push('/login')
        },
        onError:(e:any)=>{
          setError(e?.response?.data?.message || "something went wrong")
        }
    });

    
    const handleSubmit = (e:React.FormEvent)=>{
        e.preventDefault()
        setError('');

        if (form.password !== confirmPassword) {
        setError('Passwords do not match');
        return;
        }

        mutate(form)
    }

    return (
    <div className="min-h-screen grid grid-cols-1  lg:grid-cols-2 ">

      {/* Left — branding */}
      <div className="bg-sidebar-dark flex flex-col justify-center px-10  md:px-24 py-16 ">
        <div className="inline-block bg-sidebar-active text-gold-text text-xs px-4 py-1.5 rounded-full border border-gold/20 w-fit mb-6">
         Free 14-day trial
        </div>
        <h2 className="text-3xl font-medium text-gold-text leading-snug mb-4">
          Start managing your<br />shop the smart way
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
         No credit card needed. Get full access to all features for 14 days free. Then choose a plan that fits your shop.
        </p>
        <div className="flex flex-col gap-3">
          {[
            "Setup takes less than 2 minutes",
            "All 4 modules unlocked in trial",
            "Your data is safe and private",
            "Cancel anytime — no lock-in"
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

    
      </div>

      {/* Right — form */}
      <div className="bg-page flex flex-col justify-center px-10 md:px-24 py-16">
        <h1 className="text-xl font-medium text-foreground mb-1">
          Register your shop
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Create your JewelTrack account
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
         
         <section className="grid grid-cols-2 gap-2">       
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Shop Name</Label>
            <Input
              id="name"
              type="text"
             placeholder="Sri Lakshmi Jewels"
              value={form.name}
              className='h-10'
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="owner_name">Owner Name</Label>
            <Input
              id="owner_name"
              type="text"
              placeholder="Ramesh Kumar"
              value={form.owner_name}
              className='h-10'
              onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
            />
          </div>
            </section>

                <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="text"
              placeholder="Enter 10 digit mobile number"
              value={form.phone}
              className='h-10'
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <section className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              className='h-10'
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
             </div>
                <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Enter your Confirm password"
              value={confirmPassword}
              className='h-10'
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          </section>

    

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-gold hover:bg-gold/90 text-white  h-10"
          >
            {isPending ? 'Registering in...' : 'create account ( its free )'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account? {' '}
            <a href="/login" className="text-gold hover:underline">
              Login here
            </a>
          </p>
        </form>
      </div>
    </div>
    )
}



