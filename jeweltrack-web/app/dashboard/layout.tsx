'use client';

import { getPageTitle } from "@/helper/getPageTitle ";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Crown, Sparkles, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

// Daily Counter Operations
const primaryNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Gold Rate', href: '/dashboard/rate', icon: '💰' },
  { label: 'Estimate Bill', href: '/dashboard/billing/estimate', icon: '🧾' },
  { label: 'New Bill', href: '/dashboard/billing/new', icon: '➕' },
  { label: 'Gold Loan', href: '/dashboard/loan', icon: '🪙' },
  { label: 'Customers', href: '/dashboard/customers', icon: '👥' },
  { label: 'Inventory', href: '/dashboard/inventory', icon: '📦' },
  { label: 'Report', href: '/dashboard/report', icon: '📈' },
];

// Configuration & Master Setup Group (Collapsible dropdown)
const settingsSubItems = [
  { label: 'Categories', href: '/dashboard/categories', icon: '💍' },
  { label: 'Staff & Roles', href: '/dashboard/settings/staff', icon: '🧑‍💼' },
  { label: 'Shop Settings', href: '/dashboard/settings', icon: '⚙️' },
];

// Clean centralized role permissions map
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SHOP_OWNER: ['*'], // Full access to all modules
  MANAGER: [
    '/dashboard',
    '/dashboard/rate',
    '/dashboard/billing/estimate',
    '/dashboard/billing/new',
    '/dashboard/loan',
    '/dashboard/customers',
    '/dashboard/categories',
    '/dashboard/inventory',
    '/dashboard/report',
  ],
  CASHIER: [
    '/dashboard',
    '/dashboard/rate',
    '/dashboard/billing/estimate',
    '/dashboard/billing/new',
    '/dashboard/customers',
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isSuperAdmin } = useAuthStore();

  const isSettingsActive =
    pathname.startsWith('/dashboard/settings') || pathname === '/dashboard/categories';

  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  useEffect(() => {
    setMounted(true);
    if (user?.role === 'SUPER_ADMIN') {
      router.replace('/admin/plans');
    }
  }, [user, router]);

  useEffect(() => {
    if (isSettingsActive) {
      setSettingsOpen(true);
    }
  }, [isSettingsActive]);

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

  const isAllowed = (href: string) => {
    if (!mounted || !user) return true;
    const allowedRoutes = ROLE_PERMISSIONS[user.role];
    if (!allowedRoutes || allowedRoutes.includes('*')) return true;
    return allowedRoutes.includes(href);
  };

  const visiblePrimaryItems = primaryNavItems.filter((item) => isAllowed(item.href));
  const visibleSettingsItems = settingsSubItems.filter((item) => isAllowed(item.href));

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
        className={`bg-sidebar-dark flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-56"
        } flex-shrink-0 select-none`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gold/10 h-14 flex-shrink-0">
          {!collapsed && (
            <span className="text-gold-text font-bold text-base tracking-wide transition-all duration-500">
              JewelTrack
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-gold-text text-base ml-auto cursor-pointer p-1"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation Items (Compact single-viewport fit) */}
        <nav className="flex-1 px-2 py-2.5 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {/* Primary Operations */}
          {visiblePrimaryItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-gold-text shadow-xs'
                    : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-gold-text'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="transition-all duration-300 whitespace-nowrap overflow-hidden text-xs sm:text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Collapsible Settings / Masters Group */}
          {visibleSettingsItems.length > 0 && (
            <div className="mt-0.5">
              {collapsed ? (
                <Link
                  href="/dashboard/settings"
                  className={`flex items-center justify-center p-2 rounded-xl text-sm font-medium transition-colors ${
                    isSettingsActive
                      ? 'bg-sidebar-active text-gold-text shadow-xs'
                      : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-gold-text'
                  }`}
                  title="Settings & Setup"
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      isSettingsActive
                        ? 'bg-sidebar-active/50 text-gold-text'
                        : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-gold-text'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap overflow-hidden font-medium">Settings & Setup</span>
                    </div>
                    {settingsOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {/* Dropdown Children */}
                  {settingsOpen && (
                    <div className="mt-1 flex flex-col gap-0.5 pl-3 border-l border-gold/15 ml-3">
                      {visibleSettingsItems.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isSubActive
                                ? 'bg-sidebar-active text-gold-text font-bold shadow-xs'
                                : 'text-slate-300 hover:bg-sidebar-active/50 hover:text-gold-text'
                            }`}
                          >
                            <span className="text-xs">{sub.icon}</span>
                            <span className="whitespace-nowrap overflow-hidden">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Super Admin Link in Sidebar if applicable */}
          {mounted && isSuperAdmin() && (
            <Link
              href="/admin/plans"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs sm:text-sm transition-colors bg-gold/15 text-gold hover:bg-gold/25 mt-1 border border-gold/30"
              title="Super Admin Portal"
            >
              <Crown className="w-4 h-4 text-gold flex-shrink-0" />
              {!collapsed && (
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap overflow-hidden">
                  Super Admin
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Logout (Compact) */}
        <div className="px-2 py-3 border-t border-gold/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-gold-text hover:bg-sidebar-active/60 w-full cursor-pointer"
            title="Logout"
          >
            <span className="text-base">🚪</span>
            {!collapsed && <span className="text-xs sm:text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gold/20 h-14 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-base font-bold text-foreground capitalize tracking-tight">
            {getPageTitle(pathname)}
          </h1>

          <div className="flex items-center gap-4">
            {/* Free Trial / Expiry Banner */}
            {mounted && subscription && isTrial && (
              <Link
                href="/dashboard/settings?tab=subscription"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-gold/15 to-amber-500/10 text-amber-900 border border-gold/40 px-3.5 py-1 rounded-full text-xs sm:text-sm font-semibold hover:bg-gold/20 transition-all shadow-xs group"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse flex-shrink-0" />
                <span>Trial: <strong>{daysLeft}d left</strong></span>
                <span className="text-xs font-bold text-amber-700 underline ml-0.5 group-hover:text-amber-900">
                  Upgrade
                </span>
              </Link>
            )}

            {mounted && subscription && isExpired && (
              <Link
                href="/dashboard/settings?tab=subscription"
                className="flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-1 rounded-full text-xs sm:text-sm font-semibold hover:bg-rose-100 transition-all shadow-xs"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
                <span>Trial Expired</span>
                <span className="text-xs font-bold underline ml-0.5 text-rose-800">Pick Plan</span>
              </Link>
            )}

            {/* User & Role Badge */}
            {mounted && user && (
              <div className="flex items-center gap-2.5 text-sm bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl shadow-xs">
                <div className="w-6 h-6 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center text-xs">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="font-semibold text-slate-800 text-xs sm:text-sm">{user.name}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
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
                className="flex items-center gap-1.5 bg-gold text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold hover:bg-gold/90 transition-colors shadow-xs"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>
            )}

            <div className="bg-gold-light text-gold-dark text-xs sm:text-sm px-3.5 py-1 rounded-full border border-gold/20 font-bold hidden sm:block">
              22K - ₹6,200 · 18K - ₹5,100
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-3 lg:px-6 lg:py-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
}