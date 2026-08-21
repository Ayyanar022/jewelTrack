'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // shadcn's recommended toast lib — see note below
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser, setShop } = useAuthStore();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: typeof form) => api.post('/auth/login', data),
    onSuccess: (res) => {
      const token = res?.data?.access_token;
      const user = res?.data?.user;
      if (!token) {
        setError('Login failed. Unexpected response from server.');
        toast.error('Login failed. Please try again.');
        return;
      }
      setToken(token);
      if (user) {
        setUser(user);
      } else {
        setShop(res?.data?.shop || null);
      }

      toast.success(`Welcome back, ${user?.name || 'User'}!`);
      
      if (user?.role === 'SUPER_ADMIN') {
        router.push('/admin/plans');
      } else {
        router.push('/dashboard');
      }
    },
    onError: (e: any) => {
      console.log(e);
      const message =
        e?.response?.data?.message || 'Invalid phone number or password';
      setError(message);
      toast.error(message);
    },
  });

  const validate = () => {
    if (!/^\d{10}$/.test(form.phone)) {
      setError('Enter a valid 10 digit phone number');
      return false;
    }
    if (!form.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    mutate(form);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left — branding */}
      <div className="bg-sidebar-dark flex flex-col justify-center px-10 md:px-24 py-16">
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
            "Live gold rate",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-xs text-muted-foreground mb-3">Trusted by shops in</p>
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
        <h1 className="text-xl font-medium text-foreground mb-1">Login to JewelTrack</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Enter your shop credentials to continue
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="text"
              inputMode="numeric"
              placeholder="Enter 10 digit mobile number"
              value={form.phone}
              className="h-10"
              disabled={isPending}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                className="h-10 pr-10"
                disabled={isPending}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-gold hover:bg-gold/90 text-white h-10"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Logging in...
              </span>
            ) : (
              'Login to dashboard'
            )}
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