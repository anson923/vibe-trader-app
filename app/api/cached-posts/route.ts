import { NextRequest, NextResponse } from 'next/server';
import { getCachedPosts, updateCachedPost, removeCachedPost, CachedPost, initializeCache } from '@/lib/server-store';
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

    // Check for user likes if userId is provided
    let likedPostIds = new Set<number>();
    if (userId) {
      try {
        const { data: userLikes, error: likesError } = await supabaseAdmin
          .from('likes')
          .select('post_id')
          .eq('user_id', userId);

        if (!likesError && userLikes && userLikes.length > 0) {
          likedPostIds = new Set(userLikes.map(like => like.post_id));
        }
      } catch (likesError) {
        console.error('Error fetching user likes:', likesError);
        // Continue without likes data if there's an error
      }
    }

    // Add liked status to each post if userId is provided
    const postsWithLikes = filteredPosts.map(post => ({
      ...post,
      liked: userId ? likedPostIds.has(post.id) : undefined
    }));

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = postsWithLikes.slice(startIndex, endIndex);

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

// DELETE handler for deleting a post
export async function DELETE(request: NextRequest) {
  try {
    // Ensure cache is initialized
    await initializeCache();
    
    // Get post ID from query parameters
    const url = new URL(request.url);
    const postId = url.searchParams.get('id');
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    const numericPostId = parseInt(postId);
    
    // Delete from Supabase
    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', numericPostId);
      
    if (error) {
      throw error;
    }
    
    // Also remove from the cache
    removeCachedPost(numericPostId);
    
    return NextResponse.json(
      { success: true, message: `Post ${postId} deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
} 