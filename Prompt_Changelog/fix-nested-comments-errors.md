# Fix this error after add a comment

This document addresses the errors encountered when adding comments after implementing the nested comments and comment likes feature.

## Issues Fixed

1. **PostgreSQL Relationship Error**

   - Error: `Could not find a relationship between 'comments' and 'user_id' in the schema cache`
   - Fix: Modified the Supabase queries to avoid using the profiles join that was causing the error by directly selecting the needed fields from the comments table.

2. **Row-Level Security Policy Violation**
   - Error: `new row violates row-level security policy for table "comments"`
   - Fix: Updated the RLS policy for comments to use `WITH CHECK` syntax for INSERT operations, which is required for proper access control.

## Changes Made

### 1. API Endpoint Updates

- Modified `cached-comments/route.ts` to:
  - Remove the problematic profiles join in the `select()` query
  - Directly access fields from the comments table
  - Process comments without relying on nested profile data

### 2. Database Policy Updates

- Added a proper Row Level Security policy for comments:
  ```sql
  DROP POLICY IF EXISTS "Allow authenticated users to insert their own comments" ON comments;
  CREATE POLICY "Allow authenticated users to insert their own comments" ON comments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  ```

### 3. Frontend Changes

- Updated the `fetchComments` function in `app/post/[id]/page.tsx` to work with the direct comment data structure without nested profiles.

## How to Apply These Fixes

1. Run the updated SQL migration in your Supabase SQL editor
2. Deploy the updated API endpoint and page component

## Technical Details

The main issue was twofold:

1. The RLS policy for comments was using the wrong syntax. For INSERT operations, PostgreSQL requires `WITH CHECK` instead of `USING` in the policy definition.

2. The profiles join was incorrectly specified in the Supabase queries. Instead of trying to join with profiles, we now directly access the fields we need from the comments table itself.

These changes ensure that:

- Users can properly add comments
- Comments display correctly with proper nesting
- The comment likes system works as expected

## Next Steps

After applying these fixes, test the feature again by:

1. Adding comments to posts
2. Replying to comments to test the nesting
3. Liking comments
4. Verifying that all UI elements display correctly
