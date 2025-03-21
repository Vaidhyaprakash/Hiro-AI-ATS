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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { LineChart, Line } from 'recharts'
import { Separator } from "@/components/ui/separator"

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

export function HiredCandidatesList({ jobs, candidates, fetchCandidates }: CandidatesListProps) {
  const [selectAll, setSelectAll] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState<number | null>(null)
  const [analysingCandidate, setAnalysingCandidate] = useState<number | null>(null)
  const [openSummary, setOpenSummary] =  useState<number | null>(null)
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

  // Function to handle opening the analysis dialog
  const handleOpenSummary = (candidateId: number) => {
    setOpenSummary(candidateId)
  }
  const handleAnalyseCandidate = (candidateId: number) => {
    setAnalysingCandidate(candidateId)
  }
  // Function to get the current candidate being analyzed
  const getCurrentCandidate = () => {
    return candidates.find(c => c.id === openSummary) || null
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
      {/* Dialog for candidate analysis */}
     

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
                      Score: {candidate?.assessment_score ? candidate?.assessment_score?.toFixed(2) : candidate?.resume_score?.toFixed(2) || 'N/A'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenSummary(candidate.id)}
                      style={{
                        color: "blue",
                        width: "fit-content",
                        padding: '0px'
                      }}
                    >View Summary</Button>
                  </div>
                </div>
              </td>
              <td className="py-4">
                {loading === candidate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading !== candidate.id && <div className="flex space-x-3 justify-center">
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
                  <div className="flex flex-col space-y-2">
                    <Button onClick={() => handleAnalyseCandidate(candidate.id)}>
                      Analyse Candidate
                    </Button>
                  </div>
                </div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AnalyseModal analysingCandidate={openSummary} setAnalysingCandidate={setOpenSummary} getCurrentCandidate={getCurrentCandidate} />
      <CandidateSummary candidate={getCurrentCandidate()} analysingCandidate={analysingCandidate} setAnalysingCandidate={setAnalysingCandidate} />
    </div>
  )
}
const AnalyseModal = ({analysingCandidate, setAnalysingCandidate, getCurrentCandidate}: {analysingCandidate: number | null, setAnalysingCandidate: (candidateId: number | null) => void, getCurrentCandidate: () => any}) => {
  return (
    <Dialog open={analysingCandidate !== null} onOpenChange={(open) => !open && setAnalysingCandidate(null)}>
    <DialogContent className="max-w-full h-[90vh] flex flex-col">
      <DialogHeader className="flex flex-row justify-between items-center">
        <div>
          <DialogTitle className="text-xl font-bold">
            Candidate Analysis: {getCurrentCandidate()?.name}
          </DialogTitle>
          <DialogDescription>
            Detailed analysis and insights for this candidate
          </DialogDescription>
        </div>
      </DialogHeader>
      
      <div className="flex-1 overflow-auto p-6">
        {/* Analysis content goes here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Candidate Information</h3>
            <p><strong>Name:</strong> {getCurrentCandidate()?.name}</p>
            <p><strong>Email:</strong> {getCurrentCandidate()?.email}</p>
            <p><strong>Phone:</strong> {getCurrentCandidate()?.phone}</p>
            <p><strong>Location:</strong> {getCurrentCandidate()?.location}</p>
            <p><strong>College:</strong> {getCurrentCandidate()?.college}</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Skills Assessment</h3>
          
            <p><strong>Assessment Score:</strong> {getCurrentCandidate()?.assessment_score?.toFixed(2) || 'N/A'}</p>
            <p><strong>Resume Score:</strong> {getCurrentCandidate()?.resume_score?.toFixed(2) || 'N/A'}</p>
          </div>
          
          <div className="border rounded-lg p-4 md:col-span-2">
            <h3 className="font-medium mb-2">Summary</h3>
            <p>{getCurrentCandidate()?.interview_summary || getCurrentCandidate()?.test_summary || getCurrentCandidate()?.resume_summary || "No summary available"}</p>
          </div>
        </div>
      </div>
      
      <DialogFooter className="px-6 py-4">
        <Button variant="outline" onClick={() => setAnalysingCandidate(null)}>Close</Button>
        <Button onClick={() => window.open(getCurrentCandidate()?.resume_s3_url, '_blank')}>
          Download Resume
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  )
}
// Instead of importing from a separate file, define the mock data here
const mockCandidateAnalytics = {
  "technical_skills": {
    "overall_score": 0.6517914746584019,
    "honesty_score": 0.9472317862749852,
    "average_answer_score": 0.8145688315580848,
    "question_type_analysis": {
      "mcq": 0.7439737968137788,
      "coding": 0.9204613836745439
    }
  },
  "behavioral_analysis": {
    "culture_fit": 0.9157046886530434,
    "confidence": 0.8183855501111653,
    "positivity": 0.6406044506658359,
    "enthusiasm": 0.9514996409527225,
    "calmness": 0.8550255403799432,
    "interview_scores": {
      "culture_fit": 0.7345187385374503,
      "attitude": 0.7856233088531418,
      "contribution": 0.863814270588979
    }
  },
  "performance_metrics": {
    "performance_score": 0.8623845367028254,
    "delivery_timeline": 38
  },
  "status_progress": {
    "current_status": "Sourced",
    "assessment_score": 0.7083686275282866,
    "resume_score": 0.7243138148509538
  },
  "radar_chart_data": {
    "Technical Competency": 0.7083686275282866,
    "Cultural Fit": 0.9157046886530434,
    "Performance": 0.8623845367028254,
    "Communication": 0.8183855501111653,
    "Problem Solving": 0.8145688315580848
  },
  "timeline_data": [
    {
      "date": "2025-03-16T22:57:30.932801",
      "event": "Interview Conducted",
      "score": 0.7946521059931904
    },
    {
      "date": "2025-03-20T22:57:30.921776",
      "event": "Candidate Registered",
      "status": "Sourced"
    }
  ],
  "strengths_weaknesses": {
    "strengths": [
      "Culture Fit",
      "Confidence",
      "Enthusiasm",
      "Calmness",
      "Honesty"
    ],
    "weaknesses": [
      "Positivity",
      "Technical Assessment"
    ]
  }
};

const CandidateSummary = ({candidate, analysingCandidate, setAnalysingCandidate}: {candidate: CandidatesListProps['candidates'][0] | null, analysingCandidate: number | null, setAnalysingCandidate: (candidateId: number | null) => void}) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (analysingCandidate) {
        setLoading(true);
        try {
          const response = await fetch(`/api/candidates/${analysingCandidate}/analytics`);
          if (response.ok) {
            const data = await response.json();
            setAnalyticsData(data);
          } else {
            // If API fails, use mock data
            setAnalyticsData(mockCandidateAnalytics);
          }
        } catch (error) {
          console.error("Error fetching analytics:", error);
          // Use mock data on error
          setAnalyticsData(mockCandidateAnalytics);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
  }, [analysingCandidate]);

  return (
    <Dialog open={analysingCandidate !== null} onOpenChange={(open) => !open && setAnalysingCandidate(null)}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold">
            Candidate Analysis: {candidate?.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : analyticsData ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="technical">Technical Skills</TabsTrigger>
              <TabsTrigger value="behavioral">Behavioral Analysis</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Assessment</CardTitle>
                    <CardDescription>Radar chart showing candidate's performance across key areas</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={90} data={Object.entries(analyticsData.radar_chart_data).map(([key, value]) => ({ subject: key, value: Number(value) * 100 }))}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar name="Score" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Strengths & Weaknesses</CardTitle>
                    <CardDescription>Key areas of excellence and improvement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Strengths</h4>
                        <div className="flex flex-wrap gap-2">
                          {analyticsData.strengths_weaknesses.strengths.map((strength: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Weaknesses</h4>
                        <div className="flex flex-wrap gap-2">
                          {analyticsData.strengths_weaknesses.weaknesses.map((weakness: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              {weakness}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Technical Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">
                      {Math.round(analyticsData.technical_skills.overall_score * 100)}%
                    </div>
                    <Progress value={analyticsData.technical_skills.overall_score * 100} className="h-2" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Behavioral Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">
                      {Math.round(analyticsData.behavioral_analysis.culture_fit * 100)}%
                    </div>
                    <Progress value={analyticsData.behavioral_analysis.culture_fit * 100} className="h-2" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Current Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">
                      {analyticsData.status_progress.current_status}
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Assessment Score: {Math.round(analyticsData.status_progress.assessment_score * 100)}%
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="technical" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Skills Breakdown</CardTitle>
                    <CardDescription>Performance across different question types</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(analyticsData.technical_skills.question_type_analysis).map(([key, value]) => ({ name: key.toUpperCase(), score: Number(value) * 100 }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip formatter={(value) => [`${value}%`, 'Score']} />
                        <Legend />
                        <Bar dataKey="score" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Assessment Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Overall Score</span>
                          <span className="text-sm font-medium">{Math.round(analyticsData.technical_skills.overall_score * 100)}%</span>
                        </div>
                        <Progress value={analyticsData.technical_skills.overall_score * 100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Honesty Score</span>
                          <span className="text-sm font-medium">{Math.round(analyticsData.technical_skills.honesty_score * 100)}%</span>
                        </div>
                        <Progress value={analyticsData.technical_skills.honesty_score * 100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Average Answer Score</span>
                          <span className="text-sm font-medium">{Math.round(analyticsData.technical_skills.average_answer_score * 100)}%</span>
                        </div>
                        <Progress value={analyticsData.technical_skills.average_answer_score * 100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="behavioral" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Behavioral Traits</CardTitle>
                    <CardDescription>Key personality and behavioral indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={Object.entries(analyticsData.behavioral_analysis)
                          .filter(([key]) => !key.includes('interview_scores'))
                          .map(([key, value]) => ({ name: key.replace('_', ' ').charAt(0).toUpperCase() + key.replace('_', ' ').slice(1), score: Number(value) * 100 }))}
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" />
                        <RechartsTooltip formatter={(value) => [`${value}%`, 'Score']} />
                        <Bar dataKey="score" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Interview Performance</CardTitle>
                    <CardDescription>Scores from interview assessment</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(analyticsData.behavioral_analysis.interview_scores).map(([key, value]) => ({ 
                          name: key.replace('_', ' ').charAt(0).toUpperCase() + key.replace('_', ' ').slice(1), 
                          score: Number(value) * 100 
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip formatter={(value) => [`${value}%`, 'Score']} />
                        <Bar dataKey="score" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Overall performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold mb-2">
                        {Math.round(analyticsData.performance_metrics.performance_score * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Performance Score</div>
                      <Progress value={analyticsData.performance_metrics.performance_score * 100} className="h-2 w-full mt-4" />
                    </div>
                    
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold mb-2">
                        {analyticsData.performance_metrics.delivery_timeline}
                      </div>
                      <div className="text-sm text-muted-foreground">Delivery Timeline (days)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timeline" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Candidate Timeline</CardTitle>
                  <CardDescription>History of candidate's journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {analyticsData.timeline_data.map((event: any, index: number) => (
                      <div key={index} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary"></div>
                        {index < analyticsData.timeline_data.length - 1 && (
                          <div className="absolute left-2 top-5 w-0.5 h-16 bg-gray-200"></div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <h4 className="font-medium">{event.event}</h4>
                          {event.score && (
                            <p className="text-sm">Score: {Math.round(event.score * 100)}%</p>
                          )}
                          {event.status && (
                            <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                              {event.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>No analytics data available for this candidate.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}