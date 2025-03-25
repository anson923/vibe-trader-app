import { createClient } from '@supabase/supabase-js'
import type { cookies } from 'next/headers'

// These environment variables need to be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.')
}

// Client-side Supabase client (used in the browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create a server-side supabase client (used in server components and API routes)
export const createServerSupabaseClient = (cookieStore?: ReturnType<typeof cookies>) => {
  // Only import cookies() when this function is called on the server
  let cookieString = ''
  
  if (cookieStore) {
    // If cookies are directly passed (most efficient)
    cookieString = cookieStore.toString()
  } else if (typeof window === 'undefined') {
    // Only import and use cookies() on the server
    // This dynamic import ensures it's only loaded in server context
    try {
      // Use dynamic import to avoid issues with client components
      const { cookies } = require('next/headers')
      cookieString = cookies().toString()
    } catch (e) {
      console.warn('Failed to get cookies from next/headers:', e)
    }
  }
  
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: cookieString ? {
        headers: {
          cookie: cookieString,
        },
      } : undefined,
    }
  )
} 