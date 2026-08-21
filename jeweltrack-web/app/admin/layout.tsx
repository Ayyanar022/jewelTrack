'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Crown, Shield, CreditCard, Store, LogOut, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const adminNavItems = [
  { label: 'Subscription Plans', href: '/admin/plans', icon: CreditCard },
  { label: 'Registered Shops', href: '/admin/shops', icon: Store },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isSuperAdmin, isAuthenticated } = useAuthStore();
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
    <div className="min-h-screen flex bg-page">
      {/* Super Admin Sidebar */}
      <aside className="w-64 bg-sidebar-dark border-r border-gold/20 flex flex-col flex-shrink-0">
        {/* Branding */}
        <div className="px-6 py-6 border-b border-gold/15 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold-text">
            <Crown className="w-5 h-5 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-base tracking-wide">JewelTrack</span>
              <span className="text-[10px] uppercase font-bold bg-gold/20 text-gold px-1.5 py-0.5 rounded border border-gold/30">
                Admin
              </span>
            </div>
            <p className="text-xs text-muted-foreground">SaaS Management Portal</p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-4 m-3 rounded-xl bg-sidebar-active/60 border border-gold/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold text-white font-bold flex items-center justify-center text-xs shadow-sm">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">{user?.name || 'Super Admin'}</p>
            <div className="flex items-center gap-1 text-[10px] text-gold font-medium">
              <Shield className="w-3 h-3" />
              <span>Super Administrator</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1.5">
          <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Platform Management
          </div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-sidebar-active text-gold border border-gold/30 font-medium shadow-sm'
                    : 'text-muted-foreground hover:bg-sidebar-active/40 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-gold' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to App & Logout */}
        <div className="p-3 border-t border-gold/15 flex flex-col gap-1">
          {user?.shop_id && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-gold hover:bg-sidebar-active/40 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Shop Dashboard</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gold/20 h-14 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground capitalize">
              {pathname === '/admin/plans' ? 'Subscription Plans' : pathname === '/admin/shops' ? 'Registered Shops' : 'Super Admin Portal'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Platform Online
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto bg-slate-50/50">{children}</main>
      </div>
    </div>
  );
}
