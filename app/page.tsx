"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import PostCard from "@/components/post-card"
import { supabase } from "@/lib/supabase"

// Post type definition
interface Post {
  id: number
  user_id: string
  content: string
  username: string
  avatar_url: string
  created_at: string
  likes_count: number
  comments_count: number
}

// Formatted post for PostCard component
interface FormattedPost {
  id: number
  user: {
    name: string
    username: string
    avatar: string
    profit: number
  }
  content: string
  time: string
  stats: {
    likes: number
    comments: number
    reposts: number
  }
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FormattedPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        // Get posts from Supabase, ordered by most recent
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        if (data) {
          // Format posts for the PostCard component
          const formattedPosts = data.map((post: Post): FormattedPost => ({
            id: post.id,
            user: {
              name: post.username,
              username: post.username.toLowerCase().replace(/\s+/g, ''),
              avatar: post.avatar_url || "/placeholder.svg?height=40&width=40",
              profit: 0, // Default value since profit isn't in our posts table
            },
            content: post.content,
            time: formatTimeAgo(new Date(post.created_at)),
            stats: {
              likes: post.likes_count || 0,
              comments: post.comments_count || 0,
              reposts: 0,
            },
          }))

          setPosts(formattedPosts)
        }
      } catch (error) {
        console.error("Error fetching posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // Helper function to format time ago
  function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) {
      return Math.floor(interval) + "y ago"
    }

    interval = seconds / 2592000
    if (interval > 1) {
      return Math.floor(interval) + "mo ago"
    }

    interval = seconds / 86400
    if (interval > 1) {
      return Math.floor(interval) + "d ago"
    }

    interval = seconds / 3600
    if (interval > 1) {
      return Math.floor(interval) + "h ago"
    }

    interval = seconds / 60
    if (interval > 1) {
      return Math.floor(interval) + "m ago"
    }

    return Math.floor(seconds) + "s ago"
  }

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center">
        <h1 className="text-2xl font-bold">Feed</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <Tabs defaultValue="latest" className="w-full">
            <div className="sticky top-0 z-10 bg-background pt-1 pb-3">
              <TabsList className="w-full bg-gray-800">
                <TabsTrigger value="latest" className="flex-1 data-[state=active]:bg-gray-700">
                  Latest
                </TabsTrigger>
                <TabsTrigger value="following" className="flex-1 data-[state=active]:bg-gray-700">
                  Following
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="latest" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-pulse text-gray-400">Loading posts...</div>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} {...post} />
                ))
              ) : (
                <Card className="border-gray-700 bg-gray-800">
                  <CardHeader>
                    <CardTitle>No posts yet</CardTitle>
                    <CardDescription>Be the first to share your thoughts!</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="following" className="space-y-4">
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle>Follow more users</CardTitle>
                  <CardDescription>Content from users you follow will appear here</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden md:block">
          <div className="sticky top-6 space-y-4">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle>Trading Stocks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gray-700 bg-gray-800">
                      $AAPL
                    </Badge>
                    <span>Apple Inc.</span>
                  </div>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>2.4%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gray-700 bg-gray-800">
                      $TSLA
                    </Badge>
                    <span>Tesla Inc.</span>
                  </div>
                  <div className="flex items-center text-red-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>-1.2%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gray-700 bg-gray-800">
                      $MSFT
                    </Badge>
                    <span>Microsoft Corp.</span>
                  </div>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>1.8%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gray-700 bg-gray-800">
                      $NVDA
                    </Badge>
                    <span>NVIDIA Corp.</span>
                  </div>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>3.5%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gray-700 bg-gray-800">
                      $AMZN
                    </Badge>
                    <span>Amazon.com Inc.</span>
                  </div>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>0.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle>Trending Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-primary hover:text-primary/80 cursor-pointer">#earnings</div>
                  <div className="text-primary hover:text-primary/80 cursor-pointer">#tech</div>
                  <div className="text-primary hover:text-primary/80 cursor-pointer">#investing</div>
                  <div className="text-primary hover:text-primary/80 cursor-pointer">#stocks</div>
                  <div className="text-primary hover:text-primary/80 cursor-pointer">#markettrends</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle>Who to Follow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">MJ</div>
                    <div>
                      <p className="font-medium">Mark Johnson</p>
                      <p className="text-xs text-gray-400">@markjohnson</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Follow
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">EW</div>
                    <div>
                      <p className="font-medium">Emily Wilson</p>
                      <p className="text-xs text-gray-400">@emilywilson</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Follow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

