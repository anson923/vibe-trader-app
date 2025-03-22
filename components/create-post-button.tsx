'use client'

import Link from "next/link"
import { PenSquare } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"

export default function CreatePostButton() {
  // Use the auth context to get the current user
  const { user } = useAuth()

  // If there's no user session, don't render the button
  if (!user) {
    return null
  }

  return (
    <Link
      href="/create-post"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gray-700 text-primary-foreground shadow-lg hover:bg-gray-600 transition-colors md:bottom-8"
    >
      <PenSquare className="h-6 w-6" />
      <span className="sr-only">Create Post</span>
    </Link>
  )
}

