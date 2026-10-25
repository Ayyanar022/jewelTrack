'use client';

import Link from 'next/link';
import { Lock, Sparkles, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LockedFeatureViewProps {
  title: string;
  badge?: string;
  requiredPlan: 'PRO' | 'ENTERPRISE';
  description: string;
  benefits: string[];
}

export default function LockedFeatureView({
  title,
  badge = 'Premium Module',
  requiredPlan,
  description,
  benefits,
}: LockedFeatureViewProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-gold/20 shadow-xl shadow-amber-500/5 p-8 text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 bg-gradient-to-b from-amber-300/25 to-transparent blur-2xl pointer-events-none" />

        {/* Lock Icon with Gold Badge */}
        <div className="relative inline-flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-gold/40 flex items-center justify-center text-amber-700 shadow-inner">
            <Lock className="w-8 h-8 text-gold" />
          </div>
          <span className="absolute -top-1.5 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-slate-900 text-amber-400 border border-amber-400/40 shadow-xs">
            {requiredPlan}
          </span>
        </div>

        {/* Badge & Title */}
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
          {badge}
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
          Unlock {title}
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-md mx-auto">
          {description}
        </p>

        {/* Value Checklist */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-6 text-left space-y-2.5">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            What you get with {requiredPlan}:
          </div>
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* Upgrade CTA Button */}
        <Link href="/dashboard/settings?tab=subscription">
          <Button className="w-full h-12 text-sm font-bold bg-gradient-to-r from-gold to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/25 rounded-xl gap-2 cursor-pointer transition-all">
            <ShieldCheck className="w-4 h-4" />
            <span>Upgrade to {requiredPlan} Plan</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
