import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PostCard from "@/components/post-card"

export default function BookmarksPage() {
  const bookmarkedPosts = [
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
  ]

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <p className="text-muted-foreground">Posts you've saved for later</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="sticky top-0 z-10 bg-background pt-1 pb-3">
          <TabsList className="w-full bg-gray-800">
            <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-gray-700">
              All Bookmarks
            </TabsTrigger>
            <TabsTrigger value="stocks" className="flex-1 data-[state=active]:bg-gray-700">
              Stocks
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1 data-[state=active]:bg-gray-700">
              Analysis
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="all" className="space-y-4">
          {bookmarkedPosts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </TabsContent>
        <TabsContent value="stocks" className="space-y-4">
          {bookmarkedPosts
            .filter((post) => post.tickers?.length > 0)
            .map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
        </TabsContent>
        <TabsContent value="analysis" className="space-y-4">
          {bookmarkedPosts
            .filter((post) => post.hashtags?.includes("analysis"))
            .map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

