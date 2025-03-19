"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { MessageSquare, Heart, Share2, Bookmark, Repeat2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { supabase } from "@/lib/supabase"

interface PostCardProps {
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

export default function PostCard({
  id,
  user,
  content,
  time,
  stats,
}: PostCardProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(stats.likes)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const profitColor = user.profit >= 0 ? "text-green-500" : "text-red-500"
  const profitSign = user.profit >= 0 ? "+" : ""

  // Check if the current user has liked this post
  useEffect(() => {
    async function checkIfLiked() {
      if (!currentUser) return

      try {
        const { data, error } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', currentUser.id)
          .maybeSingle()

        if (error) {
          throw error
        }

        setLiked(!!data)
      } catch (error) {
        console.error('Error checking like status:', error)
      }
    }

    checkIfLiked()
  }, [id, currentUser])

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the card click from firing

    if (!currentUser) {
      router.push('/login')
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      if (liked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', currentUser.id)

        if (error) {
          throw error
        }

        setLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: id,
            user_id: currentUser.id
          })

        if (error) {
          throw error
        }

        setLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCardClick = () => {
    router.push(`/post/${id}`)
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
            {user.profit !== 0 && (
              <span className={`text-sm font-medium ${profitColor}`}>
                {profitSign}
                {user.profit}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            @{user.username} • {time}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="mb-3">{content}</p>
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${liked ? 'text-red-500' : ''}`}
          onClick={handleLike}
          disabled={isSubmitting}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          <span>{likesCount}</span>
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

