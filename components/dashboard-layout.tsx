"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { getDashboardCounts } from "@/lib/actions/dashboard.actions"
import { signOutAction } from "@/lib/actions/auth-actions"
import { useSession } from "next-auth/react"

interface DashboardCounts {
  workers: number
  clients: number
}

const navigation = [
  {
    name: "لوحة التحكم",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    name: "العمال",
    href: "/workers",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    name: "العملاء",
    href: "/clients",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
]

const attendanceNav = [
  {
    name: "تسجيل الحضور",
    href: "/attendance",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    name: "سجل الحضور",
    href: "/attendance/history",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [counts, setCounts] = useState<DashboardCounts>({ workers: 0, clients: 0 })
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch counts when component mounts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const result = await getDashboardCounts()
        if (result.success && result.data) {
          const safeCounts: DashboardCounts = {
            workers: result.data.workers ?? 0,
            clients: result.data.clients ?? 0
          }
          setCounts(safeCounts)
        } else {
          setCounts({ workers: 0, clients: 0 })
        }
      } catch (error) {
        console.error("Error fetching counts:", error)
        setCounts({ workers: 0, clients: 0 })
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchCounts()
    }
  }, [status])

  const handleLogout = async () => {
    try {
      await signOutAction()
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  // Helper function to get badge for navigation items
  const getNavBadge = (name: string) => {
    if (name === "العمال" && counts.workers > 0) {
      return counts.workers.toString()
    }
    if (name === "العملاء" && counts.clients > 0) {
      return counts.clients.toString()
    }
    return null
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // If unauthenticated, show a brief loading then let server handle redirect
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري إعادة التوجيه...</p>
        </div>
      </div>
    )
  }

  // Get user info from session
  const userName = session?.user?.name || "مستخدم"
  const userEmail = session?.user?.email || ""
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 right-0 h-full bg-card border-l border-border z-40 transition-transform duration-300 ease-in-out",
          "w-64",
          isSidebarOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex flex-col h-full transition-opacity duration-300",
            isSidebarOpen ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="p-4 md:p-6 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <span className="font-bold text-lg md:text-xl whitespace-nowrap">نور ستايل</span>
            </div>
          </div>

          <nav className="flex-1 p-3 md:p-4 space-y-4 md:space-y-6 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 md:mb-3 px-2 md:px-3">القائمة</p>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  const badge = getNavBadge(item.name)
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg transition-colors min-h-[44px]",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      {item.icon}
                      <span className="flex-1 text-sm md:text-base">{item.name}</span>
                      {badge && (
                        <span className={cn(
                          "px-1.5 md:px-2 py-0.5 text-xs rounded-full min-w-[20px] text-center",
                          isActive 
                            ? "bg-primary-foreground/20 text-primary-foreground" 
                            : "bg-primary/10 text-primary"
                        )}>
                          {loading ? "..." : badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 md:mb-3 px-2 md:px-3">الحضور</p>
              <div className="space-y-1">
                {attendanceNav.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg transition-colors min-h-[44px]",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      {item.icon}
                      <span className="text-sm md:text-base">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          <div className="p-3 md:p-4 border-t border-border flex-shrink-0">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 md:gap-3 min-h-[44px]" 
              onClick={handleLogout}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-sm md:text-base">تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen",
          isSidebarOpen && !isMobile ? "mr-64" : "mr-0",
        )}
      >
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4">
            <div className="flex items-center gap-2 md:gap-4 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="min-h-[44px] min-w-[44px]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>

              <div className="relative flex-1 max-w-md hidden sm:block">
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input type="search" placeholder="بحث..." className="pr-10 text-sm md:text-base" />
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" size="icon" className="relative hidden sm:flex min-h-[44px] min-w-[44px]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </Button>

              <Button variant="ghost" size="icon" className="relative hidden sm:flex min-h-[44px] min-w-[44px]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 md:gap-3 min-h-[44px]">
                    <Avatar className="w-7 h-7 md:w-8 md:h-8">
                      <AvatarImage src="/avatar.png" alt={userName} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="text-right hidden lg:block">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">{userEmail}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
                  <DropdownMenuItem>الإعدادات</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>تسجيل الخروج</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-3 md:p-6">{children}</main>
      </div>
    </div>
  )
}