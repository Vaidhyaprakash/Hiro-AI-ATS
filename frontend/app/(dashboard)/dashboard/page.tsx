"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

// Define types for our API responses
interface DashboardStats {
  total_jobs: number
  open_positions: number
  total_applications: number
  application_growth: number
  time_to_hire_days: number
  time_to_hire_change: number
  conversion_rate: number
  conversion_rate_change: number
}

interface HiringData {
  month: string
  applications: number
  hires: number
}

interface DepartmentData {
  department: string
  openings: number
  applications: number
}

// Default data to use while loading or if API fails
const defaultStats: DashboardStats = {
  total_jobs: 6,
  open_positions: 5,
  total_applications: 353,
  application_growth: 12.0,
  time_to_hire_days: 24,
  time_to_hire_change: -3,
  conversion_rate: 12.5,
  conversion_rate_change: 2.1
}

const defaultHiringData: HiringData[] = [
  { month: "Jan", applications: 45, hires: 5 },
  { month: "Feb", applications: 52, hires: 7 },
  { month: "Mar", applications: 61, hires: 8 },
  { month: "Apr", applications: 67, hires: 6 },
  { month: "May", applications: 70, hires: 9 },
  { month: "Jun", applications: 58, hires: 7 },
]

const defaultDepartmentData: DepartmentData[] = [
  { department: "Engineering", openings: 4, applications: 120 },
  { department: "Marketing", openings: 2, applications: 85 },
  { department: "Sales", openings: 3, applications: 95 },
  { department: "HR", openings: 1, applications: 40 },
  { department: "Finance", openings: 1, applications: 35 },
]

export default function DashboardPage() {
  // State for our data with default values
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [hiringData, setHiringData] = useState<HiringData[]>(defaultHiringData)
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>(defaultDepartmentData)
  const [loading, setLoading] = useState(true)
  const [dataFetched, setDataFetched] = useState(false)

  // Fetch data from our API only once
  useEffect(() => {
    // Only fetch if we haven't already
    if (dataFetched) return
    
    const fetchDashboardData = async () => {
      setLoading(true)
      
      try {
        console.log("Fetching dashboard data...")
        
        // Fetch stats data
        const statsResponse = await fetch('/api/dashboard/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          console.log("Stats data:", statsData)
          setStats(statsData)
        } else {
          console.error("Failed to fetch stats:", statsResponse.status)
        }

        // Fetch hiring data
        const hiringResponse = await fetch('/api/dashboard/hiring-data')
        if (hiringResponse.ok) {
          const hiringData = await hiringResponse.json()
          console.log("Hiring data:", hiringData)
          setHiringData(hiringData)
        } else {
          console.error("Failed to fetch hiring data:", hiringResponse.status)
        }

        // Fetch department data
        const departmentResponse = await fetch('/api/dashboard/department-data')
        if (departmentResponse.ok) {
          const departmentData = await departmentResponse.json()
          console.log("Department data:", departmentData)
          setDepartmentData(departmentData)
        } else {
          console.error("Failed to fetch department data:", departmentResponse.status)
        }
        
        setDataFetched(true)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [dataFetched])

  // Loading skeleton for cards
  const CardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[60px] mb-2" />
        <Skeleton className="h-4 w-[120px]" />
      </CardContent>
    </Card>
  )

  // Loading skeleton for charts
  const ChartSkeleton = () => (
    <Card className="col-span-1">
      <CardHeader>
        <Skeleton className="h-6 w-[150px] mb-2" />
        <Skeleton className="h-4 w-[250px]" />
      </CardHeader>
      <CardContent className="h-80 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  )

  console.log("Rendering dashboard with data:", { stats, hiringData, departmentData, loading })

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_jobs}</div>
                <p className="text-xs text-muted-foreground">{stats.open_positions} open positions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_applications}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.application_growth > 0 ? '+' : ''}{stats.application_growth}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time to Hire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.time_to_hire_days} days</div>
                <p className="text-xs text-muted-foreground">
                  {stats.time_to_hire_change < 0 ? '' : '+'}{stats.time_to_hire_change} days from last quarter
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversion_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.conversion_rate_change > 0 ? '+' : ''}{stats.conversion_rate_change}% from last month
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Applications vs Hires</CardTitle>
                <CardDescription>Monthly comparison of applications received and candidates hired</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {hiringData.length > 0 ? (
                  <ChartContainer
                    config={{
                      applications: {
                        label: "Applications",
                        color: "hsl(var(--chart-1))",
                      },
                      hires: {
                        label: "Hires",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hiringData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="applications" stroke="var(--color-applications)" strokeWidth={2} />
                        <Line type="monotone" dataKey="hires" stroke="var(--color-hires)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No hiring data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Department Breakdown</CardTitle>
                <CardDescription>Open positions and applications by department</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {departmentData.length > 0 ? (
                  <ChartContainer
                    config={{
                      openings: {
                        label: "Open Positions",
                        color: "hsl(var(--chart-3))",
                      },
                      applications: {
                        label: "Applications",
                        color: "hsl(var(--chart-4))",
                      },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" />
                        <YAxis yAxisId="left" orientation="left" stroke="var(--color-openings)" />
                        <YAxis yAxisId="right" orientation="right" stroke="var(--color-applications)" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="openings" fill="var(--color-openings)" name="Open Positions" />
                        <Bar yAxisId="right" dataKey="applications" fill="var(--color-applications)" name="Applications" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No department data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

