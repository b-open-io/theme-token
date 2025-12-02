"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Check,
  CreditCard,
  Download,
  Mail,
  MessageSquare,
  Plus,
  Settings,
  User,
  AlertCircle,
  Terminal,
  Activity,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Search,
  ChevronRight,
} from "lucide-react";

// Stats Card Block
function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$45,231.89</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 inline-flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +20.1%
            </span>{" "}
            from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+2,350</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 inline-flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +180.1%
            </span>{" "}
            from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sales</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+12,234</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 inline-flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +19%
            </span>{" "}
            from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+573</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-red-500 inline-flex items-center">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -201
            </span>{" "}
            since last hour
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Recent Activity Table
function RecentActivity() {
  const activities = [
    { id: "INV001", status: "Paid", method: "Credit Card", amount: "$250.00" },
    { id: "INV002", status: "Pending", method: "PayPal", amount: "$150.00" },
    { id: "INV003", status: "Unpaid", method: "Bank Transfer", amount: "$350.00" },
    { id: "INV004", status: "Paid", method: "Credit Card", amount: "$450.00" },
    { id: "INV005", status: "Paid", method: "PayPal", amount: "$550.00" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your recent payment activity</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.id}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      activity.status === "Paid"
                        ? "default"
                        : activity.status === "Pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {activity.status}
                  </Badge>
                </TableCell>
                <TableCell>{activity.method}</TableCell>
                <TableCell className="text-right">{activity.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Form Block
function FormDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" placeholder="John" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" placeholder="Doe" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="john@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" placeholder="Tell us about yourself..." />
        </div>
        <div className="space-y-2">
          <Label>Plan</Label>
          <Select defaultValue="pro">
            <SelectTrigger>
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro - $9/month</SelectItem>
              <SelectItem value="enterprise">Enterprise - $49/month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms" className="text-sm">
            I agree to the terms and conditions
          </Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Create Account</Button>
      </CardFooter>
    </Card>
  );
}

// Notifications Card
function NotificationsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Configure how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive emails about activity</p>
            </div>
          </div>
          <Switch defaultChecked />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Receive push notifications</p>
            </div>
          </div>
          <Switch />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">SMS Notifications</p>
              <p className="text-xs text-muted-foreground">Receive SMS for important alerts</p>
            </div>
          </div>
          <Switch />
        </div>
      </CardContent>
    </Card>
  );
}

// Team Members Card
function TeamMembers() {
  const members = [
    { name: "Sofia Davis", email: "sofia@example.com", role: "Owner" },
    { name: "Jackson Lee", email: "jackson@example.com", role: "Member" },
    { name: "Isabella Nguyen", email: "isabella@example.com", role: "Member" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Invite and manage team members</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map((member, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://avatar.vercel.sh/${member.email}`} />
                <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
            </div>
            <Badge variant={member.role === "Owner" ? "default" : "secondary"}>
              {member.role}
            </Badge>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </CardFooter>
    </Card>
  );
}

// Buttons Showcase
function ButtonsShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buttons</CardTitle>
        <CardDescription>All button variants and sizes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button size="lg">Large</Button>
          <Button size="default">Default</Button>
          <Button size="sm">Small</Button>
          <Button size="icon"><Settings className="h-4 w-4" /></Button>
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button disabled>Disabled</Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            With Icon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Alerts Showcase
function AlertsShowcase() {
  return (
    <div className="space-y-4">
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components to your app using the cli.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Your session has expired. Please log in again.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Progress & Sliders
function ProgressDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress & Controls</CardTitle>
        <CardDescription>Interactive controls preview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Storage Used</span>
            <span className="text-muted-foreground">75%</span>
          </div>
          <Progress value={75} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Volume</span>
            <span className="text-muted-foreground">50%</span>
          </div>
          <Slider defaultValue={[50]} max={100} step={1} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Brightness</span>
            <span className="text-muted-foreground">80%</span>
          </div>
          <Slider defaultValue={[80]} max={100} step={1} />
        </div>
      </CardContent>
    </Card>
  );
}

// Tabs Demo
function TabsDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="account">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@johndoe" />
            </div>
          </TabsContent>
          <TabsContent value="password" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input id="new" type="password" />
            </div>
          </TabsContent>
          <TabsContent value="settings" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing">Marketing emails</Label>
              <Switch id="marketing" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="social">Social notifications</Label>
              <Switch id="social" defaultChecked />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Color Palette Display
function ColorPalette() {
  const colors = [
    { name: "Background", var: "bg-background", text: "text-foreground" },
    { name: "Card", var: "bg-card", text: "text-card-foreground" },
    { name: "Primary", var: "bg-primary", text: "text-primary-foreground" },
    { name: "Secondary", var: "bg-secondary", text: "text-secondary-foreground" },
    { name: "Muted", var: "bg-muted", text: "text-muted-foreground" },
    { name: "Accent", var: "bg-accent", text: "text-accent-foreground" },
    { name: "Destructive", var: "bg-destructive", text: "text-destructive-foreground" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Palette</CardTitle>
        <CardDescription>Your theme colors at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {colors.map((color) => (
            <div key={color.name} className="text-center">
              <div
                className={`${color.var} ${color.text} mb-2 flex h-16 items-center justify-center rounded-lg border text-xs font-medium`}
              >
                {color.name}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Preview Panel
export function ThemePreviewPanel() {
  return (
    <div className="min-h-full w-full p-6">
      <div className="space-y-6">
        {/* Color Palette */}
        <ColorPalette />

        {/* Stats */}
        <StatsCards />

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          <FormDemo />
          <div className="space-y-6">
            <NotificationsCard />
            <TeamMembers />
          </div>
        </div>

        {/* Buttons & Alerts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ButtonsShowcase />
          <div className="space-y-6">
            <AlertsShowcase />
            <ProgressDemo />
          </div>
        </div>

        {/* Table */}
        <RecentActivity />

        {/* Tabs */}
        <TabsDemo />
      </div>
    </div>
  );
}
