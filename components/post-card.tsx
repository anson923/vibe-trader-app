"use client"

import type React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { MessageSquare, Heart, Share2, Bookmark, Repeat2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface StockInfo {
  ticker: string
  name: string
  change: number
}

interface PostCardProps {
  id: number
  user: {
    name: string
    username: string
    avatar: string
    profit: number
  }
  content: string
  tickers?: string[]
  stocksInfo?: StockInfo[]
  hashtags?: string[]
  image?: string
  time: string
  stats: {
    likes: number
    comments: number
    reposts: number
  }
}

export default function PostCard({
  id,
  user,
  content,
  tickers = [],
  stocksInfo = [],
  hashtags = [],
  image,
  time,
  stats,
}: PostCardProps) {
  const router = useRouter()
  const profitColor = user.profit >= 0 ? "text-green-500" : "text-red-500"
  const profitSign = user.profit >= 0 ? "+" : ""

  // Process content to highlight tickers and hashtags without using Link components
  const processedContent = content.split(" ").map((word, index) => {
    if (word.startsWith("$") && tickers.includes(word.substring(1))) {
      return (
        <span
          key={index}
          className="text-primary font-medium cursor-pointer"
          onClick={(e) => {
            e.stopPropagation() // Prevent the parent click from firing
            router.push(`/stock/${word.substring(1)}`)
          }}
        >
          {word}{" "}
        </span>
      )
    } else if (word.startsWith("#") && hashtags.includes(word.substring(1))) {
      return (
        <span key={index} className="text-primary font-medium">
          {word}{" "}
        </span>
      )
    }
    return <span key={index}>{word} </span>
  })

  const handleCardClick = () => {
    router.push(`/post/${id}`)
  }

  const handleStockClick = (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation() // Prevent the card click from firing
    router.push(`/stock/${ticker}`)
  }

  return (
    <Card
      className="border-gray-700 bg-gradient-to-b from-gray-800 to-gray-750 overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-shadow"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={user.avatar} alt={`@${user.username}`} />
          <AvatarFallback className="bg-gray-700">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{user.name}</p>
            <span className={cn("text-sm font-medium", profitColor)}>
              {profitSign}
              {user.profit}%
            </span>
          </div>
          <p className="text-sm text-gray-400">
            @{user.username} • {time}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="mb-3">{processedContent}</p>

        {stocksInfo.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {stocksInfo.map((stock) => (
              <div
                key={stock.ticker}
                onClick={(e) => handleStockClick(e, stock.ticker)}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700/50 hover:bg-gray-600/60 transition-colors cursor-pointer border border-gray-600/50"
              >
                <span className="font-medium">${stock.ticker}</span>
                <span className="text-sm">{stock.name}</span>
                <span className={stock.change >= 0 ? "text-green-500" : "text-red-500"}>
                  {stock.change >= 0 ? (
                    <span className="flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />+{stock.change}%
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                      {stock.change}%
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {image && (
          <div className="rounded-lg overflow-hidden bg-gray-800 mt-2">
            <div className="h-40 bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center">
              {image === "chart" ? (
                <img src="/placeholder.svg?height=160&width=320" alt="Chart" className="w-full h-full object-cover" />
              ) : (
                <img src={image || "/placeholder.svg"} alt="Post attachment" className="w-full h-full object-cover" />
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0">
        <Button variant="ghost" size="sm" className="gap-1" onClick={(e) => e.stopPropagation()}>
          <Heart className="h-4 w-4" />
          <span>{stats.likes}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/post/${id}`)
          }}
        >
          <MessageSquare className="h-4 w-4" />
          <span>{stats.comments}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1" onClick={(e) => e.stopPropagation()}>
          <Repeat2 className="h-4 w-4" />
          <span>{stats.reposts}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <Bookmark className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

