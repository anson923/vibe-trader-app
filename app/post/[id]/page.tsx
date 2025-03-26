"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageSquare, Share2, Bookmark, Repeat2, ArrowLeft, ChevronDown, Users } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"
import { supabase } from "@/lib/supabase"
import { StockBadge } from "@/components/stock-badge"
import { getStockDataForPost, logger } from "@/lib/stock-utils"
import { DeletePostButton } from "@/components/delete-post-button"

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
  parent_comment_id?: number
  level?: number
  likes_count: number
  liked?: boolean
  replies?: CommentData[]
  isExpanded?: boolean
  totalReplies?: number
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

// Add this new component before the PostPageContent component
const ReplyForm = ({
  user,
  commentUsername,
  onSubmit,
  onCancel,
  isSubmitting
}: {
  user: any;
  commentUsername: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) => {
  const [replyContent, setReplyContent] = useState("");

  return (
    <div className="px-4 pb-4">
      <div className="pl-6 border-l-2 border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="mr-2 flex items-start pt-1.5">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                alt="Your avatar"
                onError={(e) => {
                  console.log(`[PostDetail] Avatar image error for current user, using fallback`);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </Avatar>
          </div>
          <span className="text-gray-400 text-sm">You</span>
        </div>
        <Textarea
          placeholder={`Reply to ${commentUsername}...`}
          className="flex-1 min-h-16 bg-gray-700/30 border-gray-600 text-sm"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={isSubmitting || !replyContent.trim()}
          onClick={() => onSubmit(replyContent)}
        >
          {isSubmitting ? "Replying..." : "Reply"}
        </Button>
      </div>
    </div>
  );
};

// Add the CommentPreview component
const CommentPreview = ({ replies }: { replies: CommentData[] }) => {
  const previewCount = Math.min(3, replies.length);

  return (
    <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-gray-800/50 rounded-md">
      <div className="flex -space-x-2">
        {replies.slice(0, previewCount).map((reply, index) => (
          <Avatar key={reply.id} className="h-6 w-6 border-2 border-gray-800">
            <AvatarImage src={reply.avatar_url} alt={`@${reply.username}`} />
            <AvatarFallback>{reply.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className="text-sm text-gray-400">
        <Users className="h-4 w-4 inline mr-1" />
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </span>
    </div>
  );
};

function PostPageContent({ id }: { id: string }) {
  console.log(`[PostDetail] Rendering PostDetail for Post ID ${id}`);

  const router = useRouter()
  const { user, getAccessToken, getAuthTokens } = useAuth()
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
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [activeReplyTo, setActiveReplyTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState<string>("")
  const [isSubmittingCommentLike, setIsSubmittingCommentLike] = useState(false)

  // Convert string id to number
  const postId = parseInt(id)

  // Fetch post data and comments
  useEffect(() => {
    async function fetchPostData() {
      try {
        console.log(`[PostDetail] Fetching post data for Post ID ${postId}`);
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
          console.log(`[PostDetail] Post data retrieved for Post ID ${postId}:`, {
            likes_count: postData.likes_count,
            comments_count: postData.comments_count
          });
          setPost(postData)
          setLikesCount(postData.likes_count || 0)
          setCommentsCount(postData.comments_count || 0)
        }

        // Get comments directly from Supabase
        await fetchComments()
      } catch (error) {
        console.error(`[PostDetail] Error fetching post data for Post ID ${postId}:`, error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPostData()
  }, [postId, router])

  const calculateTotalReplies = (comment: CommentData): number => {
    if (!comment.replies || comment.replies.length === 0) return 0;
    return comment.replies.reduce((total, reply) => total + 1 + calculateTotalReplies(reply), 0);
  };

  // Update the fetchComments function
  const fetchComments = async () => {
    if (!postId) return;

    setIsLoadingComments(true);

    try {
      // Direct query to Supabase
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_id,
          username,
          avatar_url,
          parent_comment_id,
          level,
          likes_count
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        throw commentsError;
      }

      if (commentsData) {
        // Map to track liked comments if user is authenticated
        let likedCommentIds = new Set<number>();

        if (user) {
          // Check which comments the user has liked
          const { data: likedComments, error: likesError } = await supabase
            .from('comment_likes')
            .select('comment_id')
            .eq('user_id', user.id);

          if (!likesError && likedComments) {
            likedCommentIds = new Set(likedComments.map(like => like.comment_id));
          }
        }

        // Map comments directly without nested profiles handling
        const processedComments = commentsData.map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user_id: comment.user_id,
          post_id: comment.post_id || postId,
          username: comment.username || 'User',
          avatar_url: comment.avatar_url || '/placeholder.svg',
          parent_comment_id: comment.parent_comment_id || null,
          level: comment.level || 0,
          likes_count: comment.likes_count || 0,
          liked: likedCommentIds.has(comment.id),
          replies: [],
          isExpanded: false,
          totalReplies: 0
        }));

        // Transform flat comments into a tree structure
        const rootComments: CommentData[] = [];
        const commentMap = new Map<number, CommentData>();

        // First, create a map of all comments
        processedComments.forEach(comment => {
          commentMap.set(comment.id, comment);
        });

        // Then, build the tree structure
        processedComments.forEach(comment => {
          if (comment.parent_comment_id) {
            // This is a reply, add it to parent's replies array
            const parentComment = commentMap.get(comment.parent_comment_id);
            if (parentComment) {
              if (!parentComment.replies) parentComment.replies = [];
              parentComment.replies.push(comment);
            } else {
              // If parent doesn't exist (shouldn't happen), add as root
              rootComments.push(comment);
            }
          } else {
            // Root level comment
            rootComments.push(comment);
          }
        });

        // Calculate total replies for each comment
        const calculateTotals = (comments: CommentData[]) => {
          comments.forEach(comment => {
            comment.totalReplies = calculateTotalReplies(comment);
            if (comment.replies && comment.replies.length > 0) {
              calculateTotals(comment.replies);
            }
          });
        };

        calculateTotals(rootComments);

        // Sort root comments by created_at (newest first)
        rootComments.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Sort replies by created_at (oldest first)
        const sortReplies = (comments: CommentData[]) => {
          comments.forEach(comment => {
            if (comment.replies && comment.replies.length > 0) {
              comment.replies.sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              sortReplies(comment.replies);
            }
          });
        };

        sortReplies(rootComments);

        setComments(rootComments);
      }
    } catch (error) {
      logger.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Fetch stock data for this post
  useEffect(() => {
    async function fetchStockData() {
      try {
        logger.info(`Fetching stock data for post detail ${postId}`);
        // Using the server-managed stock data, no client-side refresh needed
        const data = await getStockDataForPost(postId) as ApiStockData[];
        logger.verbose(`Received stock data for post detail ${postId}:`, data);

        if (!data || data.length === 0) {
          logger.verbose(`No stock data found for post detail ${postId}`);
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

        logger.verbose(`Processed stock data for post detail ${postId}:`, processedData);
        setStockData(processedData);
      } catch (error) {
        logger.error(`Error fetching stock data for post detail ${postId}:`, error);
      }
    }

    if (postId) {
      fetchStockData();
    }
  }, [postId]);

  // Check if user has liked the post
  useEffect(() => {
    async function checkIfLiked() {
      if (!user || !postId) {
        console.log(`[PostDetail] Skipping like check for Post ID ${postId} - User:`, user ? 'logged in' : 'not logged in');
        return;
      }

      try {
        console.log(`[PostDetail] Checking like status for Post ID ${postId}`);
        const { data, error } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          throw error
        }

        console.log(`[PostDetail] Like status retrieved for Post ID ${postId} - Liked:`, !!data);
        setLiked(!!data)
      } catch (error) {
        console.error(`[PostDetail] Error checking like status for Post ID ${postId}:`, error)
      }
    }

    checkIfLiked()
  }, [postId, user])

  const handleLike = async () => {
    console.log(`[PostDetail] Post ID ${postId} - Current like status:`, liked);
    console.log(`[PostDetail] Post ID ${postId} - Current likes count:`, likesCount);

    if (!user) {
      console.log(`[PostDetail] Post ID ${postId} - No user logged in, redirecting to login`);
      router.push('/login')
      return
    }

    if (isSubmittingLike) {
      console.log(`[PostDetail] Post ID ${postId} - Like action already in progress`);
      return
    }

    setIsSubmittingLike(true)

    // Store original state to restore on error
    const originalLiked = liked
    const originalLikesCount = likesCount

    console.log(`[PostDetail] Post ID ${postId} - Optimistically updating UI - New like status:`, !liked);
    console.log(`[PostDetail] Post ID ${postId} - Optimistically updating count from ${likesCount} to`, liked ? likesCount - 1 : likesCount + 1);

    // Optimistically update UI
    setLiked(!liked)
    setLikesCount(prev => !liked ? prev + 1 : Math.max(0, prev - 1))

    try {
      if (originalLiked) {
        console.log(`[PostDetail] Post ID ${postId} - Attempting to unlike post in Supabase`);
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) {
          console.error(`[PostDetail] Post ID ${postId} - Error unliking post:`, error);
          throw error
        }

        console.log(`[PostDetail] Post ID ${postId} - Successfully unliked post in Supabase`);
        // Update the post object to keep it in sync
        if (post) {
          console.log(`[PostDetail] Post ID ${postId} - Updating post object likes count from ${post.likes_count} to ${Math.max(0, post.likes_count - 1)}`);
          setPost({
            ...post,
            likes_count: Math.max(0, post.likes_count - 1)
          })
        }
      } else {
        console.log(`[PostDetail] Post ID ${postId} - Attempting to like post in Supabase`);
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        if (error) {
          console.error(`[PostDetail] Post ID ${postId} - Error liking post:`, error);
          throw error
        }

        console.log(`[PostDetail] Post ID ${postId} - Successfully liked post in Supabase`);
        // Update the post object to keep it in sync
        if (post) {
          console.log(`[PostDetail] Post ID ${postId} - Updating post object likes count from ${post.likes_count} to ${post.likes_count + 1}`);
          setPost({
            ...post,
            likes_count: post.likes_count + 1
          })
        }
      }
    } catch (error) {
      console.error(`[PostDetail] Post ID ${postId} - Error toggling like:`, error);
      console.log(`[PostDetail] Post ID ${postId} - Reverting UI to original state - Liked: ${originalLiked}, Count: ${originalLikesCount}`);
      // Revert UI on error
      setLiked(originalLiked)
      setLikesCount(originalLikesCount)
    } finally {
      setIsSubmittingLike(false)
      console.log(`[PostDetail] Post ID ${postId} - Like action completed - Final state - Liked: ${!originalLiked}, Count: ${!originalLiked ? originalLikesCount + 1 : originalLikesCount - 1}`);
    }
  }

  // Handle submit comment using direct Supabase
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      router.push('/login')
      return
    }

    if (!newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)

    try {
      const commentData = {
        content: newComment.trim(),
        user_id: user.id,
        post_id: postId,
        username: user.user_metadata?.username || "Anonymous User",
        avatar_url: user.user_metadata?.avatar_url || "/placeholder.svg",
        created_at: new Date().toISOString(),
        parent_comment_id: null,
        level: 0
      };

      // Direct Supabase insertion
      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select();

      if (error) {
        throw error;
      }

      if (data && data[0]) {
        // Clear comment input
        setNewComment("");

        // Refresh all comments
        await fetchComments();

        // Update counts
        setCommentsCount(prev => prev + 1);

        // Also update the likes count in the post
        try {
          await supabase
            .from('posts')
            .update({ comments_count: commentsCount + 1 })
            .eq('id', postId);
        } catch (error) {
          console.error('Error updating post comments count:', error);
          // Continue anyway since the comment was added successfully
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Handle submit reply to a comment
  const handleSubmitReply = async (parentCommentId: number, parentLevel: number = 0, content: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!content.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)

    try {
      const commentData = {
        content: content.trim(),
        user_id: user.id,
        post_id: postId,
        username: user.user_metadata?.username || "Anonymous User",
        avatar_url: user.user_metadata?.avatar_url || "/placeholder.svg",
        created_at: new Date().toISOString(),
        parent_comment_id: parentCommentId,
        level: parentLevel + 1
      };

      // Direct Supabase insertion
      const { data, error: supabaseError } = await supabase
        .from('comments')
        .insert([commentData])
        .select();

      if (supabaseError) {
        throw supabaseError;
      }

      if (data && data[0]) {
        // Close reply form
        setActiveReplyTo(null);

        // Refresh all comments
        await fetchComments();

        // Update counts
        setCommentsCount(prev => prev + 1);

        try {
          await supabase
            .from('posts')
            .update({ comments_count: commentsCount + 1 })
            .eq('id', postId);
        } catch (error) {
          console.error('Error updating post comments count:', error);
        }
      }
    } catch (error) {
      console.error('Error adding reply:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Handle liking a comment
  const handleCommentLike = async (commentId: number, isLiked: boolean) => {
    if (!user) {
      router.push('/login')
      return
    }

    if (isSubmittingCommentLike) return

    setIsSubmittingCommentLike(true)

    // Optimistically update UI first
    setComments(prevComments => {
      // Helper function to update comment in a nested structure
      const updateCommentInTree = (comments: CommentData[]): CommentData[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            // Update this comment
            return {
              ...comment,
              liked: !isLiked,
              likes_count: isLiked ? Math.max(0, comment.likes_count - 1) : comment.likes_count + 1
            };
          } else if (comment.replies && comment.replies.length > 0) {
            // Check in replies
            return {
              ...comment,
              replies: updateCommentInTree(comment.replies)
            };
          }
          return comment;
        });
      };

      return updateCommentInTree(prevComments);
    });

    // Save the original comments state to restore on error
    const originalComments = [...comments];

    try {
      if (isLiked) {
        // Unlike the comment - delete the like
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }
      } else {
        // Like the comment - insert new like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });

        if (error) {
          // If already liked (409 conflict) just ignore
          if (error.code === '23505') { // Unique violation error code
            setIsSubmittingCommentLike(false);
            return;
          }
          throw error;
        }
      }

      // Refresh comments to ensure consistency with server state
      await fetchComments();
    } catch (error) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} comment:`, error);
      // Revert UI to original state on error
      setComments(originalComments);
    } finally {
      setIsSubmittingCommentLike(false);
    }
  };

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

  // Define the CommentItem component for rendering comments and replies
  const CommentItem = ({ comment, level = 0 }: { comment: CommentData, level?: number }) => {
    const isReplyActive = activeReplyTo === comment.id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const [isExpanded, setIsExpanded] = useState(false);

    const handleReplySubmit = (content: string) => {
      handleSubmitReply(comment.id, comment.level || 0, content);
    };

    const toggleExpanded = () => {
      setIsExpanded(!isExpanded);
    };

    return (
      <Card className="border-gray-700 bg-gray-800/80 overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 p-4">
          <div className="mr-4">
            <Avatar>
              <AvatarImage
                src={comment.avatar_url || "/placeholder.svg"}
                alt={`@${comment.username}`}
                onError={(e) => {
                  console.log(`[PostDetail] Avatar image error for comment author ${comment.username}, using fallback`);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
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
        <CardFooter className="flex justify-between p-3 pt-1 border-t border-gray-700">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 ${comment.liked ? 'text-red-500' : ''}`}
              onClick={() => handleCommentLike(comment.id, !!comment.liked)}
              disabled={isSubmittingCommentLike}
            >
              <Heart className={`h-4 w-4 ${comment.liked ? 'fill-current' : ''}`} />
              <span>{comment.likes_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => {
                if (isReplyActive) {
                  setActiveReplyTo(null);
                } else {
                  setActiveReplyTo(comment.id);
                }
              }}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Reply</span>
            </Button>
          </div>

          {hasReplies && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={toggleExpanded}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              <span>{comment.replies?.length} {comment.replies?.length === 1 ? 'reply' : 'replies'}</span>
            </Button>
          )}
        </CardFooter>

        {/* Reply form */}
        {isReplyActive && user && (
          <div className="border-t border-gray-700">
            <ReplyForm
              user={user}
              commentUsername={comment.username}
              onSubmit={handleReplySubmit}
              onCancel={() => setActiveReplyTo(null)}
              isSubmitting={isSubmittingComment}
            />
          </div>
        )}

        {/* Nested replies */}
        {hasReplies && (
          <div className="border-t border-gray-700">
            {!isExpanded ? (
              <CommentPreview replies={comment.replies!} />
            ) : (
              <div className="bg-gray-800/30 py-2">
                {comment.replies?.map(reply => (
                  <div key={reply.id} className="px-4 mb-2 last:mb-0">
                    <CommentItem comment={reply} level={level + 1} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

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
              <AvatarImage
                src={post.avatar_url || "/placeholder.svg"}
                alt={`@${post.username}`}
                onError={(e) => {
                  console.log(`[PostDetail] Avatar image error for post author ${post.username}, using fallback`);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <AvatarFallback>{post.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{post.username}</p>
              <p className="text-sm text-gray-400">
                @{post.username.toLowerCase().replace(/\s+/g, '')} • {formatDate(post.created_at)}
              </p>
            </div>
            <DeletePostButton
              postId={postId}
              userId={post.user_id}
              currentUserId={user?.id}
              onSuccess={() => router.push('/')}
            />
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
                  <div className="mr-2 flex items-start pt-1.5">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                        alt="Your avatar"
                        onError={(e) => {
                          console.log(`[PostDetail] Avatar image error for comment form, using fallback`);
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                  </div>
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Comments ({commentsCount})</h2>
          </div>

          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
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
    </div>
  )
}

// The main component that properly unwraps params
export default function PostPage({ params }: PageProps) {
  return <PostPageContent id={params.id} />;
}

