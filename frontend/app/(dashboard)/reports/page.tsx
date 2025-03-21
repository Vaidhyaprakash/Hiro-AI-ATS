"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, Cell 
} from "recharts"
import { 
  Download, Calendar, Filter, ChevronDown, 
  FileText, Mail, Share2 
} from "lucide-react"
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("last30days")
  
  const hiringData = [
    { month: "Jan", applications: 120, interviews: 45, hires: 12 },
    { month: "Feb", applications: 150, interviews: 60, hires: 15 },
    { month: "Mar", applications: 180, interviews: 75, hires: 18 },
    { month: "Apr", applications: 210, interviews: 85, hires: 22 },
    { month: "May", applications: 240, interviews: 95, hires: 25 },
    { month: "Jun", applications: 270, interviews: 110, hires: 30 },
  ]
  
  const departmentHiringData = [
    { name: "Engineering", value: 35 },
    { name: "Sales", value: 25 },
    { name: "Marketing", value: 15 },
    { name: "Finance", value: 10 },
    { name: "HR", value: 8 },
    { name: "Other", value: 7 },
  ]
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
  
  const timeToHireData = [
    { department: "Engineering", days: 32 },
    { department: "Sales", days: 24 },
    { department: "Marketing", days: 28 },
    { department: "Finance", days: 35 },
    { department: "HR", days: 22 },
  ]
  
  const savedReports = [
    { 
      id: 1, 
      name: "Q2 Hiring Overview", 
      type: "Hiring", 
      created: "2023-06-10", 
      lastRun: "2023-06-18" 
    },
    { 
      id: 2, 
      name: "Engineering Department Metrics", 
      type: "Department", 
      created: "2023-05-15", 
      lastRun: "2023-06-15" 
    },
    { 
      id: 3, 
      name: "Recruitment Source Effectiveness", 
      type: "Source", 
      created: "2023-06-01", 
      lastRun: "2023-06-17" 
    },
    { 
      id: 4, 
      name: "Time-to-Hire Analysis", 
      type: "Efficiency", 
      created: "2023-05-20", 
      lastRun: "2023-06-12" 
    },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-semibold text-[#4b7a3e]">Reports</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1">
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
          <Button className="gap-1">
            <FileText className="h-4 w-4" />
            New Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hiring">Hiring</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
                <SelectItem value="last90days">Last 90 days</SelectItem>
                <SelectItem value="lastYear">Last year</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-1">
              <Filter className="h-4 w-4" />
              Filter
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="mt-0 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,170</div>
                <p className="text-xs text-muted-foreground">+15% from previous period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Interviews Conducted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">470</div>
                <p className="text-xs text-muted-foreground">+8% from previous period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">New Hires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">122</div>
                <p className="text-xs text-muted-foreground">+22% from previous period</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Overview</CardTitle>
                <CardDescription>Applications, interviews, and hires by month</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hiringData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applications" fill="#8884d8" name="Applications" />
                    <Bar dataKey="interviews" fill="#82ca9d" name="Interviews" />
                    <Bar dataKey="hires" fill="#ffc658" name="Hires" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hiring by Department</CardTitle>
                <CardDescription>Distribution of new hires across departments</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentHiringData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {departmentHiringData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hiring" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Hiring Metrics</CardTitle>
              <CardDescription>Comprehensive view of the hiring pipeline</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hiringData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="applications" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="interviews" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="hires" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time to Hire by Department</CardTitle>
              <CardDescription>Average days to fill positions by department</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeToHireData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="department" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="days" fill="#4b7a3e" name="Days to Hire" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{report.type}</TableCell>
                      <TableCell>{formatDate(report.created)}</TableCell>
                      <TableCell>{formatDate(report.lastRun)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" title="Run Report">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Email Report">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 