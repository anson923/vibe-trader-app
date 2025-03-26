"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface ChartData {
  date: string;
  price: number;
  volume?: number;
}

interface StockChartProps {
  data: ChartData[];
  onTimeframeChange: (timeframe: string) => void;
  selectedTimeframe: string;
}

export default function StockChart({ data, onTimeframeChange, selectedTimeframe }: StockChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Generate mock data for the last 7 days
    const generateMockData = () => {
      const data = []
      const today = new Date()
      let basePrice = 0

      // Set a base price based on ticker
      switch (selectedTimeframe) {
        case "AAPL":
          basePrice = 180
          break
        case "TSLA":
          basePrice = 175
          break
        case "MSFT":
          basePrice = 415
          break
        case "NVDA":
          basePrice = 950
          break
        case "AMZN":
          basePrice = 178
          break
        case "GOOG":
          basePrice = 147
          break
        case "META":
          basePrice = 485
          break
        default:
          basePrice = 100
      }

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        // Generate a random price fluctuation within +/- 3%
        const fluctuation = (Math.random() * 6 - 3) / 100
        const price = basePrice * (1 + fluctuation)

        // Adjust the base price for the next day
        basePrice = price

        data.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          price: price.toFixed(2),
        })
      }

      return data
    }

    // Simulate API call delay
    setTimeout(() => {
      setChartData(generateMockData())
      setIsLoading(false)
    }, 500)
  }, [selectedTimeframe])

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-pulse h-full w-full bg-gray-700/50 rounded-md"></div>
      </div>
    )
  }

  // Calculate min and max for y-axis domain
  const prices = chartData.map((item) => Number.parseFloat(item.price))
  const minPrice = Math.min(...prices) * 0.995 // 0.5% buffer below min
  const maxPrice = Math.max(...prices) * 1.005 // 0.5% buffer above max

  // Calculate if the stock is up or down
  const isUp = Number.parseFloat(chartData[chartData.length - 1].price) >= Number.parseFloat(chartData[0].price)
  const lineColor = isUp ? "#22c55e" : "#ef4444" // green or red

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" opacity={0.2} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis
          domain={[minPrice, maxPrice]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          formatter={(value) => [`$${value}`, "Price"]}
          contentStyle={{
            backgroundColor: "rgba(31, 41, 55, 0.8)",
            border: "none",
            borderRadius: "0.375rem",
            color: "#f3f4f6",
          }}
        />
        <ReferenceLine y={Number.parseFloat(chartData[0].price)} stroke="#6b7280" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="price" stroke={lineColor} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

