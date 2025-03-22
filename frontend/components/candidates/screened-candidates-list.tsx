"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Star, Info, Download, ArrowRight, X, Loader2, PhoneIcon } from "lucide-react"
// import { Checkbox } from "@/components/ui/checkbox"
import type { RootState } from "@/lib/redux/store"
import { Checkbox } from "../ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import { Button } from "../ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "@sparrowengg/twigs-react"
// import { formatDistanceToNow } from "@/lib/utils"

interface CandidatesListProps {
  jobs: object[],
  candidates: {
    id: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    college: string;
    skills: string;
    resume_s3_url: string;
    assessment_score: number;
    resume_score: number;
    resume_summary: string;
    test_summary: string;
    status: string | null;
    created_at: string;
    updated_at: string;
  }[]
  fetchCandidates: () => void
}

export function ScreenedCandidatesList({ jobs, candidates, fetchCandidates }: CandidatesListProps) {
  const [selectAll, setSelectAll] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState<number | null>(null)
  // const job = useSelector((state: RootState) => state.jobs.jobs.find((j) => j.id === jobId))
  // const candidates = job?.candidates || []
  
  // Only run date formatting on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(candidates.map((c) => c.id.toString()))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectCandidate = (id: string) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter((cId) => cId !== id))
    } else {
      setSelectedCandidates([...selectedCandidates, id])
    }
  }
  const moveCandidateToNextStep = async (candidateId: number, jobId: number) => {
   await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/update/candidate-assessment/${candidateId}/job/${jobId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
   })
    fetchCandidates()
  }

  const renderRating = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    if (!isClient || !dateString) return "-"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return "-"
    }
  }
  const callInitialCandidate = async (candidatePhone: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/call/${candidatePhone}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        },
        body: JSON.stringify({
          phone_number: candidatePhone
        }),
        mode: "cors" // Explicitly set CORS mode
      });
      
      if (!response.ok) {
        throw new Error('Failed to start interview');
      }
      
      const data = await response.json();
      toast({
        variant: "success", 
        title: "Interview call initiated", 
        description: "The system is calling the candidate now"
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      toast({
        variant: "error", 
        title: "Failed to start interview", 
        description: "Please try again later"
      });
    }
  }

  const getTimeAgo = (dateString: string) => {
    if (!isClient || !dateString) return ""
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
      
      if (diffInSeconds < 60) return 'just now'
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
      return `${Math.floor(diffInSeconds / 86400)}d ago`
    } catch {
      return ""
    }
  }

  if (candidates?.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No candidates yet. Add candidates to get started.</p>
      </div>
    )
  }
  console.log(candidates)
  console.log("frontend/components/screened-candidates-list.tsx")
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-normal text-gray-500 w-10">
              <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} className="rounded-sm" />
            </th>
            <th className="pb-2 font-normal text-gray-500">Candidate Info</th>
            <th className="pb-2 font-normal text-gray-500">Status</th>
            <th className="pb-2 font-normal text-gray-500">Skills</th>
            <th className="pb-2 font-normal text-gray-500">Applied</th>
            <th className="pb-2 font-normal text-gray-500">Resume</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="border-b hover:bg-gray-50">
              <td className="py-4">
                <Checkbox
                  checked={selectedCandidates.includes(candidate.id.toString())}
                  onCheckedChange={() => handleSelectCandidate(candidate.id.toString())}
                  className="rounded-sm"
                />
              </td>
              <td className="py-4">
                <div>
                  <div className="font-medium text-blue-600">{candidate.name}</div>
                  <div className="text-sm text-gray-600">{candidate.location}</div>
                  <div className="text-sm text-gray-600">{candidate.phone}</div>
                </div>
              </td>
              <td className="py-4">
                <div>
                  <div>{candidate.status || 'New'}</div>
                  <div className="text-sm text-gray-600">
                    {isClient ? getTimeAgo(candidate.updated_at) : ""}
                  </div>
                </div>
              </td>
              <td className="py-4" style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "150px"
              }}>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-left hover:underline truncate w-full">
                      {candidate.skills}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Skills</h4>
                      <p className="text-sm text-gray-700">{candidate.skills}</p>
                    </div>
                  </PopoverContent>
                </Popover>
              </td>
              <td className="py-4" suppressHydrationWarning>{formatDate(candidate.created_at)}</td>
              <td className="py-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-col justify-between">
                  <span className="text-sm font-medium py-1 rounded">
                      Score: {candidate?.resume_score?.toFixed(2) || 'N/A'}
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center text-sm text-blue-600 hover:underline">
                          <Info className="h-4 w-4 mr-1" />
                          View Summary
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Resume Summary</h4>
                          <p className="text-sm text-gray-700">{candidate.resume_summary || "No summary available"}</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                   
                  </div>
                </div>
              </td>
              <td className="py-4">
                {loading === candidate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading !== candidate.id && <div className="flex space-x-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-green-800 hover:text-green-900 hover:bg-green-50"
                          onClick={async () => {
                            // You'll implement this functionality later
                            if(candidate?.phone) {
                              callInitialCandidate(candidate.phone)
                            }
                          }}
                        >
                          <PhoneIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Initial Call</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(candidate.resume_s3_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download Resume</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-green-800 hover:text-green-900 hover:bg-green-50"
                          onClick={async () => {
                            // You'll implement this functionality later
                            setLoading(candidate.id)
                            console.log(`Moving candidate ${candidate.id} to next step`);
                            try {
                              const response = await moveCandidateToNextStep(candidate.id, jobs[0].id)
                              console.log(response);
                              toast({variant: "success", title: "Candidate moved to next step", description: "Candidate moved to next step"})
                            } catch (error) {
                              console.log('response')
                              toast({variant: "error", title: "Error moving candidate to next step", description: "Please try again later"})
                              console.error("Error moving candidate to next step:", error);
                            }
                            finally {
                              setLoading(null)
                            }
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Move to Next Step</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            // You'll implement this functionality later
                            await moveCandidateToNextStep(candidate.id, "Rejected")
                            console.log(`Rejecting candidate ${candidate.id}`);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reject Candidate</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

