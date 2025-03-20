"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function ProfilePage() {
  // Sample user data
  const user = {
    name: "John Doe",
    email: "john@example.com",
  }

  // Sample company data
  const company = {
    name: "Acme Corporation",
  }

  const hiringEfficiencyData = [
    { name: "Screening", value: 35 },
    { name: "Interview", value: 25 },
    { name: "Assessment", value: 20 },
    { name: "Offer", value: 15 },
    { name: "Onboarding", value: 5 },
  ]

  const timeToHireData = [
    { month: "Jan", days: 32 },
    { month: "Feb", days: 30 },
    { month: "Mar", days: 28 },
    { month: "Apr", days: 26 },
    { month: "May", days: 24 },
    { month: "Jun", days: 22 },
  ]

  const sourceEffectivenessData = [
    { source: "LinkedIn", applications: 120, hires: 8 },
    { source: "Indeed", applications: 85, hires: 5 },
    { source: "Referrals", applications: 45, hires: 12 },
    { source: "Company Site", applications: 65, hires: 6 },
    { source: "Job Fairs", applications: 30, hires: 3 },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/placeholder.svg" alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">HR Manager at {company.name || "Your Company"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Hiring Process Efficiency</CardTitle>
            <CardDescription>Time spent in each hiring stage</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hiringEfficiencyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {hiringEfficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Time to Hire</CardTitle>
            <CardDescription>Average days to fill a position</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer
              config={{
                days: {
                  label: "Days",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeToHireData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="days" stroke="var(--color-days)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Source Effectiveness</CardTitle>
            <CardDescription>Applications vs hires by source</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer
              config={{
                applications: {
                  label: "Applications",
                  color: "hsl(var(--chart-2))",
                },
                hires: {
                  label: "Hires",
                  color: "hsl(var(--chart-3))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceEffectivenessData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="applications" fill="var(--color-applications)" />
                  <Bar dataKey="hires" fill="var(--color-hires)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

