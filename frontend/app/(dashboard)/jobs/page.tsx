"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "../../../lib/redux/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, ChevronDown, Edit, Trash, Copy } from "lucide-react"
import { JobFormModal } from "./job-form-modal"
import { setJobs } from "../../../lib/redux/slices/jobsSlice"

// Sample jobs data for development
const sampleJobs = [
  {
    id: "1",
    title: "Financial Analyst",
    department: "Finance",
    location: "Salt Lake City, UT",
    employmentType: "Full-time",
    experience: "3-5 years",
    compensation: "$80,000 - $100,000",
    description: "We are looking for a Financial Analyst to join our team.",
    hiringLead: "Preston Wilder",
    created_at: "2025-03-20T08:44:08.046138+00:00",
    status: "Open" as "Open" | "Draft",
    candidates: 1,
  },
  {
    id: "2",
    title: "Marketing Manager",
    department: "Marketing",
    location: "Vancouver, British Columbia",
    employmentType: "Full-time",
    experience: "5+ years",
    compensation: "$90,000 - $110,000",
    description: "We are looking for a Marketing Manager to lead our marketing efforts.",
    hiringLead: "Daniel Vance",
    created_at: "2025-03-20T08:44:08.046138+00:00",
    status: "Open" as "Open" | "Draft",
    candidates: 2,
  },
  {
    id: "3",
    title: "Software Engineer",
    department: "Product",
    location: "Sydney, New South Wales",
    employmentType: "Full-time",
    experience: "2-4 years",
    compensation: "$100,000 - $130,000",
    description: "We are looking for a Software Engineer to join our development team.",
    hiringLead: "Maja Andev",
    created_at: "2025-03-20T08:44:08.046138+00:00",
    status: "Open" as "Open" | "Draft",
    candidates: 4,
  },
  {
    id: "4",
    title: "General Application",
    department: "Human Resources",
    location: "Lindon, UT",
    employmentType: "Full-time",
    experience: "1-3 years",
    compensation: "Competitive",
    description: "General application for future opportunities.",
    hiringLead: "Sruthi Kannan",
    created_at: "2025-03-20T08:44:08.046138+00:00",
    status: "Open" as "Open" | "Draft",
    candidates: 6,
  },
  {
    id: "5",
    title: "Videographer",
    department: "Marketing",
    location: "Lindon, UT",
    employmentType: "Contract",
    experience: "2+ years",
    compensation: "$30-$45/hour",
    description: "We are looking for a Videographer to create content for our marketing team.",
    hiringLead: "Trent Walsh",
    created_at: "2025-03-20T08:44:08.046138+00:00",
    status: "Draft" as "Open" | "Draft",
    candidates: 0,
  },
  {
    id: "6",
    title: "IT Security Engineer",
    department: "IT",
    location: "Mayfaird, London, City of",
    employmentType: "Full-time",
    experience: "3-5 years",
    compensation: "£70,000 - £90,000",
    description: "We are looking for an IT Security Engineer to help secure our systems.",
    hiringLead: "Eric Asture",
    created_at: "2025-03-20T08:44:08.046138+00:00",
    status: "Open" as "Open" | "Draft",
    candidates: 4,
  },
]

export default function JobsPage() {
  const dispatch = useDispatch()
  const jobs = useSelector((state: RootState) => state.jobs.jobs)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  console.log(jobs);
  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + 
      (now.getMonth() - date.getMonth());
    
    if (monthsDiff === 1) return "1 month ago";
    if (monthsDiff > 1) return `${monthsDiff} months ago`;
    return "Recently";
  }

  const filteredJobs = jobs.filter((job) => {
    if (filterStatus === "all") return true
    if (filterStatus === "open") return job.status === "Open"
    if (filterStatus === "draft") return job.status === "Draft"
    return true
  })

  const handleNewJob = () => {
    setIsNewJobModalOpen(true)
  }

  const fetchJobs = async () => {
    try {
      // Check if the API URL is defined
      if (!process.env.NEXT_PUBLIC_API_URL) {
        console.warn("API URL is not defined, using sample data instead");
        dispatch(setJobs(sampleJobs));
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/1/jobs`);
      
      if (!response.ok) {
        dispatch(setJobs([]));
        return;
      }
      
      const data = await response.json();
      dispatch(setJobs(data));
    } catch (error) {
      console.error("Error fetching jobs:", error);
      // Fallback to sample data when fetch fails
      dispatch(setJobs(sampleJobs));
      console.error("Error fetching jobs:", error);
      // Fallback to sample data when fetch fails
      dispatch(setJobs(sampleJobs));
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  if (!isClient) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold text-[#4b7a3e]">Jobs</h1>
      <div className="flex items-center justify-end">
        <Button onClick={handleNewJob} className="gap-1 mr-4">
          <Plus className="h-4 w-4" />
          New Job
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredJobs.length} of {jobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} · Show
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                {filterStatus === "all" ? "All Jobs" : filterStatus === "open" ? "Open" : "Draft"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Jobs</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("open")}>Open</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("draft")}>Draft</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            </div>
            </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
               
                  <TableHead>Job Opening</TableHead>
                  <TableHead>Candidates</TableHead>
                <TableHead>Hiring Lead</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium text-primary hover:underline">
                        <a href={`/jobs/${job.id}`}>{job.title}</a>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.department || (job.properties && job.properties.department)} - {job.location || (job.properties && job.properties.location)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                        {job.candidates || job.candidate_count || 0}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{job.hiringLead || (job.properties && job.properties.hiringLead)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {formatTimeAgo(job.created_at || job.createdOn)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${job.status === "Open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {job.properties?.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete">
                        <Trash className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Duplicate">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      </div>
      <JobFormModal isOpen={isNewJobModalOpen} onClose={() => setIsNewJobModalOpen(false)} />
    </div>
  )
}

