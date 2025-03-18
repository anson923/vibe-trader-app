import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ThemeToggle } from "@/components/theme-toggle-settings"

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="mx-auto max-w-3xl">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="w-full md:w-auto bg-gray-800">
            <TabsTrigger value="account" className="data-[state=active]:bg-gray-700">
              Account
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-gray-700">
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-gray-700">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-gray-700">
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your account details and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="John Doe" className="bg-gray-700/30 border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="john.doe@example.com" className="bg-gray-700/30 border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" defaultValue="johndoe" className="bg-gray-700/30 border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    defaultValue="Software developer and designer."
                    className="bg-gray-700/30 border-gray-600"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the appearance of the application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme">Theme</Label>
                    <ThemeToggle />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="density">Interface Density</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Compact</span>
                      <Switch id="density" />
                      <span className="text-sm text-muted-foreground">Comfortable</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm">
                      Small
                    </Button>
                    <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                      Medium
                    </Button>
                    <Button variant="outline" size="sm">
                      Large
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Reset</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-updates">Market updates</Label>
                    <Switch id="email-updates" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-comments">Comments</Label>
                    <Switch id="email-comments" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-mentions">Mentions</Label>
                    <Switch id="email-mentions" defaultChecked />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Push Notifications</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-all">All notifications</Label>
                    <Switch id="push-all" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-mentions">Mentions only</Label>
                    <Switch id="push-mentions" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-none">None</Label>
                    <Switch id="push-none" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your security preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" className="bg-gray-700/30 border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" className="bg-gray-700/30 border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" className="bg-gray-700/30 border-gray-600" />
                </div>

                <div className="pt-4 space-y-4">
                  <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="2fa" className="text-base">
                        Enable 2FA
                      </Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch id="2fa" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

