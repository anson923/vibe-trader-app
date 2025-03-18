import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Home, Search, User } from "lucide-react"
import UniversityLogo from "@/components/university-logo"
import { ModeToggle } from "@/components/mode-toggle"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <UniversityLogo className="h-8 w-8" />
            <span className="hidden font-bold text-university-primary md:inline-block">University Connect</span>
          </Link>
        </div>

        <div className="hidden flex-1 md:flex md:justify-center md:px-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts..."
              className="w-full rounded-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-university-primary">
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-university-primary">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-university-primary">
            <User className="h-5 w-5" />
            <span className="sr-only">Profile</span>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

