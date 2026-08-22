'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Crown, Shield, CreditCard, Store, LogOut, ArrowLeft } from 'lucide-react';

const adminNavItems = [
  { label: 'Subscription Plans', href: '/admin/plans', icon: CreditCard },
  { label: 'Registered Shops', href: '/admin/shops', icon: Store },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Super Admin Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
        {/* Branding */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-black">
            <Crown className="w-5 h-5 text-slate-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base tracking-tight">JewelTrack</span>
              <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-400">SaaS Management Portal</p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-3.5 m-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs border border-slate-700">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Super Admin'}</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <Shield className="w-3 h-3 text-slate-400" />
              <span>Super Administrator</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1.5">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Platform Management
          </div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to App & Logout */}
        <div className="p-3 border-t border-slate-800/80 flex flex-col gap-1">
          {user?.shop_id && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Shop Dashboard</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors w-full cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900">
              {pathname === '/admin/plans' ? 'Subscription Plans' : pathname === '/admin/shops' ? 'Registered Shops & Tenants' : 'Super Admin Portal'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Platform Online
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
