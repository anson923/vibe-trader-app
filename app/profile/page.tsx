import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Heart, BarChart2, Share2, TrendingUp } from "lucide-react"

export default function ProfilePage() {
  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-8">
        <div className="h-48 rounded-lg bg-gradient-to-r from-gray-800 to-gray-700"></div>
        <div className="relative px-4">
          <Avatar className="absolute -top-16 h-32 w-32 border-4 border-background">
            <AvatarImage src="/placeholder.svg?height=128&width=128" alt="@johndoe" />
            <AvatarFallback className="text-4xl bg-gray-700">JD</AvatarFallback>
          </Avatar>
          <div className="ml-32 flex items-end justify-between pb-4 pt-4">
            <div>
              <h1 className="text-2xl font-bold">John Doe</h1>
              <p className="text-gray-400">@johndoe</p>
            </div>
            <Button>Edit Profile</Button>
          </div>
          <div className="mt-4">
            <p className="mb-4">
              Stock market enthusiast and tech investor. Sharing insights and analysis on market trends and
              opportunities.
            </p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-bold">245</span> Following
              </div>
              <div>
                <span className="font-bold">1.2k</span> Followers
              </div>
              <div>
                <span className="font-bold">568</span> Posts
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="mb-4 bg-gray-800">
          <TabsTrigger value="posts" className="data-[state=active]:bg-gray-700">
            Posts
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="data-[state=active]:bg-gray-700">
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-gray-700">
            Performance
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="space-y-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@johndoe" />
                <AvatarFallback className="bg-gray-700">JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-gray-400">@johndoe • 2h ago</p>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="mb-3">
                Just analyzed{" "}
                <Badge variant="outline" className="border-gray-700 bg-gray-800">
                  $AAPL
                </Badge>{" "}
                earnings report. Strong growth in services, but hardware sales slightly below expectations. Still
                bullish long-term.
                <span className="text-primary">#earnings #tech</span>
              </p>
              <div className="rounded-lg overflow-hidden bg-gray-800">
                <div className="h-40 bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center">
                  <BarChart2 className="h-20 w-20 text-gray-400" />
                </div>
              </div>
            </CardContent>
            <CardContent className="flex justify-between p-4 pt-0">
              <Button variant="ghost" size="sm" className="gap-1">
                <Heart className="h-4 w-4" />
                <span>24</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>5</span>
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@johndoe" />
                <AvatarFallback className="bg-gray-700">JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-gray-400">@johndoe • 1d ago</p>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p>
                Looking at{" "}
                <Badge variant="outline" className="border-gray-700 bg-gray-800">
                  $NVDA
                </Badge>{" "}
                technical analysis. The stock has formed a strong support level at $450. If it breaks through $500, we
                could see a run to new all-time highs.
                <span className="text-primary">#technicalanalysis #stocks</span>
              </p>
            </CardContent>
            <CardContent className="flex justify-between p-4 pt-0">
              <Button variant="ghost" size="sm" className="gap-1">
                <Heart className="h-4 w-4" />
                <span>36</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>8</span>
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="watchlist">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">My Watchlist</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border border-gray-700 rounded-lg bg-gray-700/50">
                  <div>
                    <div className="font-medium">Apple Inc.</div>
                    <div className="text-sm text-gray-400">$AAPL</div>
                  </div>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>2.4%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border border-gray-700 rounded-lg bg-gray-700/50">
                  <div>
                    <div className="font-medium">Tesla Inc.</div>
                    <div className="text-sm text-gray-400">$TSLA</div>
                  </div>
                  <div className="flex items-center text-red-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>-1.2%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border border-gray-700 rounded-lg bg-gray-700/50">
                  <div>
                    <div className="font-medium">Microsoft Corp.</div>
                    <div className="text-sm text-gray-400">$MSFT</div>
                  </div>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>1.8%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Portfolio Performance</h3>
              <div className="h-64 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg flex items-center justify-center mb-4">
                <BarChart2 className="h-32 w-32 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-gray-800 rounded-lg bg-gray-800/50">
                  <div className="text-sm text-gray-400">Total Return</div>
                  <div className="text-2xl font-bold text-green-500">+24.8%</div>
                </div>
                <div className="p-4 border border-gray-800 rounded-lg bg-gray-800/50">
                  <div className="text-sm text-gray-400">YTD Return</div>
                  <div className="text-2xl font-bold text-green-500">+12.3%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

