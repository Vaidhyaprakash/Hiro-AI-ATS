"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Star, Info, Download, ArrowRight, X, Loader2 } from "lucide-react"
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
  assessment: object
}

export function AssessmentList({ jobs, assessment }: CandidatesListProps) {
  const [selectAll, setSelectAll] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState<number | null>(null)
  // const job = useSelector((state: RootState) => state.jobs.jobs.find((j) => j.id === jobId))
  // const candidates = job?.candidates || []
  
  // Only run date formatting on the client
  const [candidates, setCandidates] = useState<any[]>([])
  const [assessmentDataCandidates, setAssessmentDataCandidates] = useState<Record<number, any>>({})
  const fetchCandidates = async () => {
    if (!assessment.id) return
    console.log("assessment.id", assessment.id);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assessments/${assessment.id}/candidates`)
    const data = await response.json()
    
    // Map assessment details to candidate IDs
    const assessmentDataMap: Record<number, any> = {}
    data?.candidates.forEach((candidate: any) => {
      assessmentDataMap[candidate.candidate_details.id] = candidate?.assessment_details
    })
    console.log("assessmentDataMap", assessmentDataMap);
    setAssessmentDataCandidates(assessmentDataMap)
    
    const candidatesData = data?.candidates.map((candidate: any) => candidate.candidate_details)
    console.log("candidatesData", candidatesData);
    setCandidates(candidatesData)
  }
  useEffect(() => {
    setIsClient(true)
    fetchCandidates()
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
  const moveCandidateToNextStep = async (candidateId: number, status: string) => {
   await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/update/candidate-assessment/${assessment?.id}/${candidateId}/job/${jobs[0].id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
   })
    fetchCandidates()
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

  const getScoreColorClass = (score: number | undefined) => {
    if (score === undefined || score < 0 || score > 100) return "text-gray-500"
    if (score < 50) return "text-red-500"
    if (score < 70) return "text-yellow-500"
    return "text-green-500"
  }

  if (candidates?.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No candidates yet. Add candidates to get started.</p>
      </div>
    )
  }
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
            <th className="pb-2 font-normal text-gray-500">Score</th>
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
                      Score: {candidate?.assessment_score ? candidate.assessment_score.toFixed(2) : 'Not Attended'}
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center text-sm text-blue-600 hover:underline">
                          <Info className="h-4 w-4 mr-1" />
                          View Summary
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        {assessmentDataCandidates[candidate.id]?.status === "pending" ? (
                          <div className="text-center py-2">
                            <p className="text-sm text-gray-600">Yet to take assessment</p>
                            {assessmentDataCandidates[candidate.id]?.started_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                Started: {formatDate(assessmentDataCandidates[candidate.id]?.started_at)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <h4 className="font-medium">Assessment Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span className="text-gray-600">Status:</span>
                              <span>{assessmentDataCandidates[candidate.id]?.status || "N/A"}</span>
                              
                              <span className="text-gray-600">Overall Score:</span>
                              <span className={`font-medium ${
                                getScoreColorClass(assessmentDataCandidates[candidate.id]?.overall_score)
                              }`}>
                                {assessmentDataCandidates[candidate.id]?.overall_score || "N/A"}
                              </span>
                              
                              <span className="text-gray-600">Honesty Score:</span>
                              <span className={`font-medium ${
                                getScoreColorClass(assessmentDataCandidates[candidate.id]?.honesty_score)
                              }`}>
                                {assessmentDataCandidates[candidate.id]?.honesty_score || "N/A"}
                              </span>
                              
                              {assessmentDataCandidates[candidate.id]?.completed_at && (
                                <>
                                  <span className="text-gray-600">Completed:</span>
                                  <span>{formatDate(assessmentDataCandidates[candidate.id]?.completed_at)}</span>
                                </>
                              )}
                              
                              {assessmentDataCandidates[candidate.id]?.started_at && (
                                <>
                                  <span className="text-gray-600">Started:</span>
                                  <span>{formatDate(assessmentDataCandidates[candidate.id]?.started_at)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
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
                              await moveCandidateToNextStep(candidate.id, "Interview")
                              toast({variant: "success", title: "Candidate moved to next step", description: "Candidate moved to next step"})
                            } catch (error) {
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

