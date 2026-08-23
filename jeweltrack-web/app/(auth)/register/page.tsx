'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, Sparkles, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Store, User, Phone, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    owner_name: '',
    phone: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch Dynamic Platform Trial Policy from Backend
  const { data: trialPolicy } = useQuery<{ trial_days: number; trial_plan: string }>({
    queryKey: ['public-trial-policy'],
    queryFn: async () => {
      const res = await api.get('/subscription/trial-policy');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const trialDays = trialPolicy?.trial_days ?? 14;
  const trialPlan = trialPolicy?.trial_plan || 'PRO';

  const formatName = (text: string) => {
    if (!text) return '';
    return text
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/auth/register', {
        name: formatName(data.name),
        owner_name: formatName(data.owner_name),
        phone: data.phone.trim(),
        password: data.password,
      }),
    onSuccess: () => {
      toast.success(`🎉 Shop registered successfully! Please log in to start your ${trialDays}-day free trial.`);
      router.push('/login');
    },
    onError: (e: any) => {
      const message = e?.response?.data?.message || 'Failed to register shop. Please try again.';
      setError(message);
      toast.error(message);
    },
  });

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Please enter your jewellery shop name');
      return false;
    }
    if (!form.owner_name.trim()) {
      setError('Please enter store owner name');
      return false;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (form.password !== confirmPassword) {
      setError('Passwords do not match');
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50">
      {/* Left Column — Trial Value & Features (5 cols) */}
      <div className="lg:col-span-5 bg-slate-950 text-white flex flex-col justify-between p-8 sm:p-12 lg:p-14 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              {/* Ambient pulsing luxury gold glow */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 opacity-60 blur-xs animate-pulse" />
              
              {/* Animated diamond icon badge */}
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-400/60 flex items-center justify-center text-amber-400 shadow-xl shadow-black">
                <Sparkles className="w-6 h-6 text-amber-400 animate-[spin_10s_linear_infinite]" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
              </div>
            </div>

            <div>
              <div className="flex items-center">
                <span className="font-black text-2xl tracking-[0.2em] uppercase text-white font-sans">
                  JEWEL<span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">TRACK</span>
                </span>
              </div>
              <div className="text-[10px] tracking-[0.22em] uppercase font-bold text-amber-400/90 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>JEWELLERY CLOUD OS - ERP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Value Proposition */}
        <div className="relative z-10 my-auto py-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{trialDays}-Day Free Trial ({trialPlan} Tier) • No Credit Card Required</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
            Start managing your jewellery store the <span className="text-amber-400">smart way</span>.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            Get instant full access to all {trialPlan} plan features for {trialDays} days free. Set up your store in under 2 minutes.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Instant GST & Non-GST Jewellery Invoicing',
              'Gold & Silver Collateral Loan Ledger with Cycle Calculations',
              'Safe Vault Inventory & Pure Weight Balance Tracking',
              'Customer Profile Ledgers & Purchase History Analytics',
              'No lock-in contracts — keep your data 100% private',
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Instant Activation</span>
          <span className="text-amber-400 font-medium">Full {trialPlan} Plan Access Included</span>
        </div>
      </div>

      {/* Right Column — Registration Form (7 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center px-6 py-12 sm:px-12 lg:px-20 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Register Your Jewellery Shop
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              Create your store account to start your free {trialDays}-day trial ({trialPlan} tier).
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
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Shop & Owner Names (2 cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="shop_name" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-500" />
                  <span>Shop Name *</span>
                </Label>
                <Input
                  id="shop_name"
                  type="text"
                  placeholder="e.g. Sri Lakshmi Jewels"
                  value={form.name}
                  disabled={isPending}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (error) setError('');
                  }}
                  className="h-10 text-sm font-bold border-slate-300 rounded-xl"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="owner_name" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Owner Name *</span>
                </Label>
                <Input
                  id="owner_name"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={form.owner_name}
                  disabled={isPending}
                  onChange={(e) => {
                    setForm({ ...form, owner_name: e.target.value });
                    if (error) setError('');
                  }}
                  className="h-10 text-sm font-bold border-slate-300 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Mobile Number (10 Digits) *</span>
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
                  className="h-10 pl-12 text-sm font-bold font-mono border-slate-300 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Passwords (2 cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Password *</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 chars"
                    value={form.password}
                    disabled={isPending}
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value });
                      if (error) setError('');
                    }}
                    className="h-10 pr-9 text-sm font-medium border-slate-300 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm_password" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Confirm Password *</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    disabled={isPending}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className="h-10 pr-9 text-sm font-medium border-slate-300 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 text-base rounded-xl shadow-md cursor-pointer transition-all mt-2"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Your Store...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Create Account ({trialDays}-Day Free Trial)</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Login Redirect */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600 font-medium">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-slate-900 hover:text-amber-800 underline underline-offset-4 cursor-pointer transition-colors"
              >
                Sign in to your dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
