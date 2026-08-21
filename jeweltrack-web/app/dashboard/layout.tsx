'use client';

import { getPageTitle } from "@/helper/getPageTitle ";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Crown } from "lucide-react";

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
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isSuperAdmin } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = baseNavItems.filter((item) => {
    // Cashiers only need billing, rate, and customers
    if (user?.role === 'CASHIER') {
      return ['/dashboard', '/dashboard/rate', '/dashboard/billing/estimate', '/dashboard/billing/new', '/dashboard/customers'].includes(item.href);
    }
    return true;
  });

  return (
    <div className="min-h-screen flex bg-page">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={`bg-sidebar-dark flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-48"} flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gold/10">
          {!collapsed && (
            <span className="text-gold-text font-medium text-base transition-all duration-700">JewelTrack</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-gold-text text-lg ml-auto"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-gold-text'
                    : 'text-muted-foreground hover:bg-sidebar-active/50 hover:text-gold-text'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {!collapsed && (
                  <span className="transition-all duration-300 whitespace-nowrap overflow-hidden text-xs">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Super Admin Link in Sidebar if applicable */}
          {isSuperAdmin() && (
            <Link
              href="/admin/plans"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors bg-gold/15 text-gold hover:bg-gold/25 mt-2 border border-gold/30"
            >
              <Crown className="w-4 h-4 text-gold flex-shrink-0" />
              {!collapsed && (
                <span className="text-xs font-semibold whitespace-nowrap overflow-hidden">Super Admin</span>
              )}
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="px-2 py-4 border-t border-gold/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-gold-text hover:bg-sidebar-active/50 w-full"
          >
            <span className="text-base">🚪</span>
            {!collapsed && <span className="text-xs">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gold/20 h-14 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-sm font-semibold text-foreground capitalize">{getPageTitle(pathname)}</h1>

          <div className="flex items-center gap-4">
            {/* User & Role Badge */}
            {user && (
              <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center text-[10px]">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="font-medium text-slate-800">{user.name}</span>
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
            {isSuperAdmin() && (
              <Link
                href="/admin/plans"
                className="flex items-center gap-1.5 bg-gold text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-gold/90 transition-colors shadow-sm"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>
            )}

            <div className="bg-gold-light text-gold-dark text-xs px-3.5 py-1.5 rounded-full border border-gold/20 font-bold">
              22K - ₹6,200 · 18K - ₹5,100
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 px-5 overflow-auto">{children}</main>
      </div>
    </div>
  );
}