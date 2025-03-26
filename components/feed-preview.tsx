import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { MessageSquare, Heart, BarChart2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function FeedPreview() {
  return (
    <div className="w-full max-w-md space-y-4">
      <Card className="border dark:border-gray-800">
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
        <CardFooter className="flex justify-between p-4 pt-0">
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
        </CardFooter>
      </Card>

      <Card className="border dark:border-gray-800">
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
        <CardFooter className="flex justify-between p-4 pt-0">
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
        </CardFooter>
      </Card>
    </div>
  )
}

