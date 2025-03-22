import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

/**
 * GET handler for retrieving cached comments
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const postId = url.searchParams.get('postId');
  
  if (!postId) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  try {
    const numericPostId = parseInt(postId);
    
    // FIXED: Always fetch comments from Supabase to ensure latest data
    // This ensures we always have the most up-to-date comments
    console.log(`Fetching comments for post ${postId} from Supabase`);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', numericPostId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
    
    // Update cache with fresh data
    commentsCache[numericPostId] = {
      comments: data || [],
      lastUpdated: Date.now()
    };
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for adding a new comment
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
    
    // Insert comment into Supabase
    const { data, error } = await supabase
      .from('comments')
      .insert([body])
      .select();
      
    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
    
    const newComment = data[0];
    const postId = newComment.post_id;
    
    // FIXED: Force refresh cache from Supabase to ensure consistency
    try {
      const { data: refreshedComments, error: refreshError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
        
      if (!refreshError && refreshedComments) {
        // Update the cache with completely refreshed data
        commentsCache[postId] = {
          comments: refreshedComments,
          lastUpdated: Date.now()
        };
        console.log(`Cache refreshed for post ${postId} after comment addition`);
      }
    } catch (refreshError) {
      console.error('Error refreshing comment cache:', refreshError);
      // If we can't refresh, at least update with what we know
      if (commentsCache[postId]) {
        commentsCache[postId].comments = [newComment, ...commentsCache[postId].comments];
        commentsCache[postId].lastUpdated = Date.now();
      }
    }
    
    return NextResponse.json({ data: newComment });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 