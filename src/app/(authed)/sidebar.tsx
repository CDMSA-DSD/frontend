"use client"
import { MessageSquare, FileText, Users, Building2, FolderTree, LayoutDashboard, Settings } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

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

  // When we implement admin roles, we can conditionally render this section
  const adminNavigation = [
    { name: 'Manage users', href: `/admin/users`, icon: Users },
    { name: 'Manage Organization', href: `/admin/organization`, icon: Building2 },
    { name: 'Manage Contexts', href: `/admin/contexts`, icon: FolderTree },
  ]

  const logout = (router: AppRouterInstance) => {
    // This endpoint does not exist yet; placeholder for future implementation
    fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/login');
  }

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
          "fixed z-50 top-0 left-0 h-full w-64 flex flex-col bg-[#E8E5F1] transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          "md:static md:translate-x-0 md:flex"
        )}
        aria-label="Sidebar"
      >
        {/* Logo */}
        <div className="flex items-center justify-center pt-6 pb-8">
          <div className="relative">
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
                  <ellipse cx="99.3709" cy="19.7956" rx="9.22536" ry="9.23798" fill="#AEA9E8"/>
                  <ellipse cx="119.798" cy="64.2695" rx="11.2022" ry="11.2175" fill="#C4B7FF"/>
                  <ellipse cx="69.8488" cy="54.8997" rx="13.1791" ry="13.1971" fill="#5E50A4"/>
                  <ellipse cx="30.3118" cy="10.5577" rx="10.5433" ry="10.5577" fill="#A67DFF"/>
                  <ellipse cx="9.88431" cy="52.9199" rx="9.88431" ry="9.89783" fill="#6A63BF"/>
                  <ellipse cx="39.01" cy="86.5729" rx="9.22536" ry="9.23798" fill="#5658DA"/>
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
                    ? "bg-[#C5B8E0] text-gray-900"
                    : "text-gray-700 hover:bg-[#D4CBEB]"
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
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-[#C5B8E0] text-gray-900"
                      : "text-gray-700 hover:bg-[#D4CBEB]"
                  )}
                  onClick={onClose}
                >
                  <item.icon className="mr-3 h-5 w-5" strokeWidth={2} />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Settings Button */}
        <div className="p-4 mt-auto">
          <button
            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-[#D4CBEB] rounded-lg transition-colors w-full cursor-pointer focus:outline-none"
            onClick={onClose}
          >
            <Settings className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </aside>
    </>
  )
}