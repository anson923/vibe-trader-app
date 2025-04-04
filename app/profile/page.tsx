"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import PostCard from "@/components/post-card"
import { useAuth } from "@/lib/context/auth-context"
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

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("posts")
  const [posts, setPosts] = useState<FormattedPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)

  // Redirect if not logged in
  if (!isLoading && !user) {
    redirect("/login")
  }

  useEffect(() => {
    async function fetchUserPosts() {
      if (!user) return

      try {
        // Get posts from Supabase for the current user, ordered by most recent
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
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
              avatar: post.avatar_url || "/user_icon.svg",
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
        console.error("Error fetching user posts:", error)
      } finally {
        setPostsLoading(false)
      }
    }

    if (user) {
      fetchUserPosts()
    }
  }, [user])

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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container px-4 py-6 md:px-6">
      <Card className="mb-6 border-gray-700 bg-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
              <Avatar className="h-24 w-24 mb-4 md:mb-0">
                <AvatarImage src="/user_icon.svg" alt={user?.user_metadata?.username || "User"} />
                <AvatarFallback className="text-2xl">
                  {user?.user_metadata?.username ? user.user_metadata.username.substring(0, 2).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{user?.user_metadata?.username || "User"}</h1>
                <p className="text-gray-400">@{user?.user_metadata?.username?.toLowerCase() || "user"}</p>
                <div className="mt-2 flex space-x-4">
                  <div>
                    <span className="font-medium">120</span> <span className="text-gray-400">Following</span>
                  </div>
                  <div>
                    <span className="font-medium">1.2k</span> <span className="text-gray-400">Followers</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="outline">Edit Profile</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 bg-gray-800">
          <TabsTrigger value="posts" className="flex-1 data-[state=active]:bg-gray-700">
            Posts
          </TabsTrigger>
          <TabsTrigger value="stocks" className="flex-1 data-[state=active]:bg-gray-700">
            Stocks
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex-1 data-[state=active]:bg-gray-700">
            Performance
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="space-y-4">
          {postsLoading ? (
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
                <CardDescription>
                  You haven't posted anything yet. <Link href="/create-post" className="text-primary hover:underline">Create your first post</Link>
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="stocks">
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader>
              <CardTitle>Portfolio Stocks</CardTitle>
              <CardDescription>Stocks you are currently holding</CardDescription>
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
                    $MSFT
                  </Badge>
                  <span>Microsoft Corp.</span>
                </div>
                <div className="flex items-center text-green-500">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>1.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stats">
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader>
              <CardTitle>Performance Stats</CardTitle>
              <CardDescription>Your trading performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="rounded-lg bg-gray-700 p-4">
                  <div className="text-sm text-gray-400">Total Return</div>
                  <div className="text-2xl font-bold text-green-500">+24.8%</div>
                </div>
                <div className="rounded-lg bg-gray-700 p-4">
                  <div className="text-sm text-gray-400">Monthly Return</div>
                  <div className="text-2xl font-bold text-green-500">+3.2%</div>
                </div>
                <div className="rounded-lg bg-gray-700 p-4">
                  <div className="text-sm text-gray-400">Win Rate</div>
                  <div className="text-2xl font-bold">68%</div>
                </div>
                <div className="rounded-lg bg-gray-700 p-4">
                  <div className="text-sm text-gray-400">Avg. Hold Time</div>
                  <div className="text-2xl font-bold">18 days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

