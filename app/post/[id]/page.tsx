"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageSquare, Share2, Bookmark, Repeat2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"
import { supabase } from "@/lib/supabase"
import { StockBadge } from "@/components/stock-badge"
import { getStockDataForPost } from "@/lib/stock-utils"

interface PostData {
  id: number
  user_id: string
  content: string
  username: string
  avatar_url: string
  created_at: string
  likes_count: number
  comments_count: number
}

interface CommentData {
  id: number
  user_id: string
  post_id: number
  content: string
  username: string
  avatar_url: string
  created_at: string
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

// Adding proper typing for RSC params
type PageProps = {
  params: { id: string }
}

function PostPageContent({ id }: { id: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState<PostData | null>(null)
  const [comments, setComments] = useState<CommentData[]>([])
  const [newComment, setNewComment] = useState("")
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [commentsCount, setCommentsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingLike, setIsSubmittingLike] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [stockData, setStockData] = useState<StockData[]>([])

  // Convert string id to number
  const postId = parseInt(id)

  // Fetch post data and comments
  useEffect(() => {
    async function fetchPostData() {
      try {
        // Get post data
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single()

        if (postError) {
          throw postError
        }

        if (postData) {
          setPost(postData)
          setLikesCount(postData.likes_count || 0)
          setCommentsCount(postData.comments_count || 0)
        }

        // Get comments for this post
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })

        if (commentsError) {
          throw commentsError
        }

        if (commentsData) {
          setComments(commentsData)
        }
      } catch (error) {
        console.error('Error fetching post data:', error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPostData()
  }, [postId, router])

  // Fetch stock data for this post
  useEffect(() => {
    async function fetchStockData() {
      try {
        console.log(`Fetching stock data for post detail ${postId}`);
        const data = await getStockDataForPost(postId) as ApiStockData[];
        console.log(`Received stock data for post detail ${postId}:`, data);

        if (!data || data.length === 0) {
          console.log(`No stock data found for post detail ${postId}`);
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

        console.log(`Processed stock data for post detail ${postId}:`, processedData);
        setStockData(processedData);
      } catch (error) {
        console.error(`Error fetching stock data for post detail ${postId}:`, error);
      }
    }

    if (postId) {
      fetchStockData();
    }
  }, [postId]);

  // Check if user has liked the post
  useEffect(() => {
    async function checkIfLiked() {
      if (!user || !postId) return

      try {
        const { data, error } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
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
  }, [postId, user])

  const handleLike = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (isSubmittingLike) return

    setIsSubmittingLike(true)

    try {
      if (liked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

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
            post_id: postId,
            user_id: user.id
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
      setIsSubmittingLike(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      router.push('/login')
      return
    }

    if (!newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)

    try {
      // Add comment to database
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
          username: user.user_metadata?.username || "Anonymous",
          avatar_url: user.user_metadata?.avatar_url || "/placeholder.svg?height=40&width=40"
        })
        .select()

      if (error) {
        throw error
      }

      if (data && data[0]) {
        // Add new comment to the comments list
        setComments(prev => [data[0], ...prev])
        setCommentsCount(prev => prev + 1)
        setNewComment("")
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Format date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="container px-4 py-6 md:px-6">
        <div className="flex justify-center py-10">
          <div className="animate-pulse text-gray-400">Loading post...</div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container px-4 py-6 md:px-6">
        <div className="flex justify-center py-10">
          <div className="text-gray-400">Post not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Post</h1>
      </div>

      <div className="mx-auto max-w-2xl">
        <Card className="border-gray-700 bg-gray-800 mb-6">
          <CardHeader className="flex flex-row items-center gap-4 p-4">
            <Avatar>
              <AvatarImage src={post.avatar_url || "/placeholder.svg?height=40&width=40"} alt={`@${post.username}`} />
              <AvatarFallback className="bg-gray-700">{post.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{post.username}</p>
              <p className="text-sm text-gray-400">
                @{post.username.toLowerCase().replace(/\s+/g, '')} • {formatDate(post.created_at)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="mb-3 text-lg">{post.content}</p>
            
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
          <CardFooter className="flex justify-between p-4 pt-0 border-t border-gray-700 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 ${liked ? 'text-red-500' : ''}`}
              onClick={handleLike}
              disabled={isSubmittingLike}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{commentsCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1">
              <Repeat2 className="h-4 w-4" />
              <span>0</span>
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bookmark className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Add comment form */}
        {user && (
          <Card className="border-gray-700 bg-gray-800 mb-6">
            <form onSubmit={handleSubmitComment}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url || "/placeholder.svg?height=32&width=32"}
                      alt={user.user_metadata?.username || "User"}
                    />
                    <AvatarFallback className="bg-gray-700">
                      {user.user_metadata?.username ? user.user_metadata.username.substring(0, 1).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Textarea
                    placeholder="Add a comment..."
                    className="flex-1 min-h-16 bg-gray-700/30 border-gray-600"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end p-4 pt-0">
                <Button type="submit" disabled={isSubmittingComment || !newComment.trim()}>
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Comments section */}
        <h2 className="text-lg font-semibold mb-4">Comments ({commentsCount})</h2>
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="border-gray-700 bg-gray-800">
                <CardHeader className="flex flex-row items-center gap-3 p-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.avatar_url || "/placeholder.svg?height=32&width=32"} alt={`@${comment.username}`} />
                    <AvatarFallback className="bg-gray-700">{comment.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{comment.username}</p>
                    <p className="text-xs text-gray-400">
                      @{comment.username.toLowerCase().replace(/\s+/g, '')} • {formatDate(comment.created_at)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p>{comment.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-gray-700 bg-gray-800">
            <CardContent className="p-4">
              <p className="text-center text-gray-400">No comments yet. Be the first to comment!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// The main component that properly unwraps params using React.use()
export default function PostPage({ params }: PageProps) {
  // Explicitly use React.use to unwrap params before accessing its properties
  // This follows Next.js latest recommendations
  const unwrappedParams = React.use(params as any) as { id: string };
  return <PostPageContent id={unwrappedParams.id} />;
}

