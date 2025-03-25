'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

type AuthTokens = {
    accessToken: string | null;
    refreshToken: string | null;
}

type AuthContextType = {
    user: User | null
    session: Session | null
    isLoading: boolean
    signUp: (email: string, password: string, username: string) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    getAccessToken: () => Promise<string | null>
    getAuthTokens: () => Promise<AuthTokens>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Check for active session on initial load
        const getSession = async () => {
            setIsLoading(true)
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    throw error
                }

                if (session) {
                    setSession(session)
                    setUser(session.user)
                }
            } catch (error) {
                console.error('Error getting session:', error)
            } finally {
                setIsLoading(false)
            }
        }

        getSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setIsLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const signUp = async (email: string, password: string, username: string) => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                    },
                },
            })

            if (error) {
                throw error
            }

            // Redirect to login after signup
            router.push('/login')
        } catch (error) {
            console.error('Error signing up:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const signIn = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                throw error
            }

            // Redirect to home page after login
            router.push('/')
        } catch (error) {
            console.error('Error signing in:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const signOut = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signOut()

            if (error) {
                throw error
            }

            setUser(null)
            setSession(null)

            // Redirect to home page after logout
            router.push('/')
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            setIsLoading(false)
        }
    }
    
    /**
     * Helper method to get the current access token from session
     * Refreshes the session if needed
     * @deprecated Use getAuthTokens instead for complete token information
     */
    const getAccessToken = async (): Promise<string | null> => {
        try {
            // Check if we have a valid session with an access token
            if (session?.access_token) {
                return session.access_token;
            }
            
            // Otherwise, get the latest session
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Error getting access token:', error);
                return null;
            }
            
            if (data.session) {
                // Update our local session state
                setSession(data.session);
                setUser(data.session.user);
                return data.session.access_token;
            }
            
            return null;
        } catch (error) {
            console.error('Error retrieving access token:', error);
            return null;
        }
    }
    
    /**
     * Helper method to get both the access token and refresh token
     * Returns an object with both tokens or null if not available
     */
    const getAuthTokens = async (): Promise<AuthTokens> => {
        try {
            // Check if we have a valid session with tokens
            if (session?.access_token) {
                return {
                    accessToken: session.access_token,
                    refreshToken: session.refresh_token || null
                };
            }
            
            // Otherwise, get the latest session
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Error getting auth tokens:', error);
                return { accessToken: null, refreshToken: null };
            }
            
            if (data.session) {
                // Update our local session state
                setSession(data.session);
                setUser(data.session.user);
                return {
                    accessToken: data.session.access_token,
                    refreshToken: data.session.refresh_token || null
                };
            }
            
            return { accessToken: null, refreshToken: null };
        } catch (error) {
            console.error('Error retrieving auth tokens:', error);
            return { accessToken: null, refreshToken: null };
        }
    }

    const value = {
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signOut,
        getAccessToken,
        getAuthTokens,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
} 