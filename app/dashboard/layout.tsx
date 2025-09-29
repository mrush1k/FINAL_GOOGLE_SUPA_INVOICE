"use client"

import { ProtectedRoute } from '@/components/protected-route'
import dynamic from 'next/dynamic'

// Lazy-load heavier UI components to reduce initial client bundle size
const Button = dynamic(() => import('@/components/ui/button').then(m => m.Button), { ssr: false })
const Sheet = dynamic(() => import('@/components/ui/sheet').then(m => m.Sheet), { ssr: false })
const SheetContent = dynamic(() => import('@/components/ui/sheet').then(m => m.SheetContent), { ssr: false })
const SheetHeader = dynamic(() => import('@/components/ui/sheet').then(m => m.SheetHeader), { ssr: false })
const SheetTitle = dynamic(() => import('@/components/ui/sheet').then(m => m.SheetTitle), { ssr: false })
const SheetTrigger = dynamic(() => import('@/components/ui/sheet').then(m => m.SheetTrigger), { ssr: false })
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calculator,
  Plus,
  Settings,
  LogOut,
  Mic,
  Menu,
  Activity,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { AiChatbot } from '@/components/ai-chatbot'
import { TutorialProvider } from '@/components/tutorial-provider'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { signOut, userProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
    { name: 'Estimates', href: '/dashboard/estimates', icon: Calculator },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_DIAGNOSTICS === 'true'
  
  const navigation = isDev 
    ? [...baseNavigation, { name: 'Diagnostics', href: '/dashboard/diagnostics', icon: Activity }]
    : baseNavigation

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link 
            key={item.name} 
            href={item.href}
            prefetch
            onClick={() => mobile && setIsOpen(false)}
          >
            <div className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${mobile ? 'py-3 text-base' : ''}`}>
              <item.icon className={`mr-2 h-4 w-4 flex-shrink-0 ${
                isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {item.name}
            </div>
          </Link>
        )
      })}
    </>
  )

  const ActionButtons = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className={`mt-2.5 ${mobile ? 'mt-4' : ''}`}>
        <Link href="/dashboard/invoices/new" prefetch onClick={() => mobile && setIsOpen(false)}>
          <Button className="w-full text-sm py-2 h-9">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>
      <div className="mt-2.5">
        <Link href="/dashboard/invoices/voice" prefetch onClick={() => mobile && setIsOpen(false)}>
          <Button variant="outline" className="w-full text-sm py-2 h-9">
            <Mic className="w-4 h-4 mr-2" />
            Voice Invoice
          </Button>
        </Link>
      </div>
    </>
  )

  const UserProfile = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex border-t border-gray-200 p-3 ${mobile ? 'mt-4' : ''}`}>
      <div className="flex items-center w-full">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {userProfile?.username || 'User'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {userProfile?.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            handleSignOut()
            mobile && setIsOpen(false)
          }}
          className="ml-2 h-8 w-8 p-0"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <ProtectedRoute>
      <TutorialProvider>
        <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Invoice Easy</h1>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden touch-target"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="p-4 border-b border-gray-200">
                  <SheetTitle className="text-left">Invoice Easy</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <nav className="flex-1 px-3 py-3 space-y-1">
                    <NavLinks mobile />
                  </nav>
                  <div className="px-3">
                    <ActionButtons mobile />
                  </div>
                  <UserProfile mobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="lg:flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
            <div className="flex flex-col flex-grow pt-4 bg-white shadow-sm border-r border-gray-200">
              <div className="flex items-center flex-shrink-0 px-4 pb-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900">Invoice Easy</h1>
              </div>
              
              <div className="mt-4 flex-grow flex flex-col">
                <nav className="flex-1 px-3 space-y-1">
                  <NavLinks />
                </nav>
                
                <div className="flex-shrink-0 p-3">
                  <ActionButtons />
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <UserProfile />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
            <main className="flex-1 mobile-padding lg:p-6">
              {children}
            </main>
          </div>
        </div>

        {/* AI Chatbot */}
        <AiChatbot />
        </div>
      </TutorialProvider>
    </ProtectedRoute>
  )
}