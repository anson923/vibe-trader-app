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
import { StockBadge } from "./stock-badge"
import { getStockDataForPost, logger } from "@/lib/stock-utils"
import { DeletePostButton } from "./delete-post-button"

interface PostCardProps {
  id: number
  user: {
    name: string
    username: string
    avatar: string
    profit: number
    id?: string
  }
  userId?: string
  content: string
  time: string
  stats: {
    likes: number
    comments: number
    reposts: number
  }
  liked?: boolean
}

// Define type for the stock data returned from getStockDataForPost
interface ApiStockData {
  ticker: string;
  price: number;
  priceChange: number | null;
  priceChangePercentage: number | null;
}

// Type used within this component
interface StockData {
  id: number;
  ticker: string;
  price: number;
  price_change: number;
  price_change_percentage: number;
  created_at: string;
  updated_at: string;
}

export default function PostCard({
  id,
  user,
  userId,
  content,
  time,
  stats,
  liked: initialLiked,
}: PostCardProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [liked, setLiked] = useState(initialLiked || false)
  const [likesCount, setLikesCount] = useState(stats.likes)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stockData, setStockData] = useState<StockData[]>([])
  const profitColor = user.profit >= 0 ? "text-green-500" : "text-red-500"
  const profitSign = user.profit >= 0 ? "+" : ""

  // Fetch stock data for this post
  useEffect(() => {
    async function fetchStockData() {
      try {
        logger.info(`Fetching stock data for post ${id}`);
        // Using the server-managed stock data, no client-side refresh
        const data = await getStockDataForPost(id) as ApiStockData[];
        logger.verbose(`Received stock data for post ${id}:`, data);

        if (!data || data.length === 0) {
          logger.verbose(`No stock data found for post ${id}`);
          return;
        }

        // Generate random IDs for the stocks since we don't have real ones
        const processedData: StockData[] = data.map((item, index) => ({
          id: Date.now() + index, // Use timestamp + index as a unique id
          ticker: item.ticker,
          price: item.price,
          price_change: item.priceChange || 0,
          price_change_percentage: item.priceChangePercentage || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        logger.verbose(`Processed stock data for post ${id}:`, processedData);
        setStockData(processedData);
      } catch (error) {
        logger.error(`Error fetching stock data for post ${id}:`, error);
      }
    }

    fetchStockData();
  }, [id]);

  // Check if the current user has liked this post - only run if initialLiked is not provided
  useEffect(() => {
    async function checkIfLiked() {
      if (!currentUser || initialLiked !== undefined) return // Skip if initialLiked is provided

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
        logger.error('Error checking like status:', error)
      }
    }

    checkIfLiked()
  }, [id, currentUser, initialLiked]) // Add initialLiked to dependencies

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the card click from firing

    if (!currentUser) {
      router.push('/login')
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)
    
    // Store original state to restore on error
    const originalLiked = liked
    const originalLikesCount = likesCount
    
    // Optimistically update UI
    setLiked(!liked)
    setLikesCount(prev => !liked ? prev + 1 : Math.max(0, prev - 1))

    try {
      if (originalLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', currentUser.id)

        if (error) {
          throw error
        }
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
      }
    } catch (error) {
      logger.error('Error toggling like:', error)
      // Revert UI on error
      setLiked(originalLiked)
      setLikesCount(originalLikesCount)
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
        
        <DeletePostButton
          postId={id}
          userId={userId || ""}
          currentUserId={currentUser?.id}
          onSuccess={() => {
            // Refresh the feed by refetching posts
            window.location.reload()
          }}
        />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="mb-3">{content}</p>

        {/* Stock badges */}
        {stockData.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {stockData.map(stock => (
              <StockBadge
                key={stock.id}
                ticker={stock.ticker}
                price={stock.price}
                priceChange={stock.price_change}
                priceChangePercentage={stock.price_change_percentage}
              />
            ))}
          </div>
        )}
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

