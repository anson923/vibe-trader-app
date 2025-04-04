export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            posts: {
                Row: {
                    id: number
                    user_id: string
                    content: string
                    username: string
                    avatar_url: string
                    created_at: string
                    updated_at: string
                    likes_count: number
                    comments_count: number
                    tickers?: string[]
                }
                Insert: {
                    id?: number
                    user_id: string
                    content: string
                    username?: string
                    avatar_url?: string
                    created_at?: string
                    updated_at?: string
                    likes_count?: number
                    comments_count?: number
                    tickers?: string[]
                }
                Update: {
                    id?: number
                    user_id?: string
                    content?: string
                    username?: string
                    avatar_url?: string
                    created_at?: string
                    updated_at?: string
                    likes_count?: number
                    comments_count?: number
                    tickers?: string[]
                }
            }
            likes: {
                Row: {
                    id: number
                    user_id: string
                    post_id: number
                    created_at?: string
                }
                Insert: {
                    id?: number
                    user_id: string
                    post_id: number
                    created_at?: string
                }
                Update: {
                    id?: number
                    user_id?: string
                    post_id?: number
                    created_at?: string
                }
            }
            comments: {
                Row: {
                    id: number
                    user_id: string
                    post_id: number
                    content: string
                    username: string
                    avatar_url: string
                    created_at: string
                    parent_comment_id?: number
                    level?: number
                    likes_count: number
                }
                Insert: {
                    id?: number
                    user_id: string
                    post_id: number
                    content: string
                    username?: string
                    avatar_url?: string
                    created_at?: string
                    parent_comment_id?: number
                    level?: number
                    likes_count?: number
                }
                Update: {
                    id?: number
                    user_id?: string
                    post_id?: number
                    content?: string
                    username?: string
                    avatar_url?: string
                    created_at?: string
                    parent_comment_id?: number
                    level?: number
                    likes_count?: number
                }
            }
            comment_likes: {
                Row: {
                    id: number
                    user_id: string
                    comment_id: number
                    created_at?: string
                }
                Insert: {
                    id?: number
                    user_id: string
                    comment_id: number
                    created_at?: string
                }
                Update: {
                    id?: number
                    user_id?: string
                    comment_id?: number
                    created_at?: string
                }
            }
            bookmarks: {
                Row: {
                    id: number
                    user_id: string
                    post_id: number
                    created_at?: string
                }
                Insert: {
                    id?: number
                    user_id: string
                    post_id: number
                    created_at?: string
                }
                Update: {
                    id?: number
                    user_id?: string
                    post_id?: number
                    created_at?: string
                }
            }
            stocks: {
                Row: {
                    id: number
                    ticker: string
                    price: number
                    price_change: number
                    price_change_percentage: number
                    created_at?: string
                    updated_at?: string
                }
                Insert: {
                    id?: number
                    ticker: string
                    price: number
                    price_change: number
                    price_change_percentage: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    ticker?: string
                    price?: number
                    price_change?: number
                    price_change_percentage?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            migration_history: {
                Row: {
                    id: number
                    name: string
                    hash: string
                    applied_at?: string
                }
                Insert: {
                    id?: number
                    name: string
                    hash: string
                    applied_at?: string
                }
                Update: {
                    id?: number
                    name?: string
                    hash?: string
                    applied_at?: string
                }
            }
        }
        Functions: {
            like_post: {
                Args: {
                    p_post_id: number
                    p_user_id: string
                }
                Returns: void
            }
            unlike_post: {
                Args: {
                    p_post_id: number
                    p_user_id: string
                }
                Returns: void
            }
            exec_sql: {
                Args: {
                    sql: string
                }
                Returns: void
            }
        }
    }
} 