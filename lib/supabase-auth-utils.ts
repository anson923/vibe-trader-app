import { supabase } from '@/lib/supabase';

/**
 * Get the current authenticated user from the Supabase client
 * @returns The authenticated user or null if not authenticated
 */
export async function getUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
} 