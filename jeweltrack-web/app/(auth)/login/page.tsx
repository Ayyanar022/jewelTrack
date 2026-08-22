'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, ShieldCheck, Sparkles, Receipt, Coins, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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

  // Fetch Dynamic Platform Trial Policy
  const { data: trialPolicy } = useQuery<{ trial_days: number; trial_plan: string }>({
    queryKey: ['public-trial-policy'],
    queryFn: async () => {
      const res = await api.get('/subscription/trial-policy');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const trialDays = trialPolicy?.trial_days ?? 14;

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

      toast.success(`Welcome back, ${user?.name || 'Store Owner'}!`);

      if (user?.role === 'SUPER_ADMIN') {
        router.push('/admin/plans');
      } else {
        router.push('/dashboard');
      }
    },
    onError: (e: any) => {
      const message = e?.response?.data?.message || 'Invalid phone number or password';
      setError(message);
      toast.error(message);
    },
  });

  const validate = () => {
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number');
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
    mutate({
      phone: form.phone.trim(),
      password: form.password,
    });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50">
      {/* Left Column — Branding & Key Features (5 cols) */}
      <div className="lg:col-span-5 bg-slate-950 text-white flex flex-col justify-between p-8 sm:p-12 lg:p-14 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo & Badge */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black text-xl shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white">JewelTrack</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block -mt-1">
                Cloud SaaS
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Value Proposition */}
        <div className="relative z-10 my-auto py-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-300">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Secure Cloud Jewellery Management</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
            Run your jewellery shop with <span className="text-amber-400">complete precision</span>.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            Sign in to manage GST billing, track gold and silver loans, monitor inventory weights, and access live bullion rates.
          </p>

          <div className="space-y-3 pt-2">
            {[
              {
                icon: Receipt,
                title: 'GST & Non-GST Jewellery Invoicing',
                desc: 'Fast billing with stone deductions & old gold credit',
              },
              {
                icon: Coins,
                title: 'Gold & Silver Pawn Loan Management',
                desc: 'Cycle interest calculations & pawn receipt slips',
              },
              {
                icon: ShieldCheck,
                title: 'Safe Vault & Category Stock Ledger',
                desc: 'Real-time gross & net pure weight tracking',
              },
            ].map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <feat.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{feat.title}</div>
                  <div className="text-xs text-slate-400">{feat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Footer Trust Indicator */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} JewelTrack Software</span>
          <span className="text-amber-400 font-medium">v2.0 Production Ready</span>
        </div>
      </div>

      {/* Right Column — Login Form (7 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center px-6 py-12 sm:px-12 lg:px-20 bg-white">
        <div className="w-full max-w-md space-y-7">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign In to Your Store
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              Enter your registered mobile number and password to continue.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Phone Input */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-bold text-slate-800">
                Registered Mobile Number
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm font-bold text-slate-500 font-mono">
                  +91
                </div>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={form.phone}
                  disabled={isPending}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setForm({ ...form, phone: val });
                    if (error) setError('');
                  }}
                  className="h-11 pl-12 text-base font-bold font-mono border-slate-300 rounded-xl"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-bold text-slate-800">
                  Account Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  disabled={isPending}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    if (error) setError('');
                  }}
                  className="h-11 pr-11 text-base font-medium border-slate-300 rounded-xl"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 text-base rounded-xl shadow-md cursor-pointer transition-all"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Registration Redirect */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600 font-medium">
              Don&apos;t have a shop account yet?{' '}
              <Link
                href="/register"
                className="font-bold text-slate-900 hover:text-amber-800 underline underline-offset-4 cursor-pointer transition-colors"
              >
                Register your shop ({trialDays}-day free trial)
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}