'use client';

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { usePathname ,useRouter } from "next/navigation";
import { useState } from "react";



// const navItems = [
//   { label: 'Dashboard', href: '/dashboard', icon: '📊' },
//   { label: 'Gold Rate', href: '/dashboard/rate', icon: '📈' },
//   { label: 'Estimate Bill', href: '/dashboard/billing/estimate', icon: '📄' },
//   { label: 'New Bill', href: '/dashboard/billing/new', icon: '➕' },
//   { label: 'Customers', href: '/dashboard/customers', icon: '👥' },
//   { label: 'Category', href: '/dashboard/categories', icon: '👥' },
//   { label: 'Loans', href: '/dashboard/loan', icon: '💍' },
//   { label: 'inventory', href: '/dashboard/inventory', icon: '📦' },
//   { label: 'Report', href: '/dashboard/report', icon: '📦' },
// ];

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Gold Rate', href: '/dashboard/rate', icon: '💰' },
  { label: 'Estimate Bill', href: '/dashboard/billing/estimate', icon: '🧾' },
  { label: 'New Bill', href: '/dashboard/billing/new', icon: '➕' },
  { label: 'Customers', href: '/dashboard/customers', icon: '👥' },
  { label: 'Category', href: '/dashboard/categories', icon: '🗂️' },
  { label: 'Loans', href: '/dashboard/loan', icon: '💍' },
  { label: 'Inventory', href: '/dashboard/inventory', icon: '📦' },
  { label: 'Report', href: '/dashboard/report', icon: '📊' },
];

export default function DashboardLayout({children} : {children:React.ReactNode}){

    const [collapsed,setCollapsed] = useState(true);
    const pathname = usePathname()
    const router = useRouter();
    const { logout} = useAuthStore()


    const handleLogout = ()=>{
        logout();
        router.push('/login')
    }


return(
    <div className="min-h-screen flex bg-page">
        {/* Sidebar */}
        <aside onMouseEnter={()=>(setCollapsed(false))} onMouseLeave={()=>setCollapsed(true)} className={`bg-sidebar-dark flex flex-col transition-all duration-300 ${collapsed? "w-16": "w-44"} flex-shrink-0`}>
            {/* Logo */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-gold/10">
                {
                    !collapsed && (
                        <span className="text-gold-text font-medium text-base transition-all duration-700">JewelTrack</span>
                    )
                }
                <button onClick={()=>setCollapsed(!collapsed)}
                 className="text-muted-foreground hover:text-gold-text text-lg  ml-auto">
                    {collapsed ? '→' : '←' }
                </button>
            </div>

             {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
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
                {!collapsed && <span className="transition-all duration-300 whitespace-nowrap overflow-hidden">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div  className="px-2 py-4 border-t border-gold/10">
         <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-gold-text hover:bg-sidebar-active/50 w-full"
          >
            <span className="text-base">🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        </aside>

        
          {/* Main */}
          <div className="flex-1 flex flex-col min-2-0">
            {/* Topbar */}
            <header className="bg-white border-b border-gold h-14 flex items-center justify-between px-6 flex-shrink-0">
                <h1 className="text-sm font-medium text-foreground capitalize">{pathname.split('/').pop() || 'Dashboard'}</h1>
            <div className="bg-gold-light text-gold-dark text-sm  px-4 py-1.5 rounded-full border border-gold/20 font-bold">
                 22K - ₹6,200 · 18K - ₹5,100
            </div>
            </header>

            <main className="flex-1 p-4 px-5   overflow-auto">
                {children}
            </main>

          </div>
        

    </div> 

)

}