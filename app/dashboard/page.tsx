import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Heart, BarChart2, Share2, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center">
        <h1 className="text-2xl font-bold">Your Feed</h1>
        <Link href="/create-post" className="ml-auto md:hidden">
          <Button size="sm">Create Post</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <Tabs defaultValue="following" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="following">Following</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="latest">Latest</TabsTrigger>
            </TabsList>
            <TabsContent value="following" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <Avatar>
                    <AvatarImage src="/user_icon.svg" alt="@johndoe" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@johndoe • 2h ago</p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="mb-3">
                    Just analyzed <Badge variant="outline">$AAPL</Badge> earnings report. Strong growth in services, but
                    hardware sales slightly below expectations. Still bullish long-term.
                    <span className="text-primary">#earnings #tech</span>
                  </p>
                  <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div className="h-40 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center">
                      <BarChart2 className="h-20 w-20 text-blue-500 dark:text-blue-400" />
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

              <Card>
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <Avatar>
                    <AvatarImage src="/user_icon.svg" alt="@sarahsmith" />
                    <AvatarFallback>SS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Sarah Smith</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@sarahsmith • 5h ago</p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p>
                    My portfolio is up 12% this quarter! Key winners: <Badge variant="outline">$TSLA</Badge>{" "}
                    <Badge variant="outline">$NVDA</Badge> <Badge variant="outline">$MSFT</Badge>. What are your best
                    performers? <span className="text-primary">#investing #stocks</span>
                  </p>
                </CardContent>
                <CardContent className="flex justify-between p-4 pt-0">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Heart className="h-4 w-4" />
                    <span>42</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>12</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="trending" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trending content will appear here</CardTitle>
                  <CardDescription>Popular posts from across the platform</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
            <TabsContent value="latest" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Latest content will appear here</CardTitle>
                  <CardDescription>Most recent posts from across the platform</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden md:block">
          <div className="sticky top-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">$AAPL</Badge>
                    <span>Apple Inc.</span>
                  </div>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>2.4%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">$TSLA</Badge>
                    <span>Tesla Inc.</span>
                  </div>
                  <div className="flex items-center text-red-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>-1.2%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">$MSFT</Badge>
                    <span>Microsoft Corp.</span>
                  </div>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>1.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trending Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-primary">#earnings</div>
                  <div className="text-primary">#tech</div>
                  <div className="text-primary">#investing</div>
                  <div className="text-primary">#stocks</div>
                  <div className="text-primary">#markettrends</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Who to Follow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src="/user_icon.svg" alt="@markjohnson" />
                      <AvatarFallback>MJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Mark Johnson</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@markjohnson</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Follow
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src="/user_icon.svg" alt="@emilywilson" />
                      <AvatarFallback>EW</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Emily Wilson</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@emilywilson</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Follow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

