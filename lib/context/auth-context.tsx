'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

type AuthContextType = {
    user: User | null
    session: Session | null
    isLoading: boolean
    signUp: (email: string, password: string, username: string) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
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

    const value = {
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signOut,
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