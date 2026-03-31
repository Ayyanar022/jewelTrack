
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useAuthStore();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: (data: typeof form) => api.post('/auth/login', data),
    onSuccess: (res) => {
      setToken(res.data.access_token);
      router.push('/dashboard');
    },
    onError: () => {
      setError('Invalid phone number or password');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutate(form);
  };

  return (
    <div className="min-h-screen grid grid-cols-1  lg:grid-cols-2 ">

      {/* Left — branding */}
      <div className="bg-sidebar-dark flex flex-col justify-center px-10  md:px-24 py-16 ">
        <div className="inline-block bg-sidebar-active text-gold-text text-xs px-4 py-1.5 rounded-full border border-gold/20 w-fit mb-6">
          Welcome back
        </div>
        <h2 className="text-3xl font-medium text-gold-text leading-snug mb-4">
          Your shop is<br />waiting for you
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Login to manage billing, track stock, and monitor loans — all in one place.
        </p>
        <div className="flex flex-col gap-3">
          {[
            "Today's bills and estimates",
            "Stock pending from parties",
            "Active gold loans",
            "Live gold rate"
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-xs text-muted-foreground mb-3">
            Trusted by shops in
          </p>
          <div className="flex gap-2 flex-wrap">
            {["Chennai", "Coimbatore", "Madurai", "Salem"].map((city) => (
              <span
                key={city}
                className="bg-sidebar-active text-gold-text text-xs px-3 py-1 rounded-full border border-gold/20"
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="bg-page flex flex-col justify-center px-10 md:px-24 py-16">
        <h1 className="text-xl font-medium text-foreground mb-1">
          Login to JewelTrack
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Enter your shop credentials to continue
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-gold hover:bg-gold/90 text-white  h-10"
          >
            {isPending ? 'Logging in...' : 'Login to dashboard'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <a href="/register" className="text-gold hover:underline">
              Register your shop
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}