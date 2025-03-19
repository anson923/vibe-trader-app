"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { supabase } from "@/lib/supabase"

export default function CreatePostPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      router.push("/login")
      return
    }

    if (!content.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Save post to Supabase
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            content: content.trim(),
            user_id: user.id,
            username: user.user_metadata?.username || "Anonymous",
            avatar_url: user.user_metadata?.avatar_url || "/placeholder.svg?height=40&width=40"
          }
        ])
        .select()

      if (error) {
        console.error("Error creating post:", error)
        throw error
      }

      // Redirect to home page after successful post
      router.push("/")
    } catch (error) {
      console.error("Failed to create post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Create Post</h1>
        <Card className="border-gray-700 bg-gray-800">
          <form onSubmit={handleSubmit}>
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg?height=40&width=40"} alt="@user" />
                <AvatarFallback>{user?.user_metadata?.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-base">Share your insights</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="What's on your mind about the markets today?"
                  className="min-h-32 bg-gray-700/30 border-gray-600"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between p-4">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

