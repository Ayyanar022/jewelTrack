'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Receipt,
  TrendingUp,
  Package,
  CircleDollarSign,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  Printer,
  ShieldCheck,
  Zap,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Gem,
  Smartphone,
  Scale,
  FileSpreadsheet,
  Building2,
  Clock,
  Lock,
} from 'lucide-react';

interface PricingOption {
  duration_months: number;
  discount_percent: number;
  original_price_paise: number;
  offer_price_paise: number;
  monthly_equivalent_paise: number;
  savings_paise: number;
  original_price_inr: number;
  offer_price_inr: number;
  monthly_equivalent_inr: number;
  savings_inr: number;
}

interface DynamicPlan {
  id: string;
  name: string;
  price: number; // in paise
  max_users: number;
  max_invoices_per_month: number | null;
  max_branches: number;
  features?: {
    billing?: boolean;
    inventory?: boolean;
    gold_loans?: boolean;
    gst_reports?: boolean;
    multi_branch?: boolean;
    [key: string]: boolean | undefined;
  } | null;
  note?: string | null;
  is_active: boolean;
  base_price_inr?: number;
  pricing_options?: PricingOption[];
}

interface TrialPolicy {
  trial_days: number;
  trial_plan: string;
}

// Fallback plans if backend is initializing
const FALLBACK_PLANS: DynamicPlan[] = [
  {
    id: 'basic-fallback',
    name: 'BASIC',
    price: 99900,
    base_price_inr: 999,
    max_users: 1,
    max_invoices_per_month: 100,
    max_branches: 1,
    features: {
      billing: true,
      gst_reports: true,
      inventory: false,
      gold_loans: false,
      multi_branch: false,
    },
    note: 'Ideal for small jewellery shops starting digital billing',
    is_active: true,
    pricing_options: [
      {
        duration_months: 1,
        discount_percent: 0,
        original_price_paise: 99900,
        offer_price_paise: 99900,
        monthly_equivalent_paise: 99900,
        savings_paise: 0,
        original_price_inr: 999,
        offer_price_inr: 999,
        monthly_equivalent_inr: 999,
        savings_inr: 0,
      },
      {
        duration_months: 12,
        discount_percent: 20,
        original_price_paise: 1198800,
        offer_price_paise: 959040,
        monthly_equivalent_paise: 79920,
        savings_paise: 239760,
        original_price_inr: 11988,
        offer_price_inr: 9590,
        monthly_equivalent_inr: 799,
        savings_inr: 2398,
      },
    ],
  },
  {
    id: 'pro-fallback',
    name: 'PRO',
    price: 199900,
    base_price_inr: 1999,
    max_users: 3,
    max_invoices_per_month: 500,
    max_branches: 1,
    features: {
      billing: true,
      gst_reports: true,
      inventory: true,
      gold_loans: true,
      multi_branch: false,
    },
    note: 'Best for growing jewellery stores with staff and inventory needs',
    is_active: true,
    pricing_options: [
      {
        duration_months: 1,
        discount_percent: 0,
        original_price_paise: 199900,
        offer_price_paise: 199900,
        monthly_equivalent_paise: 199900,
        savings_paise: 0,
        original_price_inr: 1999,
        offer_price_inr: 1999,
        monthly_equivalent_inr: 1999,
        savings_inr: 0,
      },
      {
        duration_months: 12,
        discount_percent: 20,
        original_price_paise: 2398800,
        offer_price_paise: 1919040,
        monthly_equivalent_paise: 159920,
        savings_paise: 479760,
        original_price_inr: 23988,
        offer_price_inr: 19190,
        monthly_equivalent_inr: 1599,
        savings_inr: 4798,
      },
    ],
  },
  {
    id: 'enterprise-fallback',
    name: 'ENTERPRISE',
    price: 399900,
    base_price_inr: 3999,
    max_users: 10,
    max_invoices_per_month: null,
    max_branches: 3,
    features: {
      billing: true,
      gst_reports: true,
      inventory: true,
      gold_loans: true,
      multi_branch: true,
    },
    note: 'Complete suite for multi-counter & multi-branch jewellery businesses',
    is_active: true,
    pricing_options: [
      {
        duration_months: 1,
        discount_percent: 0,
        original_price_paise: 399900,
        offer_price_paise: 399900,
        monthly_equivalent_paise: 399900,
        savings_paise: 0,
        original_price_inr: 3999,
        offer_price_inr: 3999,
        monthly_equivalent_inr: 3999,
        savings_inr: 0,
      },
      {
        duration_months: 12,
        discount_percent: 20,
        original_price_paise: 4798800,
        offer_price_paise: 3839040,
        monthly_equivalent_paise: 319920,
        savings_paise: 959760,
        original_price_inr: 47988,
        offer_price_inr: 38390,
        monthly_equivalent_inr: 3199,
        savings_inr: 9598,
      },
    ],
  },
];

const MODULE_FEATURES = [
  {
    title: 'Smart Estimates & GST Invoicing',
    badge: 'Billing & POS',
    desc: 'Generate official GST tax invoices or rapid estimate receipts. Automatically calculates 22K/18K gold rates, wastage %, making charges, and old gold exchange deductions.',
    icon: Receipt,
    highlights: ['Estimate & GST bills', 'Old Gold deduction', 'Thermal (58/80mm) & A4 print', 'Split payment tracking'],
  },
  {
    title: 'Live Gold & Silver Rate Sync',
    badge: 'Live Board',
    desc: 'Set daily benchmark rates once for 22K, 18K, 999 Fine Gold, and Silver. All new bills, collateral evaluations, and inventory values sync in real time.',
    icon: TrendingUp,
    highlights: ['22K, 18K & 999 Pure rates', 'Silver rates', 'Auto rate fill in bills', 'Historical rate log'],
  },
  {
    title: 'Physical Stock & Metal Ledger',
    badge: 'Inventory',
    desc: 'Categorize stock by Bangles, Chains, Rings, Necklaces, etc. Track gross vs net weight, purity touch, own stock vs borrowed stock with zero discrepancies.',
    icon: Package,
    highlights: ['Category-wise inventory', 'Own vs Borrowed stock', 'Purity touch tracking', 'Weight balance ledger'],
  },
  {
    title: 'Jewel Loans & Girvi Collateral',
    badge: 'Gold Loans',
    desc: 'Issue loans against gold jewellery with automated monthly interest calculation. Capture customer photos and pledged ornament photos right on the receipt.',
    icon: CircleDollarSign,
    highlights: ['Collateral photo upload', 'Interest & principal split', 'Loan status tracking', 'Instant pawn receipts'],
  },
  {
    title: 'Customer Ledger & Balances',
    badge: 'Customer CRM',
    desc: 'Keep complete customer profiles with village, phone, transaction histories, pending dues, and loan repayments in one searchable directory.',
    icon: Users,
    highlights: ['Customer purchase history', 'Pending dues & credits', 'Village/area directory', 'Single-click statements'],
  },
  {
    title: 'Business Analytics & Daybook',
    badge: 'Reports & Tax',
    desc: 'Instant insight into daily cash collections, UPI payments, gross jewellery weight sold, GST summaries, and 1-click export to Excel for your accountant.',
    icon: BarChart3,
    highlights: ['Daily daybook summary', 'GST 3B ready reports', '1-Click Excel export', 'Payment mode breakup'],
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Register Your Shop',
    desc: 'Sign up in 60 seconds. Get an instant free trial with full access to pro modules.',
    icon: Zap,
  },
  {
    num: '02',
    title: 'Set Today’s Gold Rate',
    desc: 'Enter your 22K, 18K, and Silver market rates. JewelTrack auto-syncs them to every bill.',
    icon: Scale,
  },
  {
    num: '03',
    title: 'Create Invoices & Manage Stock',
    desc: 'Bill customers with custom wastage, making charges, and print receipts in 2 seconds.',
    icon: Printer,
  },
  {
    num: '04',
    title: 'Track Loans & Daily Profits',
    desc: 'Monitor pledged jewellery, active loans, daily collections, and GST reports effortlessly.',
    icon: ShieldCheck,
  },
];

const FAQS = [
  {
    q: 'Do I need a credit card to start the free trial?',
    a: 'No! You can register your jewellery shop in under a minute without entering any credit card or payment details. You get full access to the Pro tier immediately.',
  },
  {
    q: 'Can I print bills on both Thermal receipt printers and standard A4 printers?',
    a: 'Yes! JewelTrack supports standard 58mm & 80mm thermal POS printers (ideal for fast counter estimates) as well as regular A4/A5 laser/inkjet printers for formal GST tax invoices.',
  },
  {
    q: 'How does JewelTrack handle Old Gold exchange and deductions?',
    a: 'When creating a bill, you can add Old Gold entries specifying purity, gross weight, and melt rate. JewelTrack calculates the deduction amount and subtracts it automatically from the customer payable total.',
  },
  {
    q: 'Can I manage Jewel Loans (Girvi / Gold Pawn Loans)?',
    a: 'Yes! JewelTrack includes a dedicated Gold Loan module that tracks collateral items, weight, pieces, loan amount, monthly interest %, repayments, and even lets you attach ornament photos.',
  },
  {
    q: 'Can I change or upgrade my plan later?',
    a: 'Yes, you can upgrade, downgrade, or renew your subscription anytime directly from your shop dashboard or admin panel.',
  },
  {
    q: 'Is my jewellery shop data secure and backed up?',
    a: 'All your data is securely encrypted and backed up in cloud databases, ensuring you never lose customer ledgers, bill history, or loan records even if your computer breaks.',
  },
];

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeNav, setActiveNav] = useState<'modules' | 'how-it-works' | 'pricing' | 'faq'>('how-it-works');

  // 1. Fetch Dynamic Trial Policy from Backend
  const { data: trialPolicy } = useQuery<TrialPolicy>({
    queryKey: ['public-trial-policy'],
    queryFn: async () => {
      const res = await api.get('/subscription/trial-policy');
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // 2. Fetch Dynamic Plans and Pricing from Backend
  const { data: dynamicPlans, isLoading: isPlansLoading } = useQuery<DynamicPlan[]>({
    queryKey: ['public-pricing-table'],
    queryFn: async () => {
      const res = await api.get('/subscription/pricing-table');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const trialDays = trialPolicy?.trial_days || 14;
  const trialPlanName = trialPolicy?.trial_plan || 'PRO';

  // Use dynamic plans or fall back gracefully
  const plansToDisplay = (dynamicPlans && dynamicPlans.length > 0) ? dynamicPlans : FALLBACK_PLANS;

  // Auto-detect which section is on screen
  useEffect(() => {
    const handleScroll = () => {
      const sections: Array<{ id: 'modules' | 'how-it-works' | 'pricing' | 'faq'; el: HTMLElement | null }> = [
        { id: 'modules', el: document.getElementById('modules') },
        { id: 'how-it-works', el: document.getElementById('how-it-works') },
        { id: 'pricing', el: document.getElementById('pricing') },
        { id: 'faq', el: document.getElementById('faq') },
      ];

      const scrollPos = window.scrollY + 180;

      for (let i = sections.length - 1; i >= 0; i--) {
        const item = sections[i];
        if (item.el && item.el.offsetTop <= scrollPos) {
          setActiveNav(item.id);
          return;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: 'modules' | 'how-it-works' | 'pricing' | 'faq',
  ) => {
    e.preventDefault();
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -72; // header height offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-[#F9F6F0] text-stone-900 selection:bg-[#C9920A]/20 selection:text-[#7A5500] scroll-smooth">

      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 bg-[#1C1409]/95 backdrop-blur-md border-b border-[#C9920A]/20 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C9920A] to-[#FFD97D] flex items-center justify-center shadow-md shadow-[#C9920A]/20">
              <Gem className="w-5 h-5 text-[#1C1409]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#FFD97D] via-[#FFE4A0] to-[#E6B800] bg-clip-text text-transparent">
                JewelTrack
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#3A2800] text-[#FFD97D] border border-[#C9920A]/30">
                Jewellery ERP
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a
              href="#modules"
              onClick={(e) => handleNavClick(e, 'modules')}
              className={`transition-colors duration-200 py-1 border-b-2 ${
                activeNav === 'modules'
                  ? 'text-[#FFD97D] border-[#FFD97D]'
                  : 'text-stone-300 border-transparent hover:text-[#FFD97D]'
              }`}
            >
              Modules
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className={`transition-colors duration-200 py-1 border-b-2 ${
                activeNav === 'how-it-works'
                  ? 'text-[#FFD97D] border-[#FFD97D]'
                  : 'text-stone-300 border-transparent hover:text-[#FFD97D]'
              }`}
            >
              How it works
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleNavClick(e, 'pricing')}
              className={`transition-colors duration-200 py-1 border-b-2 ${
                activeNav === 'pricing'
                  ? 'text-[#FFD97D] border-[#FFD97D]'
                  : 'text-stone-300 border-transparent hover:text-[#FFD97D]'
              }`}
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, 'faq')}
              className={`transition-colors duration-200 py-1 border-b-2 ${
                activeNav === 'faq'
                  ? 'text-[#FFD97D] border-[#FFD97D]'
                  : 'text-stone-300 border-transparent hover:text-[#FFD97D]'
              }`}
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-stone-300 hover:text-[#FFD97D] hover:bg-[#3A2800]/50 text-sm font-medium px-4"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-[#C9920A] to-[#B37E00] hover:from-[#B37E00] hover:to-[#996B00] text-white text-sm font-semibold shadow-md shadow-[#C9920A]/25 border border-[#FFD97D]/30 px-5">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-[#1C1409] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle Luxury Background Glows */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#C9920A]/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-[#FFD97D]/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-[#C9920A]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3A2800] border border-[#C9920A]/40 text-[#FFD97D] text-xs font-semibold tracking-wide mb-8 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD97D] animate-pulse" />
            <span>Built for Indian Gold & Silver Jewellery Retailers</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] mb-6">
            Run Your Jewellery Shop{' '}
            <span className="bg-gradient-to-r from-[#FFD97D] via-[#FFF2B2] to-[#C9920A] bg-clip-text text-transparent">
              Smarter, Faster & 100% Compliant
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            All-in-one platform for <strong>GST & Estimate Billing</strong>, <strong>Live Gold Rate Sync</strong>,{' '}
            <strong>Jewel Pawn Loans</strong>, <strong>Metal Stock Ledger</strong>, and <strong>Customer Dues</strong>.
            Designed specifically for counter speed.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-12 px-8 text-base font-semibold bg-gradient-to-r from-[#C9920A] to-[#B37E00] hover:from-[#B37E00] hover:to-[#996B00] text-white shadow-xl shadow-[#C9920A]/20 border border-[#FFD97D]/30 flex items-center justify-center gap-2">
                <span>Start {trialDays}-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 text-base font-medium border-[#C9920A]/40 text-[#FFD97D] bg-[#3A2800]/40 hover:bg-[#3A2800] hover:text-[#FFE4A0]"
              >
                Login to Your Shop
              </Button>
            </Link>
          </div>

          {/* Trust points */}
          <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs sm:text-sm text-stone-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FFD97D]" />
              <span>{trialDays}-Day Full Pro Access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FFD97D]" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FFD97D]" />
              <span>Instant Setup in 60s</span>
            </div>
          </div>

          {/* Interactive Feature Preview / Rate Board Mockup */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-gradient-to-b from-[#2E200C] to-[#1C1409] p-2 sm:p-3 border border-[#C9920A]/30 shadow-2xl shadow-black/60">
            <div className="rounded-xl bg-[#140E06] p-4 sm:p-6 border border-[#C9920A]/15 text-left">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Live Jewellery Terminal Preview
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#FFD97D] bg-[#3A2800] px-3 py-1 rounded-full border border-[#C9920A]/30">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Thermal 58mm / 80mm & A4 GST Print Ready</span>
                </div>
              </div>

              {/* Rate Board Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="bg-[#1C1409] p-3 rounded-lg border border-[#C9920A]/20">
                  <div className="text-[11px] text-stone-400">22K Gold (916)</div>
                  <div className="text-base font-bold text-[#FFD97D]">₹7,350 / g</div>
                  <div className="text-[10px] text-emerald-400">Auto-calculated in bills</div>
                </div>
                <div className="bg-[#1C1409] p-3 rounded-lg border border-[#C9920A]/20">
                  <div className="text-[11px] text-stone-400">18K Gold (750)</div>
                  <div className="text-base font-bold text-[#FFD97D]">₹6,050 / g</div>
                  <div className="text-[10px] text-emerald-400">Purity touch synced</div>
                </div>
                <div className="bg-[#1C1409] p-3 rounded-lg border border-[#C9920A]/20">
                  <div className="text-[11px] text-stone-400">24K Fine Gold (999)</div>
                  <div className="text-base font-bold text-[#FFD97D]">₹8,020 / g</div>
                  <div className="text-[10px] text-stone-400">Market benchmark</div>
                </div>
                <div className="bg-[#1C1409] p-3 rounded-lg border border-[#C9920A]/20">
                  <div className="text-[11px] text-stone-400">Silver Rate</div>
                  <div className="text-base font-bold text-stone-200">₹98.50 / g</div>
                  <div className="text-[10px] text-stone-400">Daily spot rate</div>
                </div>
              </div>

              {/* Sample Bill Item Breakdown */}
              <div className="bg-[#1C1409]/60 rounded-lg p-3 text-xs text-stone-300 font-mono space-y-1.5 border border-stone-800">
                <div className="flex justify-between text-stone-400 border-b border-stone-800/80 pb-1 font-sans">
                  <span>SAMPLE BILLING PREVIEW</span>
                  <span className="text-[#FFD97D]">INVOICE #BILL-2026-0042</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>916 Gold Necklace (Net: 14.50g @ ₹7,350/g + 8% Wastage + MC)</span>
                  <span className="text-white font-semibold">₹1,18,480.00</span>
                </div>
                <div className="flex justify-between text-amber-300/90">
                  <span>(-) Old Gold Trade-in (22K Scrap: 6.20g @ ₹7,100/g)</span>
                  <span>- ₹44,020.00</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>(+) CGST 1.5% + SGST 1.5%</span>
                  <span>+ ₹2,233.80</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-stone-800 text-sm font-sans font-bold text-[#FFD97D]">
                  <span>Net Payable Amount:</span>
                  <span>₹76,693.80</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Highlight Metrics Bar */}
      <section className="bg-[#3A2800] border-y border-[#C9920A]/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#FFD97D]">22K / 18K / 999</div>
            <div className="text-xs sm:text-sm text-stone-300 mt-1">Live Multi-Purity Rate Engine</div>
          </div>
          <div className="p-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#FFD97D]">GST & Non-GST</div>
            <div className="text-xs sm:text-sm text-stone-300 mt-1">Estimates & Official Invoicing</div>
          </div>
          <div className="p-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#FFD97D]">Girvi / Loans</div>
            <div className="text-xs sm:text-sm text-stone-300 mt-1">Pawn Collateral & Photo Logs</div>
          </div>
          <div className="p-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#FFD97D]">1-Click Excel</div>
            <div className="text-xs sm:text-sm text-stone-300 mt-1">Daybook, Sales & GST Export</div>
          </div>
        </div>
      </section>

      {/* 4. Core Modules & Features Grid */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block bg-[#FFF3CD] text-[#7A5500] text-xs font-bold px-3.5 py-1 rounded-full border border-[#C9920A]/30 mb-3">
            Everything in One Suite
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight mb-4">
            Purpose-Built for Indian Jewellery Retailers
          </h2>
          <p className="text-base text-stone-600">
            Unlike generic billing software, JewelTrack accommodates actual jewellery trade practices — from wastage calculations and old gold exchange to pawn collateral photo records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULE_FEATURES.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="bg-white rounded-2xl p-7 border border-[#EAE0CC] shadow-sm hover:shadow-md hover:border-[#C9920A]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF3CD] text-[#7A5500] flex items-center justify-center border border-[#C9920A]/20">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className="text-xs bg-[#F9F6F0] text-stone-700 border-stone-300 font-medium">
                      {m.badge}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2">{m.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed mb-6">{m.desc}</p>
                </div>

                <div className="border-t border-stone-100 pt-4 space-y-2">
                  {m.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs font-medium text-stone-700">
                      <CheckCircle2 className="w-4 h-4 text-[#C9920A] flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. How It Works Roadmap */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#EAE0CC] px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">Up and Running in 4 Simple Steps</h2>
            <p className="text-sm text-stone-600">Zero complicated software installation. Works in any modern web browser or tablet.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="relative bg-[#F9F6F0] rounded-xl p-6 border border-[#EAE0CC] flex flex-col items-start">
                  <div className="w-10 h-10 rounded-lg bg-[#1C1409] text-[#FFD97D] flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
                    {step.num}
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Dynamic Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-block bg-[#FFF3CD] text-[#7A5500] text-xs font-bold px-4 py-1.5 rounded-full border border-[#C9920A]/30 mb-3">
            Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight mb-4">
            Simple Plans with Complete Flexibility
          </h2>
          <p className="text-base text-stone-600 mb-8">
            Every shop gets full access to our {trialDays}-day free trial. Choose a plan when you are ready.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center bg-stone-200/80 p-1.5 rounded-xl border border-stone-300 shadow-inner">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billingCycle === 'monthly'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
                }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${billingCycle === 'annual'
                ? 'bg-[#1C1409] text-[#FFD97D] shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
                }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C9920A] text-white font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plansToDisplay.map((plan) => {
            const isPopular = plan.name.toUpperCase() === trialPlanName.toUpperCase() || plan.name.toUpperCase() === 'PRO';

            // Calculate prices based on billingCycle
            const annualOption = plan.pricing_options?.find((o) => o.duration_months === 12);
            const monthlyPrice = Math.round((plan.price || 0) / 100);
            const effectiveMonthly = billingCycle === 'annual' && annualOption
              ? Math.round(annualOption.monthly_equivalent_inr)
              : monthlyPrice;
            const annualTotal = annualOption ? Math.round(annualOption.offer_price_inr) : monthlyPrice * 12;

            const featuresObj = plan.features || {};

            return (
              <div
                key={plan.id || plan.name}
                className={`relative rounded-2xl flex flex-col justify-between transition-all ${isPopular
                  ? 'bg-white border-2 border-[#C9920A] shadow-xl shadow-[#C9920A]/10 scale-100 md:-translate-y-2'
                  : 'bg-white border border-[#EAE0CC] shadow-sm hover:shadow-md'
                  } p-7`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#C9920A] to-[#B37E00] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                    Most Popular • {trialDays}-Day Free Trial
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-stone-900 tracking-tight">{plan.name}</h3>
                    {isPopular && <Sparkles className="w-5 h-5 text-[#C9920A]" />}
                  </div>

                  <p className="text-xs text-stone-500 mb-6 min-h-[34px]">
                    {plan.note || 'Complete jewellery management suite for your retail operations.'}
                  </p>

                  {/* Price Display */}
                  <div className="mb-6 pb-6 border-b border-stone-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-stone-900">
                        ₹{effectiveMonthly.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">/ month</span>
                    </div>

                    {billingCycle === 'annual' ? (
                      <div className="text-xs text-[#7A5500] font-semibold mt-1.5 flex items-center gap-1">
                        <span>Billed annually at ₹{annualTotal.toLocaleString('en-IN')}/yr</span>
                        <span className="bg-[#FFF3CD] px-1.5 py-0.5 rounded text-[10px]">Save 20%</span>
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400 mt-1.5">Billed monthly, cancel anytime</div>
                    )}
                  </div>

                  {/* Capacity & Limits */}
                  <div className="space-y-2.5 mb-6 text-xs text-stone-700 bg-[#F9F6F0] p-3.5 rounded-xl border border-[#EAE0CC]">
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center gap-1.5 text-stone-600">
                        <Users className="w-3.5 h-3.5 text-[#C9920A]" /> User Accounts:
                      </span>
                      <span className="font-bold text-stone-900">
                        {plan.max_users === 1 ? '1 User' : `Up to ${plan.max_users} Users`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center gap-1.5 text-stone-600">
                        <Receipt className="w-3.5 h-3.5 text-[#C9920A]" /> Monthly Bills:
                      </span>
                      <span className="font-bold text-stone-900">
                        {plan.max_invoices_per_month ? `${plan.max_invoices_per_month} Invoices/mo` : 'Unlimited Invoices'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center gap-1.5 text-stone-600">
                        <Building2 className="w-3.5 h-3.5 text-[#C9920A]" /> Shop Branches:
                      </span>
                      <span className="font-bold text-stone-900">
                        {plan.max_branches === 1 ? '1 Branch' : `${plan.max_branches} Branches`}
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 text-xs mb-8">
                    <div className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider mb-2">
                      Included Modules:
                    </div>

                    <div className="flex items-center gap-2.5">
                      {featuresObj.billing !== false ? (
                        <CheckCircle2 className="w-4 h-4 text-[#C9920A] flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-300 flex-shrink-0" />
                      )}
                      <span className={featuresObj.billing !== false ? 'text-stone-800 font-medium' : 'text-stone-400'}>
                        Estimate & GST Billing Engine
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#C9920A] flex-shrink-0" />
                      <span className="text-stone-800 font-medium">Live Gold & Silver Rate Auto-Sync</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {featuresObj.gst_reports !== false ? (
                        <CheckCircle2 className="w-4 h-4 text-[#C9920A] flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-300 flex-shrink-0" />
                      )}
                      <span className={featuresObj.gst_reports !== false ? 'text-stone-800 font-medium' : 'text-stone-400'}>
                        Daybook & GST 3B Summary
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {featuresObj.inventory ? (
                        <CheckCircle2 className="w-4 h-4 text-[#C9920A] flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-300 flex-shrink-0" />
                      )}
                      <span className={featuresObj.inventory ? 'text-stone-800 font-medium' : 'text-stone-400 line-through'}>
                        Stock Ledger & Category Inventory
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {featuresObj.gold_loans ? (
                        <CheckCircle2 className="w-4 h-4 text-[#C9920A] flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-300 flex-shrink-0" />
                      )}
                      <span className={featuresObj.gold_loans ? 'text-stone-800 font-medium' : 'text-stone-400 line-through'}>
                        Jewel Loans (Pawn / Girvi) + Photos
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {featuresObj.multi_branch ? (
                        <CheckCircle2 className="w-4 h-4 text-[#C9920A] flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-300 flex-shrink-0" />
                      )}
                      <span className={featuresObj.multi_branch ? 'text-stone-800 font-medium' : 'text-stone-400 line-through'}>
                        Multi-Branch Central Management
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Button */}
                <Link href="/register" className="w-full">
                  <Button
                    className={`w-full h-11 text-sm font-semibold ${isPopular
                      ? 'bg-gradient-to-r from-[#C9920A] to-[#B37E00] hover:from-[#B37E00] hover:to-[#996B00] text-white shadow-md shadow-[#C9920A]/20'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                      }`}
                  >
                    {isPopular ? `Start ${trialDays}-Day Free Trial` : 'Choose Plan'}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Why Jewellers Choose JewelTrack */}
      <section className="py-20 bg-[#1C1409] text-white px-4 sm:px-6 lg:px-8 border-t border-[#C9920A]/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Why Jewellers Across India Trust JewelTrack
            </h2>
            <p className="text-sm text-stone-400">
              Built with precision for counter speed, calculation accuracy, and peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-[#261B0D] p-6 rounded-2xl border border-[#C9920A]/20">
              <div className="w-10 h-10 rounded-lg bg-[#3A2800] text-[#FFD97D] flex items-center justify-center mb-4">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">POS Thermal & A4 Printing</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Connect directly to your 2-inch or 3-inch counter thermal printer for quick estimates, or generate formal A4 GST tax invoices with your custom shop logo and owner signature.
              </p>
            </div>

            <div className="bg-[#261B0D] p-6 rounded-2xl border border-[#C9920A]/20">
              <div className="w-10 h-10 rounded-lg bg-[#3A2800] text-[#FFD97D] flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Encrypted Cloud Security</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Never worry about lost physical ledgers or corrupted hard drives. Your billing records, customer debts, and loan photos are securely backed up in the cloud with strict privacy.
              </p>
            </div>

            <div className="bg-[#261B0D] p-6 rounded-2xl border border-[#C9920A]/20">
              <div className="w-10 h-10 rounded-lg bg-[#3A2800] text-[#FFD97D] flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Mobile & Tablet Friendly</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Check daily sales from anywhere. JewelTrack works seamlessly on laptops, desktop computers, iPads, and Android tablets right in your browser without cumbersome installation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Accordion Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 bg-[#FFF3CD] text-[#7A5500] text-xs font-bold px-3.5 py-1 rounded-full border border-[#C9920A]/30 mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-stone-600">
            Everything you need to know about the product, billing, and trial setup.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div
              key={faq.q}
              className="bg-white rounded-xl border border-[#EAE0CC] overflow-hidden transition-all shadow-sm"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-semibold text-stone-900 hover:text-[#7A5500] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 flex-shrink-0 ${openFaq === idx ? 'rotate-180 text-[#C9920A]' : ''
                    }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-[#1C1409] via-[#2E200C] to-[#1C1409] text-white py-16 px-4 sm:px-6 lg:px-8 text-center border-t border-[#C9920A]/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to Modernise Your Jewellery Shop?
          </h2>
          <p className="text-base text-stone-300 mb-8 max-w-xl mx-auto">
            Join jewellery retailers streamlining their daily billing, stock, and gold loans with JewelTrack. Start your {trialDays}-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-9 text-base font-semibold bg-gradient-to-r from-[#C9920A] to-[#B37E00] hover:from-[#B37E00] hover:to-[#996B00] text-white shadow-xl shadow-[#C9920A]/30 border border-[#FFD97D]/30">
                Start {trialDays}-Day Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                className="h-12 px-8 text-base border-stone-600 text-stone-300 hover:bg-stone-800 hover:text-white"
              >
                Existing Shop Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Polished Footer */}
      <footer className="bg-[#140E06] border-t border-stone-800/80 py-10 px-4 sm:px-6 lg:px-8 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#C9920A] flex items-center justify-center text-[#1C1409] font-bold">
              <Gem className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-stone-200">JewelTrack</span>
            <span className="text-stone-600">|</span>
            <span>Jewellery ERP & Retail Management</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-[#FFD97D] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#FFD97D] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#FFD97D] transition-colors">FAQ</a>
            <Link href="/login" className="hover:text-[#FFD97D] transition-colors">Login</Link>
            <Link href="/register" className="hover:text-[#FFD97D] transition-colors">Register</Link>
          </div>

          <div>
            © {new Date().getFullYear()} JewelTrack. Built for Indian Jewellery Retailers.
          </div>
        </div>
      </footer>

    </main>
  );
}
