"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, Reply, MessageCircle, ArrowLeft, TrendingUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface StockInfo {
  ticker: string
  name: string
  change: number
}

interface Comment {
  id: number
  number: number
  user: {
    name: string
    username: string
    avatar: string
  }
  content: string
  time: string
  likes: number
  replyTo?: number
  replies: number
  stocksInfo?: StockInfo[]
}

interface CommentSectionProps {
  postId: number
}

// Sample stock data
const stocksDatabase: Record<string, StockInfo> = {
  AAPL: { ticker: "AAPL", name: "Apple Inc.", change: 2.4 },
  TSLA: { ticker: "TSLA", name: "Tesla Inc.", change: -1.2 },
  MSFT: { ticker: "MSFT", name: "Microsoft Corp.", change: 1.8 },
  NVDA: { ticker: "NVDA", name: "NVIDIA Corp.", change: 3.5 },
  AMZN: { ticker: "AMZN", name: "Amazon.com Inc.", change: 0.9 },
  GOOG: { ticker: "GOOG", name: "Alphabet Inc.", change: 1.3 },
  META: { ticker: "META", name: "Meta Platforms Inc.", change: -0.7 },
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      number: 1,
      user: {
        name: "Sarah Smith",
        username: "sarahsmith",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "Great analysis! I'm also bullish on $AAPL long-term.",
      time: "1h ago",
      likes: 3,
      replies: 2,
      stocksInfo: [{ ticker: "AAPL", name: "Apple Inc.", change: 2.4 }],
    },
    {
      id: 2,
      number: 2,
      user: {
        name: "Mark Johnson",
        username: "markjohnson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "What do you think about their services growth compared to last quarter?",
      time: "45m ago",
      likes: 1,
      replies: 1,
    },
    {
      id: 3,
      number: 3,
      user: {
        name: "Emily Wilson",
        username: "emilywilson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "#1 I agree with Sarah. The services segment is showing strong momentum. $MSFT is also doing well in this area.",
      time: "30m ago",
      likes: 2,
      replyTo: 1,
      replies: 0,
      stocksInfo: [{ ticker: "MSFT", name: "Microsoft Corp.", change: 1.8 }],
    },
    {
      id: 4,
      number: 4,
      user: {
        name: "John Doe",
        username: "johndoe",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "#1 Their ecosystem lock-in is a major advantage. $AAPL has a stronger ecosystem than $GOOG in my opinion.",
      time: "25m ago",
      likes: 1,
      replyTo: 1,
      replies: 1,
      stocksInfo: [
        { ticker: "AAPL", name: "Apple Inc.", change: 2.4 },
        { ticker: "GOOG", name: "Alphabet Inc.", change: 1.3 },
      ],
    },
    {
      id: 5,
      number: 5,
      user: {
        name: "John Doe",
        username: "johndoe",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "#2 Services grew 15% YoY, which is slightly better than Q3.",
      time: "20m ago",
      likes: 0,
      replyTo: 2,
      replies: 0,
    },
    {
      id: 6,
      number: 6,
      user: {
        name: "Alex Turner",
        username: "alexturner",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "#4 I agree about $AAPL's ecosystem, but $GOOG has better integration with Android which has a larger global market share.",
      time: "15m ago",
      likes: 2,
      replyTo: 4,
      replies: 0,
      stocksInfo: [
        { ticker: "AAPL", name: "Apple Inc.", change: 2.4 },
        { ticker: "GOOG", name: "Alphabet Inc.", change: 1.3 },
      ],
    },
  ])

  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [showRepliesFor, setShowRepliesFor] = useState<number | null>(null)
  const [repliesDialogOpen, setRepliesDialogOpen] = useState(false)
  const [replyHistory, setReplyHistory] = useState<number[]>([])
  const commentInputRef = useRef<HTMLInputElement>(null)

  // Filter top-level comments and replies
  const topLevelComments = comments.filter((comment) => !comment.replyTo)

  const getRepliesForComment = (commentNumber: number) => {
    return comments.filter((comment) => comment.replyTo === commentNumber)
  }

  // Extract stock tickers from comment content
  const extractStockInfo = (content: string): StockInfo[] => {
    const stockRegex = /\$([A-Z]+)/g
    const matches = content.match(stockRegex)

    if (!matches) return []

    const uniqueTickers = [...new Set(matches.map((match) => match.substring(1)))]
    return uniqueTickers.filter((ticker) => stocksDatabase[ticker]).map((ticker) => stocksDatabase[ticker])
  }

  const handleAddComment = () => {
    if (newComment.trim() === "") return

    // Extract stock info from the comment
    const stocksInfo = extractStockInfo(newComment)

    const newCommentObj: Comment = {
      id: comments.length + 1,
      number: comments.length + 1,
      user: {
        name: "You",
        username: "you",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: newComment,
      time: "Just now",
      likes: 0,
      replies: 0,
      stocksInfo: stocksInfo.length > 0 ? stocksInfo : undefined,
    }

    if (replyingTo) {
      newCommentObj.replyTo = replyingTo

      // Update the replies count for the parent comment
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.number === replyingTo ? { ...comment, replies: comment.replies + 1 } : comment,
        ),
      )
    }

    setComments([...comments, newCommentObj])
    setNewComment("")
    setReplyingTo(null)
  }

  const handleReply = (commentNumber: number) => {
    setReplyingTo(commentNumber)
    setNewComment(`#${commentNumber} `)
    if (commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }

  const handleShowReplies = (commentNumber: number) => {
    setReplyHistory((prev) => [...prev, showRepliesFor!].filter(Boolean))
    setShowRepliesFor(commentNumber)
    setRepliesDialogOpen(true)
  }

  const handleBackToParent = () => {
    if (replyHistory.length > 0) {
      const newHistory = [...replyHistory]
      const previousComment = newHistory.pop()
      setReplyHistory(newHistory)
      setShowRepliesFor(previousComment || null)
    } else {
      setRepliesDialogOpen(false)
    }
  }

  // Process comment content to highlight reply references and stock tickers
  const processCommentContent = (content: string) => {
    // First split by spaces to process each word
    const parts = content.split(" ")

    return parts.map((part, index) => {
      // Handle comment references (#1, #2, etc.)
      if (part.startsWith("#") && !isNaN(Number.parseInt(part.substring(1)))) {
        const commentNumber = Number.parseInt(part.substring(1))
        return (
          <span
            key={`ref-${index}`}
            className="text-primary font-medium cursor-pointer"
            onClick={() => handleShowReplies(commentNumber)}
          >
            {part}{" "}
          </span>
        )
      }
      // Handle stock tickers ($AAPL, $TSLA, etc.)
      else if (part.startsWith("$") && stocksDatabase[part.substring(1)]) {
        const ticker = part.substring(1)
        return (
          <span
            key={`stock-${index}`}
            className="text-primary font-medium cursor-pointer"
            onClick={() => (window.location.href = `/stock/${ticker}`)}
          >
            {part}{" "}
          </span>
        )
      }
      return <span key={`text-${index}`}>{part} </span>
    })
  }

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Comments</h2>

      <div className="mb-6">
        <div className="flex items-center gap-3 bg-gray-700/30 rounded-full p-1 pl-3">
          <Avatar className="h-8 w-8 border border-gray-600">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@user" />
            <AvatarFallback className="bg-gray-600 text-gray-100">U</AvatarFallback>
          </Avatar>
          <Input
            ref={commentInputRef}
            placeholder={replyingTo ? `Reply to #${replyingTo}` : "Add a comment..."}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddComment()
              }
            }}
          />
          <Button size="sm" onClick={handleAddComment} className="rounded-full">
            Reply
          </Button>
        </div>
        {replyingTo && (
          <div className="mt-2 text-sm text-gray-400 flex justify-between">
            <span>Replying to comment #{replyingTo}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyingTo(null)
                setNewComment("")
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {topLevelComments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            onReply={handleReply}
            onShowReplies={handleShowReplies}
            processContent={processCommentContent}
          />
        ))}
      </div>

      <Dialog open={repliesDialogOpen} onOpenChange={setRepliesDialogOpen}>
        <DialogContent className="max-w-md bg-gray-800 border border-gray-700">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              {replyHistory.length > 0 && (
                <Button variant="ghost" size="sm" className="p-0 h-8 w-8" onClick={handleBackToParent}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <DialogTitle>Replies to Comment #{showRepliesFor}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {showRepliesFor &&
              getRepliesForComment(showRepliesFor).map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  onReply={(num) => {
                    setRepliesDialogOpen(false)
                    setTimeout(() => {
                      handleReply(num)
                    }, 300)
                  }}
                  onShowReplies={(num) => {
                    setReplyHistory((prev) => [...prev, showRepliesFor])
                    setShowRepliesFor(num)
                  }}
                  processContent={processCommentContent}
                />
              ))}
            {showRepliesFor && getRepliesForComment(showRepliesFor).length === 0 && (
              <div className="text-center py-6 text-muted-foreground">No replies to this comment yet.</div>
            )}
          </div>
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setRepliesDialogOpen(false)
                setTimeout(() => {
                  handleReply(showRepliesFor!)
                }, 300)
              }}
            >
              Reply to this comment
            </Button>
            <Button variant="ghost" onClick={() => setRepliesDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CommentCardProps {
  comment: Comment
  onReply: (commentNumber: number) => void
  onShowReplies: (commentNumber: number) => void
  processContent: (content: string) => React.ReactNode
}

function CommentCard({ comment, onReply, onShowReplies, processContent }: CommentCardProps) {
  return (
    <Card className="border-gray-700/30 bg-gradient-to-b from-gray-800/80 to-gray-750/90">
      <CardHeader className="flex flex-row items-center gap-3 p-3">
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-800/60 text-xs font-medium">
          #{comment.number}
        </div>
        <Avatar className="h-8 w-8 border border-gray-700">
          <AvatarImage src={comment.user.avatar} alt={`@${comment.user.username}`} />
          <AvatarFallback className="bg-gray-700 text-gray-100">{comment.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">{comment.user.name}</p>
            <p className="text-xs text-gray-400">{comment.time}</p>
          </div>
          <p className="text-xs text-gray-400">@{comment.user.username}</p>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-sm">{processContent(comment.content)}</p>

        {comment.stocksInfo && comment.stocksInfo.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {comment.stocksInfo.map((stock) => (
              <div
                key={stock.ticker}
                onClick={() => (window.location.href = `/stock/${stock.ticker}`)}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <span className="font-medium">${stock.ticker}</span>
                <span className="text-xs">{stock.name}</span>
                <span className={`text-xs ${stock.change >= 0 ? "text-green-500" : "text-red-500"}`}>
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
      </CardContent>
      <CardFooter className="p-3 pt-0 flex gap-2">
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <Heart className="h-3 w-3" />
          <span>{comment.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => onReply(comment.number)}>
          <Reply className="h-3 w-3" />
          <span>Reply</span>
        </Button>
        {comment.replies > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs ml-auto"
            onClick={() => onShowReplies(comment.number)}
          >
            <MessageCircle className="h-3 w-3" />
            <span>
              {comment.replies} {comment.replies === 1 ? "reply" : "replies"}
            </span>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

