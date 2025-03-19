# Implement a sign up with login option page

This document outlines the changes made to implement user authentication with Supabase.

## Changes Implemented

1. **Supabase Client Setup**
   - Created `lib/supabase.ts` to initialize the Supabase client

2. **Authentication Context**
   - Created `lib/context/auth-context.tsx` for managing authentication state
   - Implemented functions for sign up, sign in, and sign out
   - Added session persistence with local storage

3. **Login/Register Pages**
   - Updated `app/login/page.tsx` to use the auth context
   - Updated `app/register/page.tsx` to use the auth context
   - Added validation and error handling

4. **Navigation Components**
   - Updated `components/left-navigation.tsx` to conditionally show login button or user info
   - Updated `components/mobile-navigation.tsx` to conditionally show login button or user info

5. **Profile Page**
   - Updated `app/profile/page.tsx` to display the current user's information
   - Added redirect to login page if user is not authenticated

6. **Environment Variables**
   - Created `.env.local.example` template for Supabase configuration

## Next Steps

To complete the setup:

1. Create a Supabase project at https://supabase.com
2. Copy your Supabase URL and anon key from the project settings
3. Create a `.env.local` file based on the `.env.local.example` template
4. Make sure to set up email auth in your Supabase project (Auth > Providers > Email)
5. You may want to create a custom user table or add custom fields to the auth.users table in Supabase

## How Authentication Works

1. When a user signs up, their credentials are stored in Supabase Auth
2. On login, a session token is stored in browser storage
3. The auth context listens for auth state changes and updates the UI accordingly
4. Protected routes (like profile page) redirect to login if no user is found
5. The left navigation bar shows user info when logged in, or login button when logged out 