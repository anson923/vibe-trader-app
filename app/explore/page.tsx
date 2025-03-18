import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function ExplorePage() {
  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Explore</h1>
        <div className="relative max-w-md mx-auto md:mx-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search posts, users, or topics..."
            className="pl-10 bg-gray-700/30 border-gray-600"
          />
        </div>
      </div>

      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="mb-4 bg-gray-800">
          <TabsTrigger value="trending" className="data-[state=active]:bg-gray-700">
            Trending
          </TabsTrigger>
          <TabsTrigger value="topics" className="data-[state=active]:bg-gray-700">
            Topics
          </TabsTrigger>
          <TabsTrigger value="people" className="data-[state=active]:bg-gray-700">
            People
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle>Market Trends</CardTitle>
                <CardDescription>Popular discussions this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Tech Stocks</span>
                    <Badge className="bg-gray-700 hover:bg-gray-600">Trending</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Earnings Season</span>
                    <Badge className="bg-gray-700 hover:bg-gray-600">Hot</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Interest Rates</span>
                    <Badge variant="outline" className="border-gray-700">
                      Discussing
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle>Popular Stocks</CardTitle>
                <CardDescription>Most discussed tickers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>$AAPL</span>
                    <Badge className="bg-gray-700 hover:bg-gray-600">324 posts</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>$TSLA</span>
                    <Badge className="bg-gray-700 hover:bg-gray-600">156 posts</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>$NVDA</span>
                    <Badge className="bg-gray-700 hover:bg-gray-600">98 posts</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle>Market News</CardTitle>
                <CardDescription>Latest financial updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Fed Meeting</span>
                    <Badge variant="outline" className="border-gray-700">
                      Breaking
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quarterly Reports</span>
                    <Badge variant="outline" className="border-gray-700">
                      Update
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Market Analysis</span>
                    <Badge variant="outline" className="border-gray-700">
                      New
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topics">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {["Technical Analysis", "Fundamental Analysis", "Options Trading", "Crypto", "ETFs", "Dividends"].map(
              (topic) => (
                <Card key={topic} className="border-gray-800 bg-gray-900">
                  <CardHeader>
                    <CardTitle>{topic}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View Posts
                    </Button>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </TabsContent>

        <TabsContent value="people">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <div className="h-12 w-12 rounded-full bg-gray-700" />
                  <div>
                    <CardTitle className="text-base">Trader Name {i}</CardTitle>
                    <CardDescription>@trader{i}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" className="w-full">
                    Follow
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

