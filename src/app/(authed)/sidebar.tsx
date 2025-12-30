"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from "next/navigation"
import { MessageSquare, FileText, Users, Building2, FolderTree, LayoutDashboard, Settings } from 'lucide-react'
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: `/dashboard`, icon: LayoutDashboard },
    { name: 'RFC', href: `/rfc`, icon: MessageSquare },
    { name: 'ADR', href: `/adr`, icon: FileText },
  ]

  const adminNavigation = [
    { name: 'Manage Users', href: `/admin/users`, icon: Users },
    { name: 'Manage Organization', href: `/admin/organization`, icon: Building2 },
    { name: 'Manage Contexts', href: `/admin/contexts`, icon: FolderTree },
  ]

  const router = useRouter();
  const logout = () => {
    fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => { })
    try { localStorage.removeItem('auth') } catch (e) { }
    router.push('/')
  }

  const [auth, setAuth] = useState<{ isAdmin?: boolean; contextIsAdmin?: any[] } | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('auth');
      if (!raw) { setAuth(null); return; }
      const parsed = JSON.parse(raw);
      setAuth({ isAdmin: !!parsed?.isAdmin, contextIsAdmin: parsed?.contextIsAdmin ?? [] });
    } catch (e) {
      setAuth(null);
    }
  }, []);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30 md:hidden"
          onClick={onClose}
          aria-label="Close sidebar overlay"
        />
      )}
      <aside
        className={cn(
          "fixed z-50 top-0 left-0 h-full w-64 flex flex-col bg-cdmsa-sidebar transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          "md:static md:translate-x-0 md:flex"
        )}
        aria-label="Sidebar"
      >
        {/* Logo */}
        <div className="flex items-center justify-center pt-6 pb-8">
          <div className="relative">
            {/* tvoj SVG logo */}
            <svg width="131" height="96" viewBox="0 0 131 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.6">
                        <line y1="-1.50402" x2="26.6757" y2="-1.50402"
                              transform="matrix(0.72131 -0.692613 0.691627 0.722255 44.282 82.0857)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="46.9282" y2="-1.50402"
                              transform="matrix(0.999747 0.022497 -0.0224356 0.999748 13.9697 54.8997)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="46.6837" y2="-1.50402"
                              transform="matrix(0.671888 0.740653 -0.739738 0.672895 33.4744 15.0444)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="38.7414" y2="-1.50402"
                              transform="matrix(0.646343 -0.763047 0.762175 0.647372 74.3296 50.6768)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="41.2294" y2="-1.50402"
                              transform="matrix(0.990922 0.134438 -0.134077 0.990971 76.9661 58.8589)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="40.2477" y2="-1.50402"
                              transform="matrix(0.464978 -0.885322 0.884798 0.465975 10.0161 50.6768)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <ellipse cx="99.3709" cy="19.7956" rx="9.22536" ry="9.23798" fill="#8eb4eeff"/>
                        <ellipse cx="119.798" cy="64.2695" rx="11.2022" ry="11.2175" fill="#83afd5ff"/>
                        <ellipse cx="69.8488" cy="54.8997" rx="13.1791" ry="13.1971" fill="#256a98ff"/>
                        <ellipse cx="30.3118" cy="10.5577" rx="10.5433" ry="10.5577" fill="#89befaff"/>
                        <ellipse cx="9.88431" cy="52.9199" rx="9.88431" ry="9.89783" fill="#63a2bfff"/>
                        <ellipse cx="39.01" cy="86.5729" rx="9.22536" ry="9.23798" fill="#5691daff"/>
                    </g>
                </svg>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-[#83afd5ff] text-gray-900"
                    : "text-gray-700 hover:bg-cdmsa-secondary"
                )}
                onClick={onClose}
              >
                <item.icon className="mr-3 h-5 w-5" strokeWidth={2} />
                {item.name}
              </Link>
            )
          })}

          {/* Admin Navigation */}
          <div className="pt-4">
            {(() => {
              const itemsToShow = auth?.isAdmin
                ? adminNavigation
                : (auth?.contextIsAdmin && auth.contextIsAdmin.length > 0)
                  ? adminNavigation.filter(i => i.name === 'Manage Contexts')
                  : [];

              return itemsToShow.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-[#83afd5ff] text-gray-900"
                        : "text-gray-700 hover:bg-cdmsa-secondary"
                    )}
                    onClick={onClose}
                  >
                    <item.icon className="mr-3 h-5 w-5" strokeWidth={2} />
                    {item.name}
                  </Link>
                )
              })
            })()}
          </div>
        </nav>

        {/* Settings + Logout */}
        <div className="p-4 mt-auto space-y-3">
          {/* Settings link */}
          <Link
            href="/admin/settings"
            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-cdmsa-secondary rounded-lg transition-colors w-full"
            onClick={onClose}
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5" strokeWidth={2} />
            <span className="ml-3">Settings</span>
          </Link>


          {/* Logout */}
          <button
            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-[#F8D7DA] rounded-lg transition-colors w-full cursor-pointer focus:outline-none"
            onClick={logout}
            aria-label="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
