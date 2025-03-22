"use client"

import React from "react"
import { MoreVertical, Trash } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface DeletePostButtonProps {
  postId: number
  userId: string
  currentUserId: string | undefined
  onSuccess?: () => void
  variant?: "default" | "ghost" | "link" | "destructive" | "outline" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
}

export function DeletePostButton({
  postId,
  userId,
  currentUserId,
  onSuccess,
  variant = "ghost",
  size = "icon"
}: DeletePostButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Only show the delete button if the current user is the post author
  if (currentUserId !== userId) {
    return null
  }

  const handleDeleteClick = async () => {
    setIsDeleting(true)
    
    try {
      // First try to use the cached API to ensure post is removed from cache
      try {
        const response = await fetch(`/api/cached-posts?id=${postId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete post via API: ${response.status}`);
        }
        
        console.log(`Successfully deleted post ${postId} via cached API`);
        
        // Close the dialog
        setDialogOpen(false);
        
        // Fire the success callback or redirect
        if (onSuccess) {
          onSuccess();
        } else {
          // If we're on the post detail page, redirect to the feed
          if (window.location.pathname.includes(`/post/${postId}`)) {
            router.push('/');
          }
        }
        
        return;
      } catch (apiError) {
        console.warn("Failed to delete post via cached API, falling back to direct Supabase:", apiError);
      }
      
      // Fallback to direct Supabase deletion if API fails
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
        
      if (error) {
        throw error;
      }
      
      console.log(`Successfully deleted post ${postId} via direct Supabase`);
      
      // Close the dialog
      setDialogOpen(false);
      
      // Fire the success callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        // If we're on the post detail page, redirect to the feed
        if (window.location.pathname.includes(`/post/${postId}`)) {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Button variant={variant} size={size} className="ml-auto">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500 cursor-pointer"
              onClick={() => setDialogOpen(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
              All comments and likes on this post will also be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 