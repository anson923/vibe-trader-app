"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { MessageSquare, Heart, Share2, Bookmark, Repeat2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import CommentSection from "@/components/comment-section"

interface StockInfo {
  ticker: string
  name: string
  change: number
}

interface PostDetailProps {
  params: {
    id: string
  }
}

export default function PostDetailPage({ params }: PostDetailProps) {
  // This would normally be fetched from an API based on the ID
  const postId = Number.parseInt(params.id)

  // Sample post data
  const post = {
    id: postId,
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
  }

  const profitColor = post.user.profit >= 0 ? "text-green-500" : "text-red-500"
  const profitSign = post.user.profit >= 0 ? "+" : ""

  // Process content to highlight tickers and hashtags
  const processedContent = post.content.split(" ").map((word, index) => {
    if (word.startsWith("$") && post.tickers.includes(word.substring(1))) {
      // Skip rendering as it will be shown in the stocks info section
      return <span key={index}>{word} </span>
    } else if (word.startsWith("#") && post.hashtags.includes(word.substring(1))) {
      return (
        <span key={index} className="text-primary font-medium">
          {word}{" "}
        </span>
      )
    }
    return <span key={index}>{word} </span>
  })

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-4">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="border-gray-700 bg-gray-800 overflow-hidden mb-6">
          <CardHeader className="flex flex-row items-center gap-4 p-4">
            <Avatar>
              <AvatarImage src={post.user.avatar} alt={`@${post.user.username}`} />
              <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{post.user.name}</p>
                <span className={cn("text-sm font-medium", profitColor)}>
                  {profitSign}
                  {post.user.profit}%
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{post.user.username} • {post.time}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="mb-3">{processedContent}</p>

            {post.stocksInfo.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.stocksInfo.map((stock) => (
                  <div key={stock.ticker} className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700">
                    <span className="font-medium">${stock.ticker}</span>
                    <span className="text-sm">{stock.name}</span>
                    <span className={stock.change >= 0 ? "text-green-500" : "text-red-500"}>
                      {stock.change >= 0 ? "+" : ""}
                      {stock.change}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {post.image && (
              <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mt-2">
                <div className="h-40 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center">
                  {post.image === "chart" ? (
                    <img
                      src="/placeholder.svg?height=160&width=320"
                      alt="Chart"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={post.image || "/placeholder.svg"}
                      alt="Post attachment"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between p-4 pt-0">
            <Button variant="ghost" size="sm" className="gap-1">
              <Heart className="h-4 w-4" />
              <span>{post.stats.likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{post.stats.comments}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1">
              <Repeat2 className="h-4 w-4" />
              <span>{post.stats.reposts}</span>
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bookmark className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <CommentSection postId={postId} />
      </div>
    </div>
  )
}

