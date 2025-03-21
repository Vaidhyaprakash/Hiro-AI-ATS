"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Plus, Search, Filter, MoreHorizontal, Mail, FileText, 
  Calendar, Download, Star, StarHalf, User 
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  
  const candidates = [
    {
      id: 1,
      name: "Michael Thompson",
      email: "michael.thompson@example.com",
      phone: "+1 (555) 123-4567",
      position: "Senior Software Engineer",
      status: "Interview",
      matchScore: 92,
      location: "San Francisco, CA",
      appliedDate: "2023-06-10",
      lastActivity: "2023-06-18",
      tags: ["JavaScript", "React", "Node.js"],
    },
    {
      id: 2,
      name: "Jennifer Garcia",
      email: "jennifer.garcia@example.com",
      phone: "+1 (555) 987-6543",
      position: "Product Manager",
      status: "Assessment",
      matchScore: 88,
      location: "New York, NY",
      appliedDate: "2023-06-12",
      lastActivity: "2023-06-17",
      tags: ["Product", "Agile", "Leadership"],
    },
    {
      id: 3,
      name: "Robert Kim",
      email: "robert.kim@example.com",
      phone: "+1 (555) 456-7890",
      position: "UX Designer",
      status: "Screening",
      matchScore: 85,
      location: "Chicago, IL",
      appliedDate: "2023-06-14",
      lastActivity: "2023-06-16",
      tags: ["UI/UX", "Figma", "User Research"],
    },
    {
      id: 4,
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "+1 (555) 234-5678",
      position: "Marketing Specialist",
      status: "Sourced",
      matchScore: 78,
      location: "Austin, TX",
      appliedDate: "2023-06-15",
      lastActivity: "2023-06-15",
      tags: ["Digital Marketing", "SEO", "Content"],
    },
    {
      id: 5,
      name: "Daniel Martinez",
      email: "daniel.martinez@example.com",
      phone: "+1 (555) 876-5432",
      position: "Data Scientist",
      status: "Hired",
      matchScore: 95,
      location: "Seattle, WA",
      appliedDate: "2023-05-20",
      lastActivity: "2023-06-05",
      tags: ["Python", "Machine Learning", "SQL"],
    },
    {
      id: 6,
      name: "Lisa Wong",
      email: "lisa.wong@example.com",
      phone: "+1 (555) 345-6789",
      position: "Financial Analyst",
      status: "Rejected",
      matchScore: 72,
      location: "Boston, MA",
      appliedDate: "2023-06-01",
      lastActivity: "2023-06-10",
      tags: ["Finance", "Excel", "Analysis"],
    },
  ]

  const filteredCandidates = candidates.filter(candidate => 
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Sourced": return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "Screening": return "bg-purple-100 text-purple-800 hover:bg-purple-100"
      case "Assessment": return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      case "Interview": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "Hired": return "bg-green-100 text-green-800 hover:bg-green-100"
      case "Rejected": return "bg-red-100 text-red-800 hover:bg-red-100"
      default: return ""
    }
  }

  const getMatchScoreIcon = (score: number) => {
    if (score >= 90) return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
    if (score >= 80) return <StarHalf className="h-4 w-4 text-yellow-500 fill-yellow-500" />
    return <Star className="h-4 w-4 text-gray-300" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-semibold text-[#4b7a3e]">Candidates</h1>
        <div className="flex gap-2">
          <Button className="gap-1">
            <Plus className="h-4 w-4" />
            Add Candidate
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="all">All Candidates</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="hired">Hired</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                className="pl-8 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-1">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{candidate.name}</div>
                            <div className="text-sm text-muted-foreground">{candidate.location}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{candidate.position}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {candidate.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMatchScoreIcon(candidate.matchScore)}
                          <div className="w-16">
                            <Progress value={candidate.matchScore} className="h-2" />
                          </div>
                          <span className="text-sm font-medium">{candidate.matchScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={getStatusColor(candidate.status)}
                        >
                          {candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(candidate.appliedDate)}</TableCell>
                      <TableCell>{formatDate(candidate.lastActivity)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>View Profile</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>View Resume</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>Send Email</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Schedule Interview</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active">
          <div className="text-center py-8 text-muted-foreground">
            Filter applied: Active candidates
          </div>
        </TabsContent>
        
        <TabsContent value="hired">
          <div className="text-center py-8 text-muted-foreground">
            Filter applied: Hired candidates
          </div>
        </TabsContent>
        
        <TabsContent value="rejected">
          <div className="text-center py-8 text-muted-foreground">
            Filter applied: Rejected candidates
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 