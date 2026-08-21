'use client';

import { getPageTitle } from "@/helper/getPageTitle ";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Crown, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

const baseNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Gold Rate', href: '/dashboard/rate', icon: '💰' },
  { label: 'Estimate Bill', href: '/dashboard/billing/estimate', icon: '🧾' },
  { label: 'New Bill', href: '/dashboard/billing/new', icon: '➕' },
  { label: 'Customers', href: '/dashboard/customers', icon: '👥' },
  { label: 'Category', href: '/dashboard/categories', icon: '💍' },
  { label: 'Inventory', href: '/dashboard/inventory', icon: '📦' },
  { label: 'Staff & Roles', href: '/dashboard/settings/staff', icon: '🧑‍💼' },
  { label: 'Report', href: '/dashboard/report', icon: '📈' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isSuperAdmin } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    if (user?.role === 'SUPER_ADMIN') {
      router.replace('/admin/plans');
    }
  }, [user, router]);

  // Query current subscription to display trial / expiry status in topbar
  const { data: subscription } = useQuery({
    queryKey: ['shop-current-subscription'],
    queryFn: async () => {
      const res = await api.get('/subscription/current');
      return res.data;
    },
    enabled: mounted && !!user && !isSuperAdmin(),
    staleTime: 60 * 1000,
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = baseNavItems.filter((item) => {
    // Cashiers only need billing, rate, and customers
    if (mounted && user?.role === 'CASHIER') {
      return ['/dashboard', '/dashboard/rate', '/dashboard/billing/estimate', '/dashboard/billing/new', '/dashboard/customers'].includes(item.href);
    }
    return true;
  });

  const isTrial = subscription?.status === 'TRIAL';
  const isExpired = subscription?.is_expired;
  const daysLeft = subscription?.days_remaining ?? 0;

  if (mounted && user?.role === 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-center space-y-3">
          <Crown className="w-10 h-10 text-gold mx-auto animate-bounce" />
          <h2 className="text-xl font-bold">Redirecting to Super Admin Portal...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-page">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={`bg-sidebar-dark flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-56"} flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gold/10">
          {!collapsed && (
            <span className="text-gold-text font-bold text-lg tracking-wide transition-all duration-700">JewelTrack</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-gold-text text-lg ml-auto"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-gold-text shadow-sm'
                    : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-gold-text'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="transition-all duration-300 whitespace-nowrap overflow-hidden text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Super Admin Link in Sidebar if applicable */}
          {mounted && isSuperAdmin() && (
            <Link
              href="/admin/plans"
              className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm transition-colors bg-gold/15 text-gold hover:bg-gold/25 mt-2 border border-gold/30"
            >
              <Crown className="w-5 h-5 text-gold flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-bold whitespace-nowrap overflow-hidden">Super Admin</span>
              )}
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="px-2.5 py-4 border-t border-gold/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-gold-text hover:bg-sidebar-active/60 w-full"
          >
            <span className="text-lg">🚪</span>
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gold/20 h-16 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-base font-bold text-foreground capitalize tracking-tight">{getPageTitle(pathname)}</h1>

          <div className="flex items-center gap-4">
            {/* Free Trial / Expiry Banner (mounted only to prevent hydration mismatch) */}
            {mounted && subscription && isTrial && (
              <Link
                href="/dashboard/settings?tab=subscription"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-gold/15 to-amber-500/10 text-amber-900 border border-gold/40 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold hover:bg-gold/20 transition-all shadow-sm group"
              >
                <Sparkles className="w-4 h-4 text-gold animate-pulse flex-shrink-0" />
                <span>Trial: <strong>{daysLeft}d left</strong></span>
                <span className="text-xs font-bold text-amber-700 underline ml-0.5 group-hover:text-amber-900">
                  Upgrade
                </span>
              </Link>
            )}

            {mounted && subscription && isExpired && (
              <Link
                href="/dashboard/settings?tab=subscription"
                className="flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold hover:bg-rose-100 transition-all shadow-sm"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
                <span>Trial Expired</span>
                <span className="text-xs font-bold underline ml-0.5 text-rose-800">Pick Plan</span>
              </Link>
            )}

            {/* User & Role Badge (mounted only to prevent hydration mismatch) */}
            {mounted && user && (
              <div className="flex items-center gap-2.5 text-sm bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs">
                <div className="w-7 h-7 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center text-xs">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="font-semibold text-slate-800 text-sm">{user.name}</span>
                <span
                  className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${
                    user.role === 'SUPER_ADMIN'
                      ? 'bg-gold/15 text-gold border-gold/30'
                      : user.role === 'SHOP_OWNER'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : user.role === 'MANAGER'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {user.role?.replace('_', ' ')}
                </span>
              </div>
            )}

            {/* Super Admin Quick Link */}
            {mounted && isSuperAdmin() && (
              <Link
                href="/admin/plans"
                className="flex items-center gap-1.5 bg-gold text-white px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold hover:bg-gold/90 transition-colors shadow-sm"
              >
                <Crown className="w-4 h-4" />
                <span>Admin Portal</span>
              </Link>
            )}

            <div className="bg-gold-light text-gold-dark text-xs sm:text-sm px-4 py-1.5 rounded-full border border-gold/20 font-bold hidden sm:block">
              22K - ₹6,200 · 18K - ₹5,100
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}