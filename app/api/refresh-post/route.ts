import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCachedPosts, updateCachedPost, initializeCache } from '@/lib/server-store';

export async function GET(request: NextRequest) {
  try {
    // Ensure cache is initialized
    await initializeCache();
    
    // Get post ID from query parameters
    const url = new URL(request.url);
    const postId = parseInt(url.searchParams.get('id') || '0');
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the updated post from database
    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Update the post in the cache using the existing function
    updateCachedPost(post);
    
    return NextResponse.json({
      success: true,
      message: 'Post refreshed in cache',
      data: post
    });
  } catch (error) {
    console.error('Error refreshing post:', error);
    return NextResponse.json(
      { error: 'Failed to refresh post' },
      { status: 500 }
    );
  }
} 