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
      // Save post to Supabase
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            content: content.trim(),
            user_id: user.id,
            username: user.user_metadata?.username || "Anonymous",
            avatar_url: user.user_metadata?.avatar_url || "/placeholder.svg?height=40&width=40"
          }
        ])
        .select()

      if (error) {
        console.error("Error creating post:", error)
        setError("Failed to create post. Please try again.")
        throw error
      }

      // Process stock tickers if present
      const postId = data[0].id
      const tickers = extractStockTickers(content)

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

        // Fetch data for this batch of tickers
        const stocksData = await fetchMultipleStockData(tickerBatch);

        // Save each ticker's data to the database
        for (const ticker of tickerBatch) {
          try {
            if (stocksData[ticker] && !stocksData[ticker].error) {
              const savedData = await saveStockData(postId, stocksData[ticker]);
              results.push({ ticker, savedData });
              console.log(`Successfully processed ticker: ${ticker}`);
            } else {
              errors.push({ ticker, error: "Could not fetch stock data" });
              console.error(`Failed to fetch data for ticker: ${ticker}`);
            }
          } catch (error) {
            errors.push({ ticker, error });
            console.error(`Error saving data for ticker ${ticker}:`, error);
          }
        }

        // Add delay between processing batches to avoid rate limiting
        if (i + batchSize < tickers.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error(`Error in batch processing tickers:`, error);
      errors.push({ error });
    }

    if (errors.length > 0) {
      console.warn(`Completed with ${errors.length} errors:`, errors);
      throw new Error(`Failed to process ${errors.length} tickers`);
    }

    return results;
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

