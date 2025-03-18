import Link from "next/link"
import { PenSquare } from "lucide-react"

export default function CreatePostButton() {
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

