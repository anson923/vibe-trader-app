import { NextRequest, NextResponse } from 'next/server';
import { getCachedPosts, updateCachedPost, CachedPost, initializeCache } from '@/lib/server-store';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// GET handler for retrieving cached posts
export async function GET(request: NextRequest) {
  try {
    // Ensure cache is initialized
    await initializeCache();
    
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const userId = url.searchParams.get('userId');

    // Get posts from cache
    const posts = getCachedPosts();

    // Apply filters if needed
    let filteredPosts = posts;
    if (userId) {
      filteredPosts = posts.filter(post => post.user_id === userId);
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // Return response
    return NextResponse.json({
      data: paginatedPosts,
      pagination: {
        page,
        limit,
        total: filteredPosts.length,
        totalPages: Math.ceil(filteredPosts.length / limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving cached posts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve posts' },
      { status: 500 }
    );
  }
}

// POST handler for creating a new post
export async function POST(request: NextRequest) {
  try {
    // Ensure cache is initialized
    await initializeCache();
    
    const postData = await request.json();

    // Validate request data
    if (!postData.content || !postData.user_id || !postData.username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add post to database
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert([postData])
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create post');
    }

    const newPost = data[0] as CachedPost;

    // Also update the cache
    updateCachedPost(newPost);

    return NextResponse.json({ data: newPost }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 