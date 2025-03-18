import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import PostCard from "@/components/post-card"

export default function FeedPage() {
  const posts = [
    {
      id: 1,
      user: {
        name: "John Doe",
        username: "johndoe",
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
        name: "Sarah Smith",
        username: "sarahsmith",
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
    {
      id: 3,
      user: {
        name: "Mark Johnson",
        username: "markjohnson",
        avatar: "/placeholder.svg?height=40&width=40",
        profit: -3.5,
      },
      content:
        "Market volatility is increasing. I'm moving 20% of my portfolio to defensive stocks. Anyone else repositioning?",
      tickers: ["VIX", "SPY"],
      stocksInfo: [
        { ticker: "VIX", name: "Volatility Index", change: 5.2 },
        { ticker: "SPY", name: "S&P 500 ETF", change: -0.8 },
      ],
      hashtags: ["marketvolatility", "investing"],
      time: "1d ago",
      stats: {
        likes: 18,
        comments: 9,
        reposts: 2,
      },
    },
  ]

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center">
        <h1 className="text-2xl font-bold">Feed</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <Tabs defaultValue="foryou" className="w-full">
            <div className="sticky top-0 z-10 bg-background pt-1 pb-3">
              <TabsList className="w-full bg-gray-800">
                <TabsTrigger value="foryou" className="flex-1 data-[state=active]:bg-gray-700">
                  For You
                </TabsTrigger>
                <TabsTrigger value="following" className="flex-1 data-[state=active]:bg-gray-700">
                  Following
                </TabsTrigger>
                <TabsTrigger value="latest" className="flex-1 data-[state=active]:bg-gray-700">
                  Latest
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="foryou" className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} {...post} />
              ))}
            </TabsContent>
            <TabsContent value="following" className="space-y-4">
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle>Follow more users</CardTitle>
                  <CardDescription>Content from users you follow will appear here</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
            <TabsContent value="latest" className="space-y-4">
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle>Latest content will appear here</CardTitle>
                  <CardDescription>Most recent posts from across the platform</CardDescription>
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

