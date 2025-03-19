"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Search, TrendingUp, Bookmark, Bell, Settings, LogIn } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/context/auth-context"

export default function MobileNavigation() {
  const pathname = usePathname()
  const { user, signOut, isLoading } = useAuth()

  const navItems = [
    { name: "Feed", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Search },
    { name: "Trending", href: "/trending", icon: TrendingUp },
    { name: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-700 bg-gray-800 md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-md px-3 py-1",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="mt-1 text-xs">{item.name}</span>
            </Link>
          )
        })}

        {!isLoading && (
          user ? (
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center rounded-md px-3 py-1 text-muted-foreground hover:text-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder.svg?height=24&width=24" alt={user.user_metadata?.username || "@user"} />
                    <AvatarFallback className="bg-gray-600">
                      {user.user_metadata?.username ? user.user_metadata.username.substring(0, 2).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="mt-1 text-xs">Profile</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto rounded-t-xl bg-gray-800 border-t border-gray-700">
                <div className="flex flex-col space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-md py-2 px-3 hover:bg-gray-700 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user.user_metadata?.username || "@user"} />
                        <AvatarFallback className="bg-gray-600">
                          {user.user_metadata?.username ? user.user_metadata.username.substring(0, 2).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.user_metadata?.username || "User"}</p>
                        <p className="text-xs text-gray-400">@{user.user_metadata?.username || "user"}</p>
                      </div>
                    </Link>

                    <div className="flex space-x-2">
                      <Link href="/notifications">
                        <Button variant="ghost" size="icon">
                          <Bell className="h-5 w-5" />
                          <span className="sr-only">Notifications</span>
                        </Button>
                      </Link>
                      <Link href="/settings">
                        <Button variant="ghost" size="icon">
                          <Settings className="h-5 w-5" />
                          <span className="sr-only">Settings</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center justify-center rounded-md px-3 py-1 text-muted-foreground hover:text-foreground"
            >
              <LogIn className="h-6 w-6" />
              <span className="mt-1 text-xs">Login</span>
            </Link>
          )
        )}
      </div>
    </div>
  )
}

