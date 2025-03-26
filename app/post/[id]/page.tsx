"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
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
    <div className="relative">
      <div className="flex items-start gap-2">
        <Textarea
          placeholder={`Reply to ${commentUsername}...`}
          className="flex-1 min-h-[60px] max-h-32 bg-gray-700/30 border border-gray-600 text-sm resize-none rounded-lg p-2"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          style={{ overflow: 'auto' }}
        />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 px-3"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="text-xs h-8 px-3 bg-primary hover:bg-primary/90"
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
const CommentPreview = ({ replies, onViewMore }: {
  replies: CommentData[];
  onViewMore: () => void;
}) => {
  const previewCount = Math.min(1, replies.length);
  const remainingCount = replies.length - previewCount;

  return (
    <div className="mt-1">
      {/* Show the first reply as preview */}
      {replies.slice(0, previewCount).map((reply) => (
        <div key={reply.id} className="pl-6 relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-700/50"></div>
          <div className="flex items-start gap-2 mb-1">
            <Avatar className="h-5 w-5 mt-0.5">
              <AvatarImage src={reply.avatar_url || "/user_icon.svg"} alt={`@${reply.username}`} />
              <AvatarFallback className="bg-gray-700 text-gray-100 text-xs">{reply.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-semibold">{reply.username}</span>
                <span className="text-xs text-gray-400">· {formatTimeAgo(reply.created_at)}</span>
              </div>
              <p className="text-gray-300 line-clamp-1">{reply.content}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Show view more button if there are additional replies */}
      {remainingCount > 0 && (
        <button
          onClick={onViewMore}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 pl-6 mt-1"
        >
          <div className="relative h-5 w-5">
            <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-700/50"></div>
            <div className="absolute left-0 top-1/2 h-0.5 w-2 bg-gray-700/50"></div>
            <Users className="h-3.5 w-3.5 ml-3" />
          </div>
          View {remainingCount} more {remainingCount === 1 ? 'reply' : 'replies'}
        </button>
      )}
    </div>
  );
};

// Helper function to format time in a relative way (e.g., "2h ago")
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}mo`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years}y`;
  }
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
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())

  // For infinite scrolling
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const COMMENTS_PER_PAGE = 10
  const commentSectionRef = useRef<HTMLDivElement>(null)

  // Convert string id to number
  const postId = parseInt(id)

  // Add function to handle comment expansion
  const toggleCommentExpanded = (commentId: number) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

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
        await fetchComments(1, true)
      } catch (error) {
        console.error(`[PostDetail] Error fetching post data for Post ID ${postId}:`, error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPostData()
  }, [postId, router])

  // Implement infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!commentSectionRef.current || isFetchingMore || !hasMore) return;

      const container = commentSectionRef.current;
      const { bottom } = container.getBoundingClientRect();
      const { innerHeight } = window;

      // Load more when user scrolls to the bottom of the comment section
      if (bottom <= innerHeight + 100) {
        loadMoreComments();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, isFetchingMore, page]);

  const loadMoreComments = async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    const nextPage = page + 1;
    await fetchComments(nextPage, false);
    setPage(nextPage);
    setIsFetchingMore(false);
  };

  const calculateTotalReplies = (comment: CommentData): number => {
    if (!comment.replies || comment.replies.length === 0) return 0;
    return comment.replies.reduce((total, reply) => total + 1 + calculateTotalReplies(reply), 0);
  };

  // Update the fetchComments function
  const fetchComments = async (pageNum: number = 1, isInitialFetch: boolean = false) => {
    if (!postId) return;

    if (isInitialFetch) {
      setIsLoadingComments(true);
    }

    try {
      // Store current expanded state
      const currentExpandedState = new Set(expandedComments);

      // Calculate offset based on page number
      const from = (pageNum - 1) * COMMENTS_PER_PAGE;
      const to = from + COMMENTS_PER_PAGE - 1;

      // Direct query to Supabase with pagination
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
        .is('parent_comment_id', null) // Only fetch top-level comments
        .order('created_at', { ascending: false })
        .range(from, to);

      if (commentsError) {
        throw commentsError;
      }

      // Fetch all replies for these comments in a single query
      const { data: repliesData, error: repliesError } = await supabase
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
        .not('parent_comment_id', 'is', null) // Only fetch replies
        .order('created_at', { ascending: true });

      if (repliesError) {
        throw repliesError;
      }

      if (commentsData) {
        // Set hasMore flag based on whether we received the full page of comments
        setHasMore(commentsData.length === COMMENTS_PER_PAGE);

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
        const processedComments = [...commentsData, ...(repliesData || [])].map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user_id: comment.user_id,
          post_id: comment.post_id || postId,
          username: comment.username || 'User',
          avatar_url: comment.avatar_url || '/user_icon.svg',
          parent_comment_id: comment.parent_comment_id || null,
          level: comment.level || 0,
          likes_count: comment.likes_count || 0,
          liked: likedCommentIds.has(comment.id),
          replies: [],
          isExpanded: currentExpandedState.has(comment.id), // Use stored expanded state
          totalReplies: 0
        }));

        // Transform flat comments into a tree structure
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
            }
          }
        });

        // Extract top-level comments 
        const rootComments = processedComments.filter(comment => !comment.parent_comment_id);

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

        if (isInitialFetch) {
          setComments(rootComments);
        } else {
          // Append new comments to existing ones, preserving expanded state
          setComments(prev => {
            const newComments = [...rootComments.filter(comment =>
              !prev.some(existing => existing.id === comment.id)
            )];

            // Preserve expanded state for existing comments
            return prev.map(existingComment => {
              const newComment = newComments.find(c => c.id === existingComment.id);
              return newComment ? { ...newComment, isExpanded: existingComment.isExpanded } : existingComment;
            }).concat(newComments);
          });
        }
      }
    } catch (error) {
      logger.error('Error fetching comments:', error);
    } finally {
      if (isInitialFetch) {
        setIsLoadingComments(false);
      }
      setIsFetchingMore(false);
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
        avatar_url: user.user_metadata?.avatar_url || "/user_icon.svg",
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
  };

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
        avatar_url: user.user_metadata?.avatar_url || "/user_icon.svg",
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

        // Store current expanded state
        const currentExpandedState = new Set(expandedComments);

        // Automatically expand the parent comment to show the new reply
        currentExpandedState.add(parentCommentId);
        setExpandedComments(currentExpandedState);

        // Reset to page 1 to ensure we get fresh data
        setPage(1);

        // Refresh comments with the stored expanded state
        await fetchComments(1, true);

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
  };

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
  const CommentItem = ({
    comment,
    level = 0,
    isLastInThread = true
  }: {
    comment: CommentData,
    level?: number,
    isLastInThread?: boolean
  }) => {
    const isReplyActive = activeReplyTo === comment.id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedComments.has(comment.id);
    const totalReplies = comment.totalReplies || 0;
    const shouldShowThreadLine = level > 0 && !isLastInThread;
    const [showOptions, setShowOptions] = useState(false);

    const handleReplySubmit = (content: string) => {
      handleSubmitReply(comment.id, comment.level || 0, content);
    };

    const handleReport = () => {
      // Here you would implement the report functionality
      alert(`Comment by ${comment.username} has been reported.`);
      setShowOptions(false);
    };

    // Show only the first reply by default for deeply nested comments (level 2+)
    const shouldUseProgressiveDisclosure = level >= 2;

    return (
      <div className={`relative mb-3 ${level > 0 ? 'pl-6' : ''}`}>
        {/* Thread line connecting to parent */}
        {level > 0 && (
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-700/50"></div>
        )}

        {/* Comment Card */}
        <div className="relative">
          <div className="flex gap-3">
            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={comment.avatar_url || "/user_icon.svg"}
                alt={`@${comment.username}`}
                onError={(e) => {
                  console.log(`[PostDetail] Avatar image error for comment author ${comment.username}, using fallback`);
                  e.currentTarget.src = '/user_icon.svg';
                }}
              />
              <AvatarFallback className="bg-gray-700 text-gray-100">{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* Comment Content */}
            <div className="flex-1">
              {/* Username and timestamp */}
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-sm">{comment.username}</p>
                  <span className="text-xs text-gray-400">· {formatTimeAgo(comment.created_at)}</span>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-300"
                  onClick={() => setShowOptions(!showOptions)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-horizontal">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>

              {/* Options dropdown */}
              {showOptions && (
                <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    onClick={handleReport}
                  >
                    Report
                  </button>
                </div>
              )}

              {/* Comment text */}
              <p className="text-sm text-gray-200 mb-2">{comment.content}</p>

              {/* Action buttons */}
              <div className="flex items-center gap-4 mb-1">
                <button
                  className={`flex items-center gap-1 text-gray-400 hover:text-gray-300 ${comment.liked ? 'text-red-500' : ''}`}
                  onClick={() => handleCommentLike(comment.id, !!comment.liked)}
                  disabled={isSubmittingCommentLike}
                >
                  <Heart className={`h-3.5 w-3.5 ${comment.liked ? 'fill-current' : ''}`} />
                  {comment.likes_count > 0 && (
                    <span className="text-xs">{comment.likes_count}</span>
                  )}
                </button>

                <button
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-300"
                  onClick={() => {
                    if (isReplyActive) {
                      setActiveReplyTo(null);
                    } else {
                      setActiveReplyTo(comment.id);
                    }
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-xs">Reply</span>
                </button>

                {hasReplies && (
                  <button
                    className="flex items-center gap-1 text-gray-400 hover:text-gray-300"
                    onClick={() => toggleCommentExpanded(comment.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    <span className="text-xs">
                      {isExpanded ? 'Hide' : 'Show'} {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reply form */}
          {isReplyActive && user && (
            <div className="mt-2 ml-11">
              <ReplyForm
                user={user}
                commentUsername={comment.username}
                onSubmit={handleReplySubmit}
                onCancel={() => setActiveReplyTo(null)}
                isSubmitting={isSubmittingComment}
              />
            </div>
          )}
        </div>

        {/* Nested replies */}
        {hasReplies && (
          <div className="mt-2">
            {isExpanded ? (
              // Fully expanded view - show all replies
              <div className="space-y-1">
                {comment.replies?.map((reply, index) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    level={level + 1}
                    isLastInThread={index === comment.replies!.length - 1}
                  />
                ))}
              </div>
            ) : shouldUseProgressiveDisclosure ? (
              // Progressive disclosure for deeply nested comments
              <CommentPreview
                replies={comment.replies || []}
                onViewMore={() => toggleCommentExpanded(comment.id)}
              />
            ) : null}
          </div>
        )}
      </div>
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
    <div className="container px-4 py-6 md:px-6 max-w-3xl mx-auto">
      <div className="mb-4 flex items-center">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Post</h1>
      </div>

      <div className="mx-auto">
        {/* Post card */}
        <Card className="border-gray-700 bg-gray-800 mb-6">
          <CardHeader className="flex flex-row items-center gap-4 p-4">
            <Avatar>
              <AvatarImage
                src={post.avatar_url || "/user_icon.svg"}
                alt={`@${post.username}`}
                onError={(e) => {
                  console.log(`[PostDetail] Avatar image error for post author ${post.username}, using fallback`);
                  e.currentTarget.src = '/user_icon.svg';
                }}
              />
              <AvatarFallback className="bg-gray-700 text-gray-100">{post.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{post.username}</p>
              <p className="text-sm text-gray-400">
                @{post.username.toLowerCase().replace(/\s+/g, '')} • {formatTimeAgo(post.created_at)}
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
          <div className="mb-8 border-b border-gray-700 pb-6">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage
                  src={user.user_metadata?.avatar_url || "/user_icon.svg"}
                  alt="Your avatar"
                  onError={(e) => {
                    console.log(`[PostDetail] Avatar image error for comment form, using fallback`);
                    e.currentTarget.src = '/user_icon.svg';
                  }}
                />
                <AvatarFallback className="bg-gray-700 text-gray-100">{user.email?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <form onSubmit={handleSubmitComment} className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  className="w-full min-h-24 bg-gray-700/30 border border-gray-600 rounded-lg p-3 mb-2 resize-none"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                    disabled={isSubmittingComment || !newComment.trim()}
                  >
                    {isSubmittingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Comments section */}
        <div ref={commentSectionRef}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Comments • {commentsCount}</h2>
          </div>

          {isLoadingComments ? (
            <div className="flex justify-center py-6">
              <div className="animate-pulse text-gray-400">Loading comments...</div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
              {isFetchingMore && (
                <div className="flex justify-center py-4">
                  <div className="animate-pulse text-gray-400">Loading more comments...</div>
                </div>
              )}
              {!hasMore && comments.length > COMMENTS_PER_PAGE && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  You've reached the end of the comments
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// The main component using useParams for client components
export default function PostPage() {
  // In client components, we use useParams() to access route parameters
  // This avoids the issue with params needing to be awaited
  const params = useParams();
  const id = params?.id as string || "";

  return <PostPageContent id={id} />;
}
