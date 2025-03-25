import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/stock-utils';
import { createClient } from '@supabase/supabase-js';

// Simple in-memory cache for comments
// In production, consider using Redis or another distributed cache
interface CommentCache {
  [postId: number]: {
    comments: any[];
    lastUpdated: number;
  }
}

// Cache expiration time (15 minutes)
const CACHE_EXPIRATION = 15 * 60 * 1000;

// Initialize comment cache
const commentsCache: CommentCache = {};

// Helper function to transform flat comments into nested structure
function buildCommentTree(comments: any[]) {
  // Map to store comments by ID for quick lookup
  const commentMap = new Map();
  const rootComments: any[] = [];

  // First pass: create a map of comment ID to comment object
  comments.forEach(comment => {
    // Ensure replies array exists
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  // Second pass: Organize into parent-child relationships
  comments.forEach(comment => {
    if (comment.parent_comment_id) {
      // This is a reply - add it to its parent's replies array
      const parentComment = commentMap.get(comment.parent_comment_id);
      if (parentComment) {
        parentComment.replies.push(comment);
      } else {
        // If parent doesn't exist (should not happen), add as root
        rootComments.push(comment);
      }
    } else {
      // This is a root comment
      rootComments.push(comment);
    }
  });

  // Sort root comments by created_at (newest first)
  rootComments.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // Sort each comment's replies by created_at (oldest first for replies)
  const sortReplies = (comments: any[]) => {
    for (const comment of comments) {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        // Recursively sort replies of replies
        sortReplies(comment.replies);
      }
    }
  };
  
  sortReplies(rootComments);
  
  return rootComments;
}

/**
 * GET handler for retrieving cached comments
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const postId = url.searchParams.get('postId');
  const userId = url.searchParams.get('userId');
  
  if (!postId) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  try {
    const numericPostId = parseInt(postId);
    
    // Always fetch comments from Supabase to ensure latest data
    logger.info(`Fetching comments for post ${postId} from Supabase`);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        post_id,
        user_id,
        content,
        created_at,
        parent_comment_id,
        level,
        likes_count,
        username,
        avatar_url
      `)
      .eq('post_id', numericPostId)
      .order('created_at', { ascending: false });
      
    if (error) {
      logger.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ data: [] });
    }
    
    // Process comments without relying on profiles join
    const processedComments = data.map(comment => ({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      username: comment.username || 'User',
      avatar_url: comment.avatar_url || '/placeholder.svg',
      parent_comment_id: comment.parent_comment_id,
      level: comment.level || 0,
      likes_count: comment.likes_count || 0,
      // Default to not liked, we'll check individually below
      liked: false
    }));
    
    // If user ID is provided, check which comments they've liked
    if (userId) {
      // Get all likes for this user
      const { data: likedComments, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', userId);
        
      if (!likesError && likedComments) {
        const likedCommentIds = new Set(likedComments.map(like => like.comment_id));
        
        // Mark comments as liked if appropriate
        processedComments.forEach(comment => {
          comment.liked = likedCommentIds.has(comment.id);
        });
      }
    }
    
    // Transform flat comments into a nested structure
    const commentTree = buildCommentTree(processedComments);
    
    // Update cache with fresh data
    commentsCache[numericPostId] = {
      comments: commentTree,
      lastUpdated: Date.now()
    };
    
    return NextResponse.json({ data: commentTree, flatData: processedComments });
  } catch (error) {
    logger.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for adding a new comment or reply
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.post_id || !body.user_id || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields (post_id, user_id, content)' }, 
        { status: 400 }
      );
    }

    // Calculate level based on parent_comment_id
    let level = 0;
    if (body.parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('level')
        .eq('id', body.parent_comment_id)
        .single();

      if (!parentError && parentComment) {
        // Increment the parent's level
        level = (parentComment.level || 0) + 1;
        // Cap maximum nesting level at 5 for UI purposes
        level = Math.min(level, 5);
      }
    }
    
    // Insert comment into Supabase
    const commentData = {
      ...body,
      level,
      likes_count: 0
    };
    
    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select();
      
    if (error) {
      logger.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
    
    const newComment = data[0];
    const postId = newComment.post_id;
    
    // Force refresh cache from Supabase to ensure consistency
    try {
      const { data: refreshedComments, error: refreshError } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          parent_comment_id,
          level,
          likes_count,
          username,
          avatar_url
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
        
      if (!refreshError && refreshedComments) {
        // Process refreshed comments without relying on profiles join
        const processedComments = refreshedComments.map(comment => ({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          username: comment.username || 'User',
          avatar_url: comment.avatar_url || '/placeholder.svg',
          parent_comment_id: comment.parent_comment_id,
          level: comment.level || 0,
          likes_count: comment.likes_count || 0,
          liked: false
        }));
        
        // Transform flat comments into a nested structure
        const commentTree = buildCommentTree(processedComments);
        
        // Update the cache with completely refreshed data
        commentsCache[postId] = {
          comments: commentTree,
          lastUpdated: Date.now()
        };
        logger.info(`Cache refreshed for post ${postId} after comment addition`);
      }
    } catch (refreshError) {
      logger.error('Error refreshing comment cache:', refreshError);
    }
    
    return NextResponse.json({ data: newComment });
  } catch (error) {
    logger.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT handler for liking/unliking a comment
 */
export async function PUT(request: NextRequest) {
  try {
    const { commentId, userId, action } = await request.json();
    
    if (!commentId || !userId) {
      return NextResponse.json({ error: 'Comment ID and User ID are required' }, { status: 400 });
    }
    
    if (action !== 'like' && action !== 'unlike') {
      return NextResponse.json({ error: 'Action must be "like" or "unlike"' }, { status: 400 });
    }
    
    // Create Supabase client instance
    let supabaseServer;
    
    // Extract tokens from headers
    const authHeader = request.headers.get('Authorization');
    const refreshToken = request.headers.get('X-Refresh-Token') || '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      logger.info('Using access token from Authorization header');
      
      // Create a fresh Supabase client
      supabaseServer = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      
      // Set the auth tokens using the current API
      try {
        const { error: authError } = await supabaseServer.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (authError) {
          logger.error('Error setting session with tokens:', authError);
          // If setting the session with both tokens fails, try just with the access token
          if (authError.message.includes('refresh_token')) {
            logger.info('Trying with access token only');
            const { error: retryError } = await supabaseServer.auth.setSession({
              access_token: accessToken,
              refresh_token: ''
            });
            
            if (retryError) {
              logger.error('Error setting session with access token only:', retryError);
              return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
            }
          } else {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
          }
        }
      } catch (authError) {
        logger.error('Exception setting session:', authError);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
    } else {
      // Fallback to cookie-based auth when header is not available
      logger.info('Falling back to cookie-based auth');
      supabaseServer = createServerSupabaseClient();
    }
    
    // Get the session
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession();
    
    if (sessionError) {
      logger.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    // Verify user is authenticated
    if (!session || !session.user || session.user.id !== userId) {
      logger.error('Authentication error', { 
        hasSession: !!session,
        hasUser: !!session?.user,
        userIdMatch: session?.user?.id === userId,
        requestUserId: userId,
        authHeaderPresent: !!authHeader,
        refreshTokenPresent: !!refreshToken
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Define a type for the result to fix linter error
    interface LikeResult {
      action: string;
      data: any[];
      likes_count?: number;
    }
    
    let result: LikeResult = {
      action: '',
      data: []
    };
    
    if (action === 'like') {
      // Add a like
      const { data, error } = await supabaseServer
        .from('comment_likes')
        .insert([{ comment_id: commentId, user_id: userId }])
        .select();
        
      if (error) {
        // If error is about unique violation, the user already liked the comment
        if (error.code === '23505') {
          return NextResponse.json({ 
            error: 'User already liked this comment',
            already_liked: true
          }, { status: 409 });
        }
        
        logger.error('Error liking comment:', error);
        return NextResponse.json({ error: 'Failed to like comment' }, { status: 500 });
      }
      
      result = { action: 'liked', data: data || [] };
    } else {
      // Remove a like
      const { data, error } = await supabaseServer
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .select();
        
      if (error) {
        logger.error('Error unliking comment:', error);
        return NextResponse.json({ error: 'Failed to unlike comment' }, { status: 500 });
      }
      
      result = { action: 'unliked', data: data || [] };
    }
    
    // Get updated comment with new likes count
    const { data: updatedComment, error: commentError } = await supabaseServer
      .from('comments')
      .select('id, likes_count')
      .eq('id', commentId)
      .single();
      
    if (!commentError && updatedComment) {
      result.likes_count = updatedComment.likes_count;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error processing like/unlike request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 