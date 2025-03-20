"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { supabase } from "@/lib/supabase"
import { extractStockTickers, fetchMultipleStockData, saveStockData } from "@/lib/stock-utils"

export default function CreatePostPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingStocks, setProcessingStocks] = useState(false)
  const [currentProcessingTicker, setCurrentProcessingTicker] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      router.push("/login")
      return
    }

    if (!content.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Extract tickers from content first
      const tickers = extractStockTickers(content);
      console.log("Extracted tickers from content:", tickers);

      // Save post to Supabase with tickers array
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            content: content.trim(),
            user_id: user.id,
            username: user.user_metadata?.username || "Anonymous",
            avatar_url: user.user_metadata?.avatar_url || "/placeholder.svg?height=40&width=40",
            tickers: tickers // Set tickers array directly during post creation
          }
        ])
        .select()

      if (error) {
        console.error("Error creating post:", error)
        setError("Failed to create post. Please try again.")
        throw error
      }

      console.log("Post created successfully with tickers:", tickers);

      // Process stock tickers if present
      const postId = data[0].id

      if (tickers.length > 0) {
        setProcessingStocks(true)
        try {
          await processStockTickers(tickers, postId)
          console.log("Successfully processed stock tickers:", tickers)
        } catch (stockError) {
          console.error("Error processing stock tickers:", stockError)
          // Continue anyway since the post was created successfully
        }
      }

      // Redirect to home page after successful post
      router.push("/")
    } catch (error) {
      console.error("Failed to create post:", error)
      setError("Failed to create post. Please try again.")
    } finally {
      setIsSubmitting(false)
      setProcessingStocks(false)
      setCurrentProcessingTicker(null)
    }
  }

  const processStockTickers = async (tickers: string[], postId: number) => {
    if (tickers.length === 0) return [];

    const results = [];
    const errors = [];

    try {
      // Process tickers in batches to improve efficiency while maintaining reliability
      const batchSize = 5; // Process up to 5 tickers at once for better performance

      for (let i = 0; i < tickers.length; i += batchSize) {
        const tickerBatch = tickers.slice(i, i + batchSize);
        setCurrentProcessingTicker(tickerBatch.join(", "));

        console.log(`Processing tickers batch: ${tickerBatch.join(", ")}`);

        try {
          // Fetch data for this batch of tickers
          const stocksData = await fetchMultipleStockData(tickerBatch);

          // Process each ticker individually
          for (const ticker of tickerBatch) {
            try {
              // Check if we got valid data
              if (stocksData && stocksData[ticker] && stocksData[ticker].price) {
                const savedData = await saveStockData(postId, stocksData[ticker]);
                results.push({ ticker, savedData });
                console.log(`Successfully processed ticker: ${ticker}`);
              } else {
                console.warn(`No valid data received for ticker: ${ticker}`);
                // Even if we don't have data, we'll consider this a success
                // The data might have been saved at the API level
                results.push({ ticker, savedData: null, note: "No data received but API may have processed it" });
              }
            } catch (tickerError) {
              console.error(`Error saving data for ticker ${ticker}:`, tickerError);
              // We won't throw an error here, just track it
              errors.push({ ticker, error: tickerError });
            }
          }
        } catch (batchError) {
          console.error(`Error processing batch ${tickerBatch.join(", ")}:`, batchError);
          // Continue processing other batches even if one fails
          for (const ticker of tickerBatch) {
            errors.push({ ticker, error: batchError });
          }
        }

        // Add delay between processing batches to avoid rate limiting
        if (i + batchSize < tickers.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Log any errors but don't throw
      if (errors.length > 0) {
        console.warn(`Completed with ${errors.length} warnings:`, errors);
      }

      return results;
    } catch (error) {
      console.error(`Unexpected error in batch processing tickers:`, error);
      // Only throw for unexpected errors
      throw error;
    }
  }

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Create Post</h1>
        <Card className="border-gray-700 bg-gray-800">
          <form onSubmit={handleSubmit}>
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg?height=40&width=40"} alt="@user" />
                <AvatarFallback>{user?.user_metadata?.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-base">Share your insights</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="What's on your mind about the markets today? Use $TICKER to reference stocks (e.g. $AAPL)"
                  className="min-h-32 bg-gray-700/30 border-gray-600"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between p-4">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                {processingStocks && currentProcessingTicker && (
                  <span className="text-xs text-gray-400">Processing: ${currentProcessingTicker}...</span>
                )}
                <Button type="submit" disabled={isSubmitting || processingStocks}>
                  {isSubmitting ? "Posting..." : processingStocks ? "Processing Stocks..." : "Post"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

