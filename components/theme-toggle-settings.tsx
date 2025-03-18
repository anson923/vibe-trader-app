"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme("light")}
        className={theme === "light" ? "bg-primary text-primary-foreground" : ""}
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Light mode</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme("dark")}
        className={theme === "dark" ? "bg-primary text-primary-foreground" : ""}
      >
        <Moon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Dark mode</span>
      </Button>
    </div>
  )
}

