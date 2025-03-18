import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, MessageSquare, Heart, UserPlus, BarChart2, Bookmark } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Stay updated with your latest activity</p>
      </div>

      <div className="mx-auto max-w-3xl">
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">
              Mark all as read
            </Button>
          </div>

          <TabsContent value="all" className="space-y-4">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader className="p-4">
                <CardTitle className="text-base">Today</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-700">
                  {[
                    {
                      type: "comment",
                      user: "Sarah Smith",
                      avatar: "/placeholder.svg?height=40&width=40",
                      action: "commented on your post",
                      time: "2 hours ago",
                      icon: MessageSquare,
                    },
                    {
                      type: "like",
                      user: "John Doe",
                      avatar: "/placeholder.svg?height=40&width=40",
                      action: "liked your post",
                      time: "3 hours ago",
                      icon: Heart,
                    },
                    {
                      type: "follow",
                      user: "Emily Wilson",
                      avatar: "/placeholder.svg?height=40&width=40",
                      action: "started following you",
                      time: "5 hours ago",
                      icon: UserPlus,
                    },
                    {
                      type: "bookmark",
                      user: "Mark Johnson",
                      avatar: "/placeholder.svg?height=40&width=40",
                      action: "bookmarked your analysis post",
                      time: "6 hours ago",
                      icon: Bookmark,
                    },
                  ].map((notification, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-700/50">
                      <Avatar>
                        <AvatarImage src={notification.avatar} alt={notification.user} />
                        <AvatarFallback>{notification.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p>
                          <span className="font-medium">{notification.user}</span>{" "}
                          <span className="text-muted-foreground">{notification.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                      <notification.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardHeader className="p-4">
                <CardTitle className="text-base">Yesterday</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-700">
                  {[
                    {
                      type: "market",
                      user: "Market Alert",
                      avatar: "/placeholder.svg?height=40&width=40",
                      action: "AAPL reached your price target of $200",
                      time: "1 day ago",
                      icon: BarChart2,
                    },
                    {
                      type: "mention",
                      user: "Mark Johnson",
                      avatar: "/placeholder.svg?height=40&width=40",
                      action: "mentioned you in a comment",
                      time: "1 day ago",
                      icon: Bell,
                    },
                  ].map((notification, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-700/50">
                      <Avatar>
                        <AvatarImage src={notification.avatar} alt={notification.user} />
                        <AvatarFallback>{notification.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p>
                          <span className="font-medium">{notification.user}</span>{" "}
                          <span className="text-muted-foreground">{notification.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                      <notification.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentions" className="space-y-4">
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Mark Johnson" />
                    <AvatarFallback>MJ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p>
                      <span className="font-medium">Mark Johnson</span>{" "}
                      <span className="text-muted-foreground">mentioned you in a comment</span>
                    </p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-700">
                  {[
                    {
                      type: "comment",
                      user: "Sarah Smith",
                      avatar: "/placeholder.svg?height=40&width=40",
                      action: "commented on your post",
                      time: "2 hours ago",
                      icon: MessageSquare,
                    },
                    {
                      type: "like",
                      user: "John Doe",
                      avatar: "/placeholder.svg?height=40&width=40",
                      action: "liked your post",
                      time: "3 hours ago",
                      icon: Heart,
                    },
                    {
                      type: "bookmark",
                      user: "Mark Johnson",
                      avatar: "/placeholder.svg?height=40&width=40",
                      action: "bookmarked your analysis post",
                      time: "6 hours ago",
                      icon: Bookmark,
                    },
                  ].map((notification, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-700/50">
                      <Avatar>
                        <AvatarImage src={notification.avatar} alt={notification.user} />
                        <AvatarFallback>{notification.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p>
                          <span className="font-medium">{notification.user}</span>{" "}
                          <span className="text-muted-foreground">{notification.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                      <notification.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Market Alert" />
                    <AvatarFallback>MA</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p>
                      <span className="font-medium">Market Alert</span>{" "}
                      <span className="text-muted-foreground">AAPL reached your price target of $200</span>
                    </p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

