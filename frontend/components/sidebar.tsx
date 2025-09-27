'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard,
  Package,
  Tag,
  Warehouse,
  Truck,
  BarChart3,
  ArrowRightLeft,
  AlertTriangle,
  FileText,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) {
    return null
  }

  const navigationGroups = [
    {
      title: 'Products & Inventory',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Products',
          href: '/products',
          icon: Package,
        },
        {
          name: 'Categories',
          href: '/categories',
          icon: Tag,
        },
        {
          name: 'Stock Levels',
          href: '/inventory/stock',
          icon: BarChart3,
        },
      ]
    },
    {
      title: 'Suppliers & Warehouses',
      items: [
        {
          name: 'Suppliers',
          href: '/suppliers',
          icon: Truck,
        },
        {
          name: 'Warehouses',
          href: '/warehouses',
          icon: Warehouse,
        },
      ]
    },
    {
      title: 'Stock Movements',
      items: [
        {
          name: 'Stock-In Orders',
          href: '/inventory/stock-in',
          icon: FileText,
        },
        {
          name: 'Adjustments',
          href: '/inventory/adjustments',
          icon: AlertTriangle,
        },
        {
          name: 'Transfers',
          href: '/inventory/transfers',
          icon: ArrowRightLeft,
        },
        {
          name: 'Stock History',
          href: '/inventory/stock-history',
          icon: BarChart3,
        },
      ]
    }
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
        ${isCollapsed ? 'w-16' : 'w-64'}
        border-r border-black
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black">
          {!isCollapsed && (
            <Link href="/dashboard" className="text-lg font-bold text-black">
              Inventory Management
            </Link>
          )}
          <div className="flex items-center gap-2">
            {/* Collapse toggle for desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex h-8 w-8 p-0"
            >
              {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
            
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-6">
            {navigationGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {!isCollapsed && (
                  <h3 className="px-3 text-xs font-semibold text-black uppercase tracking-wider mb-2">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant="ghost"
                          className={`
                            w-full justify-start h-10 px-3
                            ${isActive 
                              ? 'bg-[#52a852] text-white border-r-2 border-black hover:bg-[#52a852] hover:text-white' 
                              : 'text-black hover:bg-[#52a852] hover:text-white'
                            }
                            ${isCollapsed ? 'px-2' : 'px-3'}
                          `}
                          title={isCollapsed ? item.name : undefined}
                        >
                          <Icon className={`h-4 w-4 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
                          {!isCollapsed && item.name}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-black p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`
                  w-full justify-start h-10 px-3 text-black hover:bg-[#52a852] hover:text-white
                  ${isCollapsed ? 'px-2' : 'px-3'}
                `}
              >
                <User className={`h-4 w-4 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
                {!isCollapsed && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{user.first_name} {user.last_name}</span>
                    <span className="text-xs text-black">{user.role}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.first_name} {user.last_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}
