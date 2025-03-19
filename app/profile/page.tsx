"use client"

import { useState } from "react"
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

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("posts")

  // Redirect if not logged in
  if (!isLoading && !user) {
    redirect("/login")
  }

  const posts = [
    {
      id: 1,
      user: {
        name: user?.user_metadata?.username || "User",
        username: user?.user_metadata?.username?.toLowerCase() || "user",
        avatar: "/placeholder.svg?height=40&width=40",
        profit: 24.8,
      },
      content:
        "Just analyzed $AAPL earnings report. Strong growth in services, but hardware sales slightly below expectations. Still bullish long-term.",
      tickers: ["AAPL"],
      stocksInfo: [{ ticker: "AAPL", name: "Apple Inc.", change: 2.4 }],
      hashtags: ["earnings", "tech"],
      image: "chart",
      time: "2h ago",
      stats: {
        likes: 24,
        comments: 5,
        reposts: 3,
      },
    },
    {
      id: 2,
      user: {
        name: user?.user_metadata?.username || "User",
        username: user?.user_metadata?.username?.toLowerCase() || "user",
        avatar: "/placeholder.svg?height=40&width=40",
        profit: 12.3,
      },
      content: "My portfolio is up 12% this quarter! Key winners: $TSLA, $NVDA, $MSFT. What are your best performers?",
      tickers: ["TSLA", "NVDA", "MSFT"],
      stocksInfo: [
        { ticker: "TSLA", name: "Tesla Inc.", change: -1.2 },
        { ticker: "NVDA", name: "NVIDIA Corp.", change: 3.5 },
        { ticker: "MSFT", name: "Microsoft Corp.", change: 1.8 },
      ],
      hashtags: ["investing", "stocks"],
      time: "5h ago",
      stats: {
        likes: 42,
        comments: 12,
        reposts: 7,
      },
    },
  ]

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
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt={user?.user_metadata?.username || "User"} />
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
          {posts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
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

