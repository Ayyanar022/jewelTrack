'use client';

import { getPageTitle } from "@/helper/getPageTitle ";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Crown, Sparkles, ChevronDown, ChevronRight, Settings, Gem, LogOut, Briefcase, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

// Daily Counter Operations
const primaryNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Gold Rate', href: '/dashboard/rate', icon: '💰' },
  { label: 'Estimate Bill', href: '/dashboard/billing/estimate', icon: '🧾' },
  { label: 'New Bill', href: '/dashboard/billing/new', icon: '➕' },
  { label: 'Approvals', href: '/dashboard/approval', icon: '📋', featureKey: 'dealer_approval', tierBadge: 'ENT' },
  { label: 'Gold Scheme', href: '/dashboard/scheme', icon: '✨', featureKey: 'gold_schemes', tierBadge: 'PRO' },
  { label: 'Customers', href: '/dashboard/customers', icon: '👥' },
];

// Management Group (Collapsible dropdown)
const managementSubItems = [
  { label: 'Jewel Loan', href: '/dashboard/loan', icon: '🪙', featureKey: 'gold_loans', tierBadge: 'PRO' },
  { label: 'Inventory', href: '/dashboard/inventory', icon: '📦', featureKey: 'inventory', tierBadge: 'PRO' },
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
    '/dashboard/approval',
    '/dashboard/dealers',
    '/dashboard/loan',
    '/dashboard/scheme',
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
    '/dashboard/approval',
    '/dashboard/scheme',
    '/dashboard/customers',
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isSuperAdmin } = useAuthStore();

  const isManagementActive = managementSubItems.some((item) =>
    pathname === item.href || pathname.startsWith(item.href + '/')
  );

  const isSettingsActive = settingsSubItems.some((item) =>
    item.href === '/dashboard/settings'
      ? pathname === '/dashboard/settings'
      : pathname === item.href || pathname.startsWith(item.href + '/')
  );

  const [managementOpen, setManagementOpen] = useState(isManagementActive);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  useEffect(() => {
    setMounted(true);
    if (user?.role === 'SUPER_ADMIN') {
      router.replace('/admin/plans');
    }
  }, [user, router]);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (isManagementActive) {
      setManagementOpen(true);
    }
  }, [isManagementActive]);

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

  // Query latest daily metal rates for header badge
  const { data: recentRate } = useQuery({
    queryKey: ['recent-rate'],
    queryFn: () => api.get('/rate/recent-rate').then((r) => r.data),
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
  const visibleManagementItems = managementSubItems.filter((item) => isAllowed(item.href));
  const visibleSettingsItems = settingsSubItems.filter((item) => isAllowed(item.href));

  const isTrial = subscription?.status === 'TRIAL';
  const isExpired = subscription?.is_expired;
  const daysLeft = subscription?.days_remaining ?? 0;
  const isExpiringSoon = !isTrial && !isExpired && daysLeft <= 10 && daysLeft > 0;
  const isBillsNearingLimit =
    subscription?.usage?.max_invoices_per_month &&
    subscription.usage.max_invoices_per_month > 0 &&
    subscription.usage.monthly_bills_count >= subscription.usage.max_invoices_per_month * 0.85;

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
    <div className="h-dvh w-full flex bg-page overflow-hidden relative">
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMobileMenuOpen(false); }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Mobile Slide-Over Drawer (< 1024px) */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar-dark z-50 flex flex-col shadow-2xl lg:hidden transform transition-transform duration-300 ease-out select-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Brand Header */}
        <div className="flex items-center justify-between border-b border-gold/15 h-14 px-4 flex-shrink-0">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-amber-400/30 via-gold/40 to-amber-600/30 blur-[3px] opacity-60" />
              <div className="relative w-8 h-8 rounded-xl bg-slate-900 border border-gold/40 flex items-center justify-center shadow-xs">
                <span className="text-base leading-none select-none">💎</span>
              </div>
            </div>
            <span className="text-gold-text font-black text-base tracking-wide whitespace-nowrap">
              JewelTrack
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Profile in Mobile Drawer */}
        {mounted && user && (
          <div className="p-3 border-b border-gold/10 bg-slate-900/60 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center text-xs border border-gold/30 flex-shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border inline-block mt-0.5 ${
                  user.role === 'SUPER_ADMIN'
                    ? 'bg-gold/15 text-gold border-gold/30'
                    : user.role === 'SHOP_OWNER'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : user.role === 'MANAGER'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}
              >
                {user.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Live Rates Card in Mobile Drawer for Quick Reference */}
        {mounted && !isSuperAdmin() && recentRate?.rate_22k && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-gold/20 text-xs">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Today&apos;s Metal Rates</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center font-bold text-slate-200">
              <div className="bg-slate-950/60 p-1 rounded-lg">
                <div className="text-[9px] text-slate-400">22K</div>
                <div className="text-[11px] text-white">₹{recentRate.rate_22k.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-slate-950/60 p-1 rounded-lg">
                <div className="text-[9px] text-slate-400">18K</div>
                <div className="text-[11px] text-slate-300">₹{(recentRate.rate_18k || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-slate-950/60 p-1 rounded-lg">
                <div className="text-[9px] text-slate-400">Silver</div>
                <div className="text-[11px] text-slate-300">₹{(recentRate.rate_silver || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation List */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-1 overflow-y-auto">
          {/* Primary Operations */}
          {visiblePrimaryItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-gold-text shadow-xs'
                    : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-gold-text'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <span className="flex-1 flex items-center justify-between font-medium">
                  <span>{item.label}</span>
                  {item.featureKey && subscription?.plan?.features && subscription.plan.features[item.featureKey] === false && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.tierBadge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}

          {/* Collapsible Management Group */}
          {visibleManagementItems.length > 0 && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setManagementOpen(!managementOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isManagementActive ? 'bg-sidebar-active/50 text-gold-text' : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-gold-text'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 flex-shrink-0" />
                  <span>Management</span>
                </div>
                {managementOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {managementOpen && (
                <div className="mt-1 flex flex-col gap-1 pl-4 border-l border-gold/20 ml-4">
                  {visibleManagementItems.map((sub) => {
                    const isSubActive =
                      pathname === sub.href || pathname.startsWith(sub.href + '/');
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isSubActive
                            ? 'bg-sidebar-active text-gold-text font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-sidebar-active/50 hover:text-gold-text'
                        }`}
                      >
                        <span>{sub.icon}</span>
                        <span className="flex-1 flex items-center justify-between">
                          <span>{sub.label}</span>
                          {sub.featureKey && subscription?.plan?.features && subscription.plan.features[sub.featureKey] === false && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {sub.tierBadge}
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Collapsible Settings Group */}
          {visibleSettingsItems.length > 0 && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isSettingsActive ? 'bg-sidebar-active/50 text-gold-text' : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-gold-text'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  <span>Settings & Setup</span>
                </div>
                {settingsOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {settingsOpen && (
                <div className="mt-1 flex flex-col gap-1 pl-4 border-l border-gold/20 ml-4">
                  {visibleSettingsItems.map((sub) => {
                    const isSubActive =
                      pathname === sub.href ||
                      (sub.href !== '/dashboard/settings' && pathname.startsWith(sub.href + '/'));
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isSubActive
                            ? 'bg-sidebar-active text-gold-text font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-sidebar-active/50 hover:text-gold-text'
                        }`}
                      >
                        <span>{sub.icon}</span>
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Super Admin Link in Mobile Drawer */}
          {mounted && isSuperAdmin() && (
            <Link
              href="/admin/plans"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors bg-gold/15 text-gold hover:bg-gold/25 mt-2 border border-gold/30 font-bold"
            >
              <Crown className="w-4 h-4 text-gold flex-shrink-0" />
              <span>Super Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Mobile Drawer Logout Button */}
        <div className="p-3 border-t border-gold/15 flex-shrink-0">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-500/10 transition-colors w-full cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar - Visible on lg screens (>= 1024px) */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={`hidden lg:flex h-dvh bg-sidebar-dark flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-56"
          } flex-shrink-0 select-none z-30 shadow-md`}
      >
        {/* Logo / Brand Header */}
        <div
          className={`flex items-center border-b border-gold/10 h-14 flex-shrink-0 px-3.5 ${collapsed ? 'justify-center' : 'justify-between'
            }`}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden group">
            {/* JewelTrack Brand Gem with Gentle Glowing Ring Animation */}
            <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0">
              {/* Soft Golden Ambient Glow */}
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-amber-400/30 via-gold/40 to-amber-600/30 blur-[3px] opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />

              {/* Inner Badge */}
              <div className="relative w-8 h-8 rounded-xl bg-slate-900 border border-gold/40 flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:border-gold">
                <span className="text-base leading-none select-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                  💎
                </span>
              </div>
            </div>

            {!collapsed && (
              <span className="text-gold-text font-black text-base tracking-wide transition-all duration-300 whitespace-nowrap">
                JewelTrack
              </span>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-muted-foreground hover:text-gold-text text-base ml-auto cursor-pointer p-1 transition-colors"
              title="Collapse sidebar"
            >
              ←
            </button>
          )}
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
                className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors ${isActive
                    ? 'bg-sidebar-active text-gold-text shadow-xs'
                    : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-gold-text'
                  }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="transition-all duration-300 whitespace-nowrap overflow-hidden text-xs sm:text-sm font-medium flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.featureKey && subscription?.plan?.features && subscription.plan.features[item.featureKey] === false && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.tierBadge}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Collapsible Management Group */}
          {visibleManagementItems.length > 0 && (
            <div className="mt-0.5">
              {collapsed ? (
                <Link
                  href="/dashboard/loan"
                  className={`flex items-center justify-center p-2 rounded-xl text-sm font-medium transition-colors ${
                    isManagementActive
                      ? 'bg-sidebar-active text-gold-text shadow-xs'
                      : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-gold-text'
                  }`}
                  title="Management"
                >
                  <Briefcase className="w-5 h-5 flex-shrink-0" />
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setManagementOpen(!managementOpen)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      isManagementActive
                        ? 'bg-sidebar-active/50 text-gold-text'
                        : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-gold-text'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap overflow-hidden font-medium">Management</span>
                    </div>
                    {managementOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {/* Dropdown Children */}
                  {managementOpen && (
                    <div className="mt-1 flex flex-col gap-0.5 pl-3 border-l border-gold/15 ml-3">
                      {visibleManagementItems.map((sub) => {
                        const isSubActive =
                          pathname === sub.href || pathname.startsWith(sub.href + '/');
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
                            <span className="whitespace-nowrap overflow-hidden flex-1 flex items-center justify-between">
                              <span>{sub.label}</span>
                              {sub.featureKey && subscription?.plan?.features && subscription.plan.features[sub.featureKey] === false && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {sub.tierBadge}
                                </span>
                              )}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

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
                        const isSubActive =
                          pathname === sub.href ||
                          (sub.href !== '/dashboard/settings' && pathname.startsWith(sub.href + '/'));
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

        {/* Logout (Compact & Centered when Collapsed) */}
        <div className="px-2 py-3 border-t border-gold/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all w-full cursor-pointer group ${collapsed ? 'justify-center' : ''
              }`}
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors flex-shrink-0" />
            {!collapsed && (
              <span className="text-xs sm:text-sm font-medium text-slate-300 group-hover:text-rose-400">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden">
        {/* Topbar - Fixed Header */}
        <header className="bg-white border-b border-gold/20 h-14 flex items-center justify-between px-3 sm:px-4 lg:px-6 flex-shrink-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex-shrink-0"
              title="Open navigation menu"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-foreground capitalize tracking-tight truncate">
              {getPageTitle(pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Free Trial Status */}
            {mounted && subscription && isTrial && (
              <Link
                href="/dashboard/settings?tab=subscription"
                className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-2 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold hover:bg-amber-100 transition-all shadow-xs group"
                title="Free Trial Active"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse flex-shrink-0" />
                <span>Trial: <strong>{daysLeft}d</strong></span>
                <span className="hidden sm:inline underline ml-0.5 text-amber-950 font-black">Upgrade</span>
              </Link>
            )}

            {/* Plan Expired Alert */}
            {mounted && subscription && isExpired && (
              <Link
                href="/dashboard/settings?tab=subscription"
                className="flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-2 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold hover:bg-rose-100 transition-all shadow-xs"
                title="Subscription Expired"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
                <span>Expired</span>
                <span className="hidden sm:inline underline ml-0.5 text-rose-900 font-black">Renew</span>
              </Link>
            )}

            {/* Expiring Soon Alert (<= 10 days) */}
            {mounted && subscription && isExpiringSoon && (
              <Link
                href="/dashboard/settings?tab=subscription"
                className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 px-2 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold hover:bg-amber-100 transition-all shadow-xs"
                title="Subscription Expiring Soon"
              >
                <span>⚠️ {daysLeft}d</span>
                <span className="hidden sm:inline underline ml-0.5 text-amber-950 font-black">Renew</span>
              </Link>
            )}

            {/* Bills Limit Nearing Warning (>= 85% used) */}
            {mounted && isBillsNearingLimit && (
              <Link
                href="/dashboard/settings?tab=subscription"
                className="hidden xl:flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all shadow-xs"
                title="Monthly Invoice Limit Almost Reached"
              >
                <span>Bills: <strong>{subscription.usage.monthly_bills_count}/{subscription.usage.max_invoices_per_month}</strong></span>
                <span className="underline ml-0.5 text-amber-950 font-black">Upgrade</span>
              </Link>
            )}

            {/* Dynamic Live Bullion Rates Badge */}
            {mounted && !isSuperAdmin() && (
              <Link
                href="/dashboard/rate"
                className="hidden md:flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 transition-all px-3 py-1.5 rounded-xl border border-slate-700 shadow-xs text-xs group cursor-pointer"
                title="Today's Metal Rates — Click to update"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                {recentRate?.rate_22k ? (
                  <span className="font-bold tracking-tight text-slate-200">
                    22K: <strong className="text-white">₹{recentRate.rate_22k.toLocaleString('en-IN')}</strong>
                    <span className="hidden lg:inline">
                      <span className="mx-1 text-slate-500">·</span>
                      18K: <strong className="text-slate-300">₹{(recentRate.rate_18k || 0).toLocaleString('en-IN')}</strong>
                      <span className="mx-1 text-slate-500">·</span>
                      Silver: <strong className="text-slate-300">₹{(recentRate.rate_silver || 0).toLocaleString('en-IN')}</strong>
                    </span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">Rates Not Set Today · Update</span>
                )}
              </Link>
            )}

            {/* User & Role Badge */}
            {mounted && user && (
              <div className="flex items-center gap-2 text-sm bg-slate-50 border border-slate-200 px-2 sm:px-3 py-1 rounded-xl shadow-xs">
                <div className="w-6 h-6 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center text-xs flex-shrink-0">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="font-semibold text-slate-800 text-xs sm:text-sm max-w-[80px] sm:max-w-[120px] truncate">{user.name}</span>
                <span
                  className={`hidden sm:inline text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${user.role === 'SUPER_ADMIN'
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
                className="flex items-center gap-1.5 bg-gold text-white px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold hover:bg-gold/90 transition-colors shadow-xs"
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Portal</span>
              </Link>
            )}
          </div>
        </header>

        {/* Global Subscription Expired Restricted Notice Banner */}
        {mounted && subscription && isExpired && !isSuperAdmin() && (
          <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-white px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 border-b border-rose-800/60 shadow-xs flex-shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span>
                <strong className="text-rose-200">Plan Expired:</strong> Restricted mode active. Official GST invoicing & stock entry are locked.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard/billing/estimate"
                className="bg-white/15 hover:bg-white/25 text-white font-bold px-2.5 py-1 rounded-xl transition-all text-xs border border-white/20 flex items-center gap-1"
              >
                <span>🧾 Estimate</span>
              </Link>
              <Link
                href="/dashboard/settings?tab=subscription"
                className="bg-gradient-to-r from-gold via-amber-400 to-amber-500 text-slate-950 font-black px-3 py-1 rounded-xl transition-all text-xs hover:brightness-105 shadow-xs"
              >
                ⚡ Renew Plan
              </Link>
            </div>
          </div>
        )}

        <main className="flex-1 px-3 py-3 sm:px-5 sm:py-3.5 lg:px-6 lg:py-4 overflow-y-auto overflow-x-hidden min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}