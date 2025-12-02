"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Bell,
  Bold,
  Check,
  ChevronRight,
  Heart,
  Italic,
  Mail,
  MessageSquare,
  Settings,
  Star,
  User,
} from "lucide-react";

// Color swatch component
function ColorSwatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 rounded-md border shadow-sm"
        style={{ backgroundColor: `var(--${cssVar})` }}
      />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="font-mono text-xs text-muted-foreground">--{cssVar}</p>
      </div>
    </div>
  );
}

// Section wrapper
function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function ThemeDemo() {
  return (
    <div className="space-y-12">
      {/* Color Palette */}
      <DemoSection title="Color Palette">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          <ColorSwatch name="Background" cssVar="background" />
          <ColorSwatch name="Foreground" cssVar="foreground" />
          <ColorSwatch name="Primary" cssVar="primary" />
          <ColorSwatch name="Primary FG" cssVar="primary-foreground" />
          <ColorSwatch name="Secondary" cssVar="secondary" />
          <ColorSwatch name="Secondary FG" cssVar="secondary-foreground" />
          <ColorSwatch name="Muted" cssVar="muted" />
          <ColorSwatch name="Muted FG" cssVar="muted-foreground" />
          <ColorSwatch name="Accent" cssVar="accent" />
          <ColorSwatch name="Accent FG" cssVar="accent-foreground" />
          <ColorSwatch name="Destructive" cssVar="destructive" />
          <ColorSwatch name="Border" cssVar="border" />
          <ColorSwatch name="Ring" cssVar="ring" />
          <ColorSwatch name="Card" cssVar="card" />
        </div>
      </DemoSection>

      <Separator />

      {/* Typography */}
      <DemoSection title="Typography">
        <div className="space-y-4">
          <div>
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
              Heading 1
            </h1>
          </div>
          <div>
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
              Heading 2
            </h2>
          </div>
          <div>
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Heading 3
            </h3>
          </div>
          <div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Heading 4
            </h4>
          </div>
          <p className="leading-7">
            This is a paragraph of body text. Theme tokens enable designers and developers
            to create, share, and sell UI themes as blockchain assets.
          </p>
          <p className="text-sm text-muted-foreground">
            This is muted secondary text, often used for descriptions and helper text.
          </p>
          <p className="text-sm font-medium leading-none">Small bold label text</p>
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            Inline code example
          </code>
        </div>
      </DemoSection>

      <Separator />

      {/* Buttons */}
      <DemoSection title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><Settings className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button disabled>Disabled</Button>
          <Button>
            <Mail className="mr-2 h-4 w-4" /> With Icon
          </Button>
        </div>
      </DemoSection>

      <Separator />

      {/* Badges */}
      <DemoSection title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </DemoSection>

      <Separator />

      {/* Alerts */}
      <DemoSection title="Alerts">
        <div className="space-y-3">
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              This is a default alert message for general information.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Something went wrong. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </DemoSection>

      <Separator />

      {/* Cards */}
      <DemoSection title="Cards">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description with muted text.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content goes here. This demonstrates how cards look with your theme.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">User Profile</CardTitle>
                <CardDescription>@username</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span>1.2k</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>89</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span>4.9</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DemoSection>

      <Separator />

      {/* Form Elements */}
      <DemoSection title="Form Elements">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Type your message..." />
            </div>
            <div className="space-y-2">
              <Label>Select Option</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="notifications" />
              <Label htmlFor="notifications">Enable notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
            <div className="space-y-2">
              <Label>Volume</Label>
              <Slider defaultValue={[50]} max={100} step={1} />
            </div>
            <div className="flex gap-2">
              <Toggle aria-label="Bold">
                <Bold className="h-4 w-4" />
              </Toggle>
              <Toggle aria-label="Italic">
                <Italic className="h-4 w-4" />
              </Toggle>
            </div>
          </div>
        </div>
      </DemoSection>

      <Separator />

      {/* Progress & Skeleton */}
      <DemoSection title="Progress & Loading">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Progress (66%)</Label>
            <Progress value={66} />
          </div>
          <div className="space-y-2">
            <Label>Skeleton Loading</Label>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          </div>
        </div>
      </DemoSection>

      <Separator />

      {/* Tabs */}
      <DemoSection title="Tabs">
        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">
              <User className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Make changes to your account settings here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="John Doe" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure your preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch id="dark-mode" />
                  <Label htmlFor="dark-mode">Dark mode</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage notification preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox id="email-notif" defaultChecked />
                  <Label htmlFor="email-notif">Email notifications</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DemoSection>

      <Separator />

      {/* Interactive List */}
      <DemoSection title="Interactive List">
        <Card>
          <CardContent className="p-0">
            {[
              { name: "Account Settings", icon: User },
              { name: "Notifications", icon: Bell },
              { name: "Messages", icon: MessageSquare },
              { name: "Preferences", icon: Settings },
            ].map((item, i) => (
              <button
                key={item.name}
                className={`flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted ${
                  i !== 3 ? "border-b" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      </DemoSection>

      <Separator />

      {/* Status Indicators */}
      <DemoSection title="Status Indicators">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
            </span>
            <span className="text-sm">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
            <span className="text-sm">Away</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-destructive"></span>
            <span className="text-sm">Busy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-muted-foreground"></span>
            <span className="text-sm">Offline</span>
          </div>
        </div>
      </DemoSection>

      <Separator />

      {/* Success State */}
      <DemoSection title="Success State">
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-700 dark:text-green-300">
                Payment Successful
              </h4>
              <p className="text-sm text-green-600/80 dark:text-green-400/80">
                Your transaction has been completed.
              </p>
            </div>
          </CardContent>
        </Card>
      </DemoSection>
    </div>
  );
}
