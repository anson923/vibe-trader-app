import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import PostCard from "@/components/post-card"

export default function TrendingPage() {
  const trendingPosts = [
    {
      id: 1,
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
        likes: 142,
        comments: 38,
        reposts: 27,
      },
    },
    {
      id: 2,
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
        likes: 118,
        comments: 49,
        reposts: 22,
      },
    },
    {
      id: 3,
      user: {
        name: "Emily Wilson",
        username: "emilywilson",
        avatar: "/placeholder.svg?height=40&width=40",
        profit: 8.7,
      },
      content:
        "Just published my analysis on the semiconductor industry. $NVDA and $AMD are positioned for strong growth with AI demand, but $INTC faces challenges.",
      tickers: ["NVDA", "AMD", "INTC"],
      stocksInfo: [
        { ticker: "NVDA", name: "NVIDIA Corp.", change: 3.5 },
        { ticker: "AMD", name: "Advanced Micro Devices", change: 2.1 },
        { ticker: "INTC", name: "Intel Corp.", change: -1.3 },
      ],
      hashtags: ["semiconductors", "analysis", "AI"],
      image: "chart",
      time: "2d ago",
      stats: {
        likes: 95,
        comments: 31,
        reposts: 18,
      },
    },
  ]

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Trending</h1>
        <p className="text-muted-foreground">Popular discussions in the community</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <Tabs defaultValue="posts" className="w-full">
            <div className="sticky top-0 z-10 bg-background pt-1 pb-3">
              <TabsList className="w-full bg-gray-800">
                <TabsTrigger value="posts" className="flex-1 data-[state=active]:bg-gray-700">
                  Top Posts
                </TabsTrigger>
                <TabsTrigger value="topics" className="flex-1 data-[state=active]:bg-gray-700">
                  Hot Topics
                </TabsTrigger>
                <TabsTrigger value="stocks" className="flex-1 data-[state=active]:bg-gray-700">
                  Trending Stocks
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="posts" className="space-y-4">
              {trendingPosts.map((post) => (
                <PostCard key={post.id} {...post} />
              ))}
            </TabsContent>
            <TabsContent value="topics" className="space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle>Hot Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">#AIinvesting</p>
                        <p className="text-sm text-gray-400">1,245 posts</p>
                      </div>
                      <Badge className="bg-gray-700 hover:bg-gray-600">Trending</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">#earningsseason</p>
                        <p className="text-sm text-gray-400">982 posts</p>
                      </div>
                      <Badge className="bg-gray-700 hover:bg-gray-600">Hot</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">#marketvolatility</p>
                        <p className="text-sm text-gray-400">756 posts</p>
                      </div>
                      <Badge variant="outline" className="border-gray-700">
                        Rising
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="stocks" className="space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle>Trending Stocks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">$NVDA</p>
                        <p className="text-sm text-gray-400">Nvidia Corporation</p>
                      </div>
                      <Badge className="bg-green-500">+4.2%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">$TSLA</p>
                        <p className="text-sm text-gray-400">Tesla Inc.</p>
                      </div>
                      <Badge className="bg-red-500">-2.1%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">$AAPL</p>
                        <p className="text-sm text-gray-400">Apple Inc.</p>
                      </div>
                      <Badge className="bg-green-500">+1.8%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden md:block">
          <div className="sticky top-6 space-y-4">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle>Weekly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Top Sectors</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Technology</span>
                        <span className="text-green-500">+3.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Healthcare</span>
                        <span className="text-green-500">+2.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Energy</span>
                        <span className="text-red-500">-1.5%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium">Market Sentiment</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Bullish</span>
                        <span>62%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Neutral</span>
                        <span>24%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bearish</span>
                        <span>14%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle>Popular Analysts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">RK</div>
                    <div>
                      <p className="font-medium">Robert Kim</p>
                      <p className="text-xs text-gray-400">Tech Analyst</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-gray-700">
                    94% Accuracy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">JL</div>
                    <div>
                      <p className="font-medium">Jessica Lee</p>
                      <p className="text-xs text-gray-400">Financial Advisor</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-gray-700">
                    91% Accuracy
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

