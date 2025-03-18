"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BarChart2, Image, Link2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

export default function CreatePostPage() {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [tickers, setTickers] = useState("")
  const [hashtags, setHashtags] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle post creation logic here
    console.log("Creating post with:", { content, tickers, hashtags })
    router.push("/dashboard")
  }

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Create Post</h1>
        <Card className="border-gray-700 bg-gray-800">
          <form onSubmit={handleSubmit}>
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@user" />
                <AvatarFallback>U</AvatarFallback>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tickers">Stock Tickers</Label>
                <Input
                  id="tickers"
                  placeholder="$AAPL, $MSFT, $TSLA"
                  value={tickers}
                  onChange={(e) => setTickers(e.target.value)}
                  className="bg-gray-700/30 border-gray-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Separate multiple tickers with commas</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags</Label>
                <Input
                  id="hashtags"
                  placeholder="#investing, #stocks, #earnings"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="bg-gray-700/30 border-gray-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Separate multiple hashtags with commas</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" className="gap-1">
                  <Image className="h-4 w-4" />
                  <span>Add Image</span>
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1">
                  <BarChart2 className="h-4 w-4" />
                  <span>Add Chart</span>
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1">
                  <Link2 className="h-4 w-4" />
                  <span>Add Link</span>
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between p-4">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">Post</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

