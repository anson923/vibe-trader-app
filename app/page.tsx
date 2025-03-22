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
  userId: string
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
  const [stocks, setStocks] = useState<any[]>([])
  const [loadingStocks, setLoadingStocks] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        // First try to get posts from the cached API
        try {
          const response = await fetch('/api/cached-posts');
          
          if (!response.ok) {
            throw new Error('Failed to fetch from cached API');
          }
          
          const result = await response.json();
          
          if (result.data && Array.isArray(result.data)) {
            // Format posts for the PostCard component
            const formattedPosts = result.data.map((post: Post): FormattedPost => ({
              id: post.id,
              user: {
                name: post.username,
                username: post.username.toLowerCase().replace(/\s+/g, ''),
                avatar: post.avatar_url || "/placeholder.svg?height=40&width=40",
                profit: 0, // Default value since profit isn't in our posts table
              },
              userId: post.user_id,
              content: post.content,
              time: formatTimeAgo(new Date(post.created_at)),
              stats: {
                likes: post.likes_count || 0,
                comments: post.comments_count || 0,
                reposts: 0,
              },
            }));

            setPosts(formattedPosts);
            console.log('Successfully fetched posts from cached API');
            return; // Exit if cached fetch was successful
          }
        } catch (cacheError) {
          console.warn('Failed to fetch posts from cached API, falling back to direct Supabase:', cacheError);
        }

        // Fallback to direct Supabase if cached API fails
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
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
            userId: post.user_id,
            content: post.content,
            time: formatTimeAgo(new Date(post.created_at)),
            stats: {
              likes: post.likes_count || 0,
              comments: post.comments_count || 0,
              reposts: 0,
            },
          }));

          setPosts(formattedPosts);
          console.log('Successfully fetched posts from Supabase (fallback)');
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  // Fetch stocks from cache
  useEffect(() => {
    async function fetchStocks() {
      try {
        // Try to get stocks from the cached API
        try {
          const response = await fetch('/api/cached-stocks');
          
          if (!response.ok) {
            throw new Error('Failed to fetch from cached stocks API');
          }
          
          const result = await response.json();
          
          if (result.data && Array.isArray(result.data)) {
            // Get top 5 stocks
            const topStocks = result.data.slice(0, 5);
            setStocks(topStocks);
            console.log('Successfully fetched stocks from cached API');
            return; // Exit if cached fetch was successful
          }
        } catch (cacheError) {
          console.warn('Failed to fetch stocks from cached API, falling back to direct Supabase:', cacheError);
        }

        // Fallback to direct Supabase if cached API fails
        const { data, error } = await supabase
          .from('stocks')
          .select('*')
          .limit(5);

        if (error) {
          throw error;
        }

        if (data) {
          setStocks(data);
          console.log('Successfully fetched stocks from Supabase (fallback)');
        }
      } catch (error) {
        console.error("Error fetching stocks:", error);
      } finally {
        setLoadingStocks(false);
      }
    }

    fetchStocks();
  }, []);

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
                {loadingStocks ? (
                  <div className="flex justify-center py-2">
                    <div className="animate-pulse text-gray-400">Loading stocks...</div>
                  </div>
                ) : stocks.length > 0 ? (
                  stocks.map((stock) => (
                    <div key={stock.ticker} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-700 bg-gray-800">
                          ${stock.ticker}
                        </Badge>
                        <span>{stock.ticker}</span>
                      </div>
                      <div className={`flex items-center ${parseFloat(stock.price_change_percentage) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>{parseFloat(stock.price_change_percentage).toFixed(2)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">No stock data available</div>
                )}
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

