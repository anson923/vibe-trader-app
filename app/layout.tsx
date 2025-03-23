import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import LeftNavigation from "@/components/left-navigation"
import MobileNavigation from "@/components/mobile-navigation"
import CreatePostButton from "@/components/create-post-button"
import { AuthProvider } from "@/lib/context/auth-context"
import { setLogLevel } from "@/lib/stock-utils"

// Set log level based on environment
if (process.env.NODE_ENV === 'production') {
  setLogLevel('error'); // Only errors in production
} else {
  // In development, use 'error' for cleaner logs, or change to 'info' or 'verbose' for debugging
  setLogLevel('error'); 
}

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "StockSocial",
  description: "A social media platform for stock market enthusiasts",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <div className="flex min-h-screen bg-background text-foreground">
              <LeftNavigation />
              <main className="flex-1 md:ml-64">
                <div className="min-h-screen pb-16 md:pb-0">{children}</div>
              </main>
              <MobileNavigation />
              <CreatePostButton />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

