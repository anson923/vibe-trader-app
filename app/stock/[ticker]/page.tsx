"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp } from "lucide-react"
import Link from "next/link"
import PostCard from "@/components/post-card"
import StockChart from "@/components/stock-chart"

interface StockPageProps {
  params: {
    ticker: string
  }
}

// Component that receives the unwrapped ticker
function StockPageContent({ ticker }: { ticker: string }) {
  const stockInfo = stocksDatabase[ticker.toUpperCase()]

  if (!stockInfo) {
    return (
      <div className="container px-4 py-6 md:px-6">
        <div className="mb-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Feed</span>
          </Link>
        </div>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Stock Not Found</h1>
          <p className="text-muted-foreground">The stock ticker {ticker.toUpperCase()} could not be found.</p>
        </div>
      </div>
    )
  }

  // Sample posts related to this stock
  const relatedPosts = [
    {
      id: 1,
      user: {
        name: "John Doe",
        username: "johndoe",
        avatar: "/placeholder.svg?height=40&width=40",
        profit: 24.8,
      },
      content: `Just analyzed $${ticker.toUpperCase()} earnings report. Strong growth in services, but hardware sales slightly below expectations. Still bullish long-term.`,
      tickers: [ticker.toUpperCase()],
      stocksInfo: [{ ...stockInfo }],
      hashtags: ["earnings", "tech"],
      image: "chart",
      time: "2h ago",
      stats: {
        likes: 24,
        comments: 5,
        reposts: 3,
      },
    },
    {
      id: 2,
      user: {
        name: "Sarah Smith",
        username: "sarahsmith",
        avatar: "/placeholder.svg?height=40&width=40",
        profit: 12.3,
      },
      content: `My portfolio is up 12% this quarter! Key winners: $${ticker.toUpperCase()} and others. What are your best performers?`,
      tickers: [ticker.toUpperCase()],
      stocksInfo: [{ ...stockInfo }],
      hashtags: ["investing", "stocks"],
      time: "5h ago",
      stats: {
        likes: 42,
        comments: 12,
        reposts: 7,
      },
    },
  ]

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-4">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <Card className="mb-6 border-gray-700 bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">${stockInfo.ticker}</CardTitle>
                  <span className="text-lg font-medium">{stockInfo.name}</span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-2xl font-bold mr-2">${stockInfo.price}</span>
                  <span className={`flex items-center ${stockInfo.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {stockInfo.change >= 0 ? (
                      <span className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />+{stockInfo.change}%
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
                        {stockInfo.change}%
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <Badge variant={stockInfo.change >= 0 ? "default" : "destructive"} className="text-md px-3 py-1">
                {stockInfo.change >= 0 ? "↑" : "↓"} Today
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full mb-4">
                <StockChart ticker={stockInfo.ticker} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">{stockInfo.description}</p>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold mb-4">Posts Mentioning ${stockInfo.ticker}</h2>
          <div className="space-y-4">
            {relatedPosts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="sticky top-6 space-y-4">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle>Key Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-medium">${stockInfo.marketCap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/E Ratio</span>
                  <span className="font-medium">{stockInfo.peRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dividend Yield</span>
                  <span className="font-medium">{stockInfo.dividend}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">{stockInfo.volume}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Volume</span>
                  <span className="font-medium">{stockInfo.avgVolume}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">52-Week High</span>
                  <span className="font-medium">${stockInfo.high52}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">52-Week Low</span>
                  <span className="font-medium">${stockInfo.low52}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related Stocks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.values(stocksDatabase)
                  .filter((stock: any) => stock.ticker !== stockInfo.ticker)
                  .slice(0, 4)
                  .map((stock: any) => (
                    <div
                      key={stock.ticker}
                      onClick={() => (window.location.href = `/stock/${stock.ticker}`)}
                      className="flex items-center justify-between hover:bg-gray-700/50 p-2 rounded-md transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">${stock.ticker}</Badge>
                        <span className="text-sm">{stock.name}</span>
                      </div>
                      <span className={`text-sm ${stock.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {stock.change >= 0 ? "+" : ""}
                        {stock.change}%
                      </span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sample stock data
const stocksDatabase: Record<string, any> = {
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    change: 2.4,
    price: 182.63,
    marketCap: "2.87T",
    peRatio: 28.4,
    dividend: 0.58,
    volume: "62.3M",
    avgVolume: "58.1M",
    high52: 198.23,
    low52: 143.9,
    description:
      "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables, home, and accessories comprising AirPods, Apple TV, Apple Watch, Beats products, and HomePod.",
  },
  TSLA: {
    ticker: "TSLA",
    name: "Tesla Inc.",
    change: -1.2,
    price: 175.34,
    marketCap: "558.2B",
    peRatio: 50.7,
    dividend: 0,
    volume: "92.1M",
    avgVolume: "103.5M",
    high52: 278.98,
    low52: 152.37,
    description:
      "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally. The company operates in two segments, Automotive, and Energy Generation and Storage.",
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corp.",
    change: 1.8,
    price: 417.88,
    marketCap: "3.11T",
    peRatio: 36.2,
    dividend: 0.75,
    volume: "21.5M",
    avgVolume: "24.3M",
    high52: 430.82,
    low52: 309.98,
    description:
      "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates in three segments: Productivity and Business Processes, Intelligent Cloud, and More Personal Computing.",
  },
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corp.",
    change: 3.5,
    price: 950.02,
    marketCap: "2.34T",
    peRatio: 79.8,
    dividend: 0.04,
    volume: "41.2M",
    avgVolume: "45.8M",
    high52: 974.0,
    low52: 222.97,
    description:
      "NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally. The company's Graphics segment offers GeForce GPUs for gaming and PCs, the GeForce NOW game streaming service and related infrastructure, and solutions for gaming platforms.",
  },
  AMZN: {
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    change: 0.9,
    price: 178.75,
    marketCap: "1.86T",
    peRatio: 61.2,
    dividend: 0,
    volume: "32.7M",
    avgVolume: "38.5M",
    high52: 185.1,
    low52: 118.35,
    description:
      "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through online and physical stores in North America and internationally. It operates through three segments: North America, International, and Amazon Web Services (AWS).",
  },
  GOOG: {
    ticker: "GOOG",
    name: "Alphabet Inc.",
    change: 1.3,
    price: 147.6,
    marketCap: "1.83T",
    peRatio: 25.1,
    dividend: 0,
    volume: "18.9M",
    avgVolume: "20.7M",
    high52: 155.2,
    low52: 104.42,
    description:
      "Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America. It operates through Google Services, Google Cloud, and Other Bets segments.",
  },
  META: {
    ticker: "META",
    name: "Meta Platforms Inc.",
    change: -0.7,
    price: 485.58,
    marketCap: "1.24T",
    peRatio: 28.3,
    dividend: 0,
    volume: "15.3M",
    avgVolume: "16.8M",
    high52: 531.49,
    low52: 274.38,
    description:
      "Meta Platforms, Inc. engages in the development of products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide. It operates in two segments, Family of Apps and Reality Labs.",
  },
}

// The main component that properly unwraps params using React.use()
export default function StockPage({ params }: StockPageProps) {
  // Explicitly use React.use to unwrap params before accessing its properties
  // This follows Next.js latest recommendations
  const unwrappedParams = React.use(params as any) as { ticker: string };
  return <StockPageContent ticker={unwrappedParams.ticker} />;
}

