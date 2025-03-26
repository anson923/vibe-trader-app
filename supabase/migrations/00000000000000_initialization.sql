-- Initial migration file
-- This file ensures the migrations directory is not empty during deployment

-- This migration simply adds a comment to track its execution
COMMENT ON SCHEMA public IS 'Initialization migration applied on: ' || NOW()::text;

-- Function to like a post
CREATE OR REPLACE FUNCTION public.like_post(p_post_id bigint, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_likes_count integer;
BEGIN
    -- First check if the like already exists to prevent duplicates
    IF NOT EXISTS (
        SELECT 1 FROM public.likes 
        WHERE post_id = p_post_id 
        AND user_id = p_user_id
    ) THEN
        -- Insert the like
        INSERT INTO public.likes (post_id, user_id, created_at)
        VALUES (p_post_id, p_user_id, CURRENT_TIMESTAMP);

        -- Get the current count of likes
        SELECT COUNT(*) INTO v_likes_count
        FROM public.likes
        WHERE post_id = p_post_id;

        -- Update the post's likes_count with the actual count
        UPDATE public.posts
        SET likes_count = v_likes_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_post_id;
    END IF;
END;
$$;

-- Function to unlike a post
CREATE OR REPLACE FUNCTION public.unlike_post(p_post_id bigint, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_likes_count integer;
BEGIN
    -- First check if the like exists
    IF EXISTS (
        SELECT 1 FROM public.likes 
        WHERE post_id = p_post_id 
        AND user_id = p_user_id
    ) THEN
        -- Delete the like
        DELETE FROM public.likes
        WHERE post_id = p_post_id
        AND user_id = p_user_id;

        -- Get the current count of likes
        SELECT COUNT(*) INTO v_likes_count
        FROM public.likes
        WHERE post_id = p_post_id;

        -- Update the post's likes_count with the actual count
        UPDATE public.posts
        SET likes_count = v_likes_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_post_id;
    END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.like_post(bigint, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlike_post(bigint, uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.like_post(bigint, uuid) IS 'Adds a like to a post and updates the likes count atomically';
COMMENT ON FUNCTION public.unlike_post(bigint, uuid) IS 'Removes a like from a post and updates the likes count atomically'; 