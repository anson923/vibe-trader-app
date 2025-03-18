"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, TrendingUp, Search, Bell, Bookmark, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LeftNavigation() {
  const pathname = usePathname()

  const navItems = [
    { name: "Feed", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Search },
    { name: "Trending", href: "/trending", icon: TrendingUp },
    { name: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-700 bg-gray-800 md:block">
      <div className="flex h-16 items-center border-b border-gray-700 px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">StockSocial</span>
        </Link>
      </div>

      <div className="px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-gray-700 text-primary-foreground" : "hover:bg-gray-700/70",
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-md py-2 px-3 hover:bg-gray-700 transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@user" />
              <AvatarFallback className="bg-gray-600">JD</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">John Doe</span>
          </Link>

          <div className="flex space-x-1">
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}

