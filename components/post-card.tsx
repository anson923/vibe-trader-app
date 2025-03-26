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
  console.log(`[PostCard] Rendering PostCard for Post ID ${id}`);
  console.log(`[PostCard] Initial stats for Post ID ${id}:`, { likes: stats.likes, comments: stats.comments, reposts: stats.reposts });

  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [liked, setLiked] = useState(initialLiked || false)
  const [likesCount, setLikesCount] = useState(stats.likes)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stockData, setStockData] = useState<StockData[]>([])
  const profitColor = user.profit >= 0 ? "text-green-500" : "text-red-500"
  const profitSign = user.profit >= 0 ? "+" : ""

  // This effect ensures the like count stays in sync with prop updates
  useEffect(() => {
    console.log(`[PostCard] Updating like state for Post ID ${id} - Liked: ${initialLiked}, Likes Count: ${stats.likes}`);
    setLiked(initialLiked || false)
    setLikesCount(stats.likes)
  }, [initialLiked, stats.likes, id])

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
      if (!currentUser || initialLiked !== undefined) {
        console.log(`[PostCard] Skipping like check for Post ID ${id} - User:`, currentUser ? 'logged in' : 'not logged in', 'Initial liked:', initialLiked);
        return;
      }

      try {
        console.log(`[PostCard] Checking like status for Post ID ${id}`);
        const { data, error } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', currentUser.id)
          .maybeSingle()

        if (error) {
          throw error
        }

        console.log(`[PostCard] Like status retrieved for Post ID ${id} - Liked:`, !!data);
        setLiked(!!data)
      } catch (error) {
        console.error(`[PostCard] Error checking like status for Post ID ${id}:`, error)
      }
    }

    checkIfLiked()
  }, [id, currentUser, initialLiked])

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the card click from firing

    console.log(`[PostCard] Post ID ${id} - Current like status:`, liked);
    console.log(`[PostCard] Post ID ${id} - Current likes count:`, likesCount);

    if (!currentUser) {
      console.log(`[PostCard] Post ID ${id} - No user logged in, redirecting to login`);
      router.push('/login')
      return
    }

    if (isSubmitting) {
      console.log(`[PostCard] Post ID ${id} - Like action already in progress`);
      return
    }

    setIsSubmitting(true)

    // Store original state to restore on error
    const originalLiked = liked
    const originalLikesCount = likesCount

    console.log(`[PostCard] Post ID ${id} - Optimistically updating UI - New like status:`, !liked);
    console.log(`[PostCard] Post ID ${id} - Optimistically updating count from ${likesCount} to`, liked ? likesCount - 1 : likesCount + 1);

    // Optimistically update UI
    setLiked(!liked)
    setLikesCount(prev => !liked ? prev + 1 : Math.max(0, prev - 1))

    try {
      if (originalLiked) {
        console.log(`[PostCard] Post ID ${id} - Attempting to unlike post in Supabase`);
        // Unlike the post
        const { error: unlikeError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', currentUser.id)

        if (unlikeError) {
          console.error(`[PostCard] Post ID ${id} - Error unliking post:`, unlikeError);
          throw unlikeError
        }

        // Update the post's likes count
        console.log(`[PostCard] Post ID ${id} - Updating post likes_count in posts table after unlike`);
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes_count: originalLikesCount - 1 })
          .eq('id', id)

        if (updateError) {
          console.error(`[PostCard] Post ID ${id} - Error updating post likes count:`, updateError);
          throw updateError
        }

        console.log(`[PostCard] Post ID ${id} - Successfully unliked post and updated count in Supabase`);
      } else {
        console.log(`[PostCard] Post ID ${id} - Attempting to like post in Supabase`);
        // Like the post
        const { error: likeError } = await supabase
          .from('likes')
          .insert({
            post_id: id,
            user_id: currentUser.id
          })

        if (likeError) {
          console.error(`[PostCard] Post ID ${id} - Error liking post:`, likeError);
          throw likeError
        }

        // Update the post's likes count
        console.log(`[PostCard] Post ID ${id} - Updating post likes_count in posts table after like`);
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes_count: originalLikesCount + 1 })
          .eq('id', id)

        if (updateError) {
          console.error(`[PostCard] Post ID ${id} - Error updating post likes count:`, updateError);
          throw updateError
        }

        console.log(`[PostCard] Post ID ${id} - Successfully liked post and updated count in Supabase`);
      }
    } catch (error) {
      console.error(`[PostCard] Post ID ${id} - Error toggling like:`, error);
      console.log(`[PostCard] Post ID ${id} - Reverting UI to original state - Liked: ${originalLiked}, Count: ${originalLikesCount}`);
      // Revert UI on error
      setLiked(originalLiked)
      setLikesCount(originalLikesCount)
    } finally {
      setIsSubmitting(false)
      console.log(`[PostCard] Post ID ${id} - Like action completed - Final state - Liked: ${!originalLiked}, Count: ${!originalLiked ? originalLikesCount + 1 : originalLikesCount - 1}`);
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
          <AvatarImage
            src={user.avatar.startsWith('/') ? user.avatar : `/avatars/${user.avatar}`}
            alt={`@${user.username}`}
            onError={(e) => {
              // If the image fails to load, set the source to our placeholder
              console.log(`[PostCard] Avatar image error for ${user.username}, using fallback`);
              e.currentTarget.src = '/user_icon.svg';
            }}
          />
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

