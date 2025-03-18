"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageSquare, Share } from "lucide-react"

interface PostProps {
  post: {
    id: string
    author: {
      name: string
      username: string
      avatar: string
    }
    content: string
    timestamp: string
    image?: string
    likes: number
    comments: number
    shares: number
    department: string
  }
}

export default function Post({ post }: PostProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)

  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1)
    } else {
      setLikeCount(likeCount + 1)
    }
    setLiked(!liked)
  }

  // Format content to highlight hashtags
  const formatContent = (content: string) => {
    return content.split(" ").map((word, index) => {
      if (word.startsWith("#")) {
        return (
          <span key={index} className="text-university-primary font-medium">
            {word}{" "}
          </span>
        )
      }
      return word + " "
    })
  }

  return (
    <Card className="border-university-secondary/20 shadow-sm">
      <CardHeader className="flex flex-row items-start gap-4 p-4 pb-0">
        <Avatar className="h-10 w-10 border border-university-secondary/20">
          <AvatarImage src={post.author.avatar} alt={post.author.name} />
          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{post.author.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{post.timestamp}</span>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-university-secondary/10 text-university-secondary border-university-secondary/20"
            >
              {post.department}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <p className="mb-3 whitespace-pre-line">{formatContent(post.content)}</p>
        {post.image && (
          <div className="overflow-hidden rounded-lg">
            <img
              src={post.image || "/placeholder.svg"}
              alt="Post attachment"
              className="h-auto w-full object-cover transition-all hover:scale-105"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0">
        <Button variant="ghost" size="sm" className={`gap-1 ${liked ? "text-red-500" : ""}`} onClick={handleLike}>
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1">
          <MessageSquare className="h-4 w-4" />
          <span>{post.comments}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1">
          <Share className="h-4 w-4" />
          <span>{post.shares}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}

