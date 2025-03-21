"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { Checkbox } from "../ui/checkbox"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { EmailIcon } from "@sparrowengg/twigs-react-icons"

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
function LeadsList({ leads, jobs }: { leads: any[], jobs: any[] }) {
  const [selectAll, setSelectAll] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads?.map((l) => l.id.toString()))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectLead = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter((lId) => lId !== id))
    } else {
      setSelectedLeads([...selectedLeads, id])
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

  if (leads?.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">
          {jobs[0].smart_hire_enabled ? "No leads found yet. They will appear here once the smart hire process finds potential candidates." : "Enable Smart Hire to find candidates"}
        </p>
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
            <th className="pb-2 font-normal text-gray-500">Lead Info</th>
            <th className="pb-2 font-normal text-gray-500">Platform</th>
            <th className="pb-2 font-normal text-gray-500">Contact</th>
            <th className="pb-2 font-normal text-gray-500">Score</th>
            <th className="pb-2 font-normal text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads?.map((lead) => (
            <tr key={lead.id} className="border-b hover:bg-gray-50">
              <td className="py-4">
                <Checkbox
                  checked={selectedLeads.includes(lead.id.toString())}
                  onCheckedChange={() => handleSelectLead(lead.id.toString())}
                  className="rounded-sm"
                />
              </td>
              <td className="py-4" style={{
                maxWidth: '300px',
              }}>
                <div style={{
                    textWrap: 'balance',
                    lineHeight: '1.2',
                    marginRight:'4px'
                  }}>
                  <div className="font-medium text-blue-600">{lead.name}</div>
                  <div className="text-sm text-gray-600">{lead.location}</div>
                  <div className="text-sm text-gray-600" >{lead.skills}</div>
                </div>
              </td>
              <td className="py-4" style={{
                cursor:'pointer'
              }}>
                <div className="flex items-center gap-2" onClick={() => window.open(lead.profile_url, '_blank')}>
                  {lead.platform === 'LinkedIn' ? (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#0077B5]" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#FF4500]" fill="currentColor">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  )}
                </div>
              </td>
              <td className="py-4">{lead.email}</td>
              <td className="py-4">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {lead.relevance_score}/10
                </div>
              </td>
              <td className="py-4">
                <div className="">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                  >
                    <EmailIcon />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SmarthireList({ jobs, candidates, fetchCandidates }: CandidatesListProps) {
  const [selectAll, setSelectAll] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState<number | null>(null)
  const [isSmartHiring, setIsSmartHiring] = useState(false)
  const [leads, setLeads] = useState<any[]>([])
  const [isLoadingLeads, setIsLoadingLeads] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const fetchSmarthireCandidates = async () => {
    if (!jobs || jobs.length === 0 || !jobs[0].id) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobs[0].id}/leads`)
      const data = await response.json()
      console.log(data)
      if (data.status === "success") {
        setLeads(data.leads || [])
      }
      else {
        setLeads([])
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
      setLeads([])
    }
  }
  
  useEffect(() => {
    fetchSmarthireCandidates()
  }, [jobs])
  
  const handleSmartHire = async () => {
    if (!jobs || jobs.length === 0 || !jobs[0].id) {
      toast({
        variant: "error",
        title: "No job selected"
      });
      return;
    }

    setIsSmartHiring(true);
    try {
      const job = jobs[0];
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.id,
          skills: job.skills || [],
          location: job.properties?.location || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start smart hiring');
      }
      fetchCandidates();
      const data = await response.json();
      toast({
        variant: "success",
        title: "Smart hiring process started",
        description: "We'll find relevant candidates from LinkedIn and Reddit"
      });
      
      // Refresh the leads after a short delay
      setTimeout(() => {
        fetchSmarthireCandidates();
      }, 2000);
      
    } catch (error) {
      console.error('Error in smart hiring:', error);
      toast({
        variant: "error",
        title: "Failed to start smart hiring",
        description: "Please try again later"
      });
    } finally {
      setIsSmartHiring(false);
    }
  };

  return (
    <>
      {jobs && !jobs[0].smart_hire_enabled && <div className="flex flex-col items-center gap-4 mt-6">
                    <Button
                      onClick={handleSmartHire}
                      disabled={isSmartHiring}
                      className="bg-[#005844] hover:bg-[#004534] text-white flex items-center gap-2 px-6 py-2 rounded-md"
                    >
                      {isSmartHiring ? "Finding Candidates..." : "Smart Hire"}
                      {isSmartHiring && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      )}
                    </Button>
                  </div>}
                  
                  {/* Add the leads section */}
                  <div className="mt-4">
                    {isLoadingLeads ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-[#005844] mx-auto"></div>
                        <p className="text-muted-foreground mt-2">Loading leads...</p>
                      </div>
                    ) : (
                      <LeadsList leads={leads} jobs={jobs} />
                    )}
                  </div>
                  
                  {  jobs && !jobs[0].smart_hire_enabled && <div className="flex items-center gap-6 mt-4 justify-center">
                    <div className="flex items-center gap-2 relative group">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0077B5]" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 relative group">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#FF4500]" fill="currentColor">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 relative group cursor-not-allowed">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-300" fill="currentColor">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                      <span className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Coming Soon</span>
                    </div>
                    <div className="flex items-center gap-2 relative group cursor-not-allowed">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-300" fill="currentColor">
                        <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-7.5 13.5h-3v-9h3v9zm7.5 0h-3v-9h3v9z"/>
                      </svg>
                      <span className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Coming Soon</span>
                    </div>
                    </div>}
    </>
  )
}
