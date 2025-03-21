"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { useDispatch } from "react-redux"
import { addJob } from "@/lib/redux/jobsSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import { Flex, Stepper, StepperItem, toast, Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose, DialogTrigger, DialogContent, FormLabel, IconButton, Box, Button as TwigsButton, Textarea as TwigsTextarea } from "@sparrowengg/twigs-react";
import { Flex, Stepper, StepperItem, toast, Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose, DialogTrigger, DialogContent, FormLabel, IconButton, Box, Button as TwigsButton, Textarea as TwigsTextarea } from "@sparrowengg/twigs-react";
import { AssessmentComponent } from "./assessment-component"
import { CloseIcon } from '@sparrowengg/twigs-react-icons'
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox"

interface JobFormModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Lead {
  id: number;
  name: string;
  platform: string;
  profile_url: string;
  email: string;
  location: string;
  skills: string;
  relevance_score: number;
  status: string;
  contact_info: string;
  created_at: string;
  updated_at: string;
}

function LeadsList({ leads }: { leads: Lead[] }) {
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
      setSelectedLeads(leads.map((l) => l.id.toString()))
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
      <div className="text-center py-8">
        <p className="text-muted-foreground">No leads found yet. They will appear here once the smart hire process finds potential candidates.</p>
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
            <th className="pb-2 font-normal text-gray-500">Found</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b hover:bg-gray-50">
              <td className="py-4">
                <Checkbox
                  checked={selectedLeads.includes(lead.id.toString())}
                  onCheckedChange={() => handleSelectLead(lead.id.toString())}
                  className="rounded-sm"
                />
              </td>
              <td className="py-4">
                <div>
                  <div className="font-medium text-blue-600">{lead.name}</div>
                  <div className="text-sm text-gray-600">{lead.location}</div>
                  <div className="text-sm text-gray-600">{lead.skills}</div>
                </div>
              </td>
              <td className="py-4">
                <div className="flex items-center gap-2">
                  {lead.platform === 'LinkedIn' ? (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#0077B5]" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#FF4500]" fill="currentColor">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  )}
                  <a href={lead.profile_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Profile
                  </a>
                </div>
              </td>
              <td className="py-4">{lead.email}</td>
              <td className="py-4">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {lead.relevance_score}/10
                </div>
              </td>
              <td className="py-4" suppressHydrationWarning>{formatDate(lead.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function JobFormModal({ isOpen, onClose }: JobFormModalProps) {
  const dispatch = useDispatch()
  const [step, setStep] = useState(1)
  const [surveyLink, setSurveyLink] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    employmentType: "",
    experience: "",
    compensation: "",
    location: "",
    description: "",
    hiringLead: "",
    status: "Draft" as "Open" | "Draft",
  })
  const [assessments, setAssessments] = useState<any[]>([])
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    job_title: "",
    job_description: "",
    job_requirements: "",
    job_responsibilities: "",
    job_qualifications: "",
    job_salary: ""
  });
  const [isSmartHiring, setIsSmartHiring] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoadingLeads, setIsLoadingLeads] = useState(false)

  const departments = [
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Customer Support",
    "Human Resources",
    "Finance",
    "Legal",
    "Operations",
  ]

  const employmentTypes = ["Full-time", "Part-time", "Contract", "Temporary", "Internship"]

  const locations = [
    "New York, NY",
    "San Francisco, CA",
    "London, UK",
    "Toronto, Canada",
    "Sydney, Australia",
    "Berlin, Germany",
    "Tokyo, Japan",
    "Remote",
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAssessmentsChange = useCallback((newAssessments: any[]) => {
    setAssessments(newAssessments);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      if (step === 2) {
        const payload = {
          company_id: 1,
          job_title: formData.title,
          job_description: formData.description,
          requirements: formData.experience,
          properties: {
            department: formData.department,
            employmentType: formData.employmentType,
            compensation: formData.compensation,
            location: formData.location,
            hiringLead: formData.hiringLead,
            status: "Open"
          },
          assessments: assessments,
        }
    
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/application/feedback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            throw new Error('Failed to create job')
          }
          
          const data = await response.json()
          const responseData = data
          responseData.title = data.job_title
          responseData.id = data.job_id
          setJobId(data.job_id) // Store the job ID
          dispatch(addJob(responseData))
          setSurveyLink(data.feedback_url)
          setStep(step + 1)
        } catch (error) {
          console.error('Error creating job:', error)
          toast({
            variant: "error",
            title: "Failed to create job",
            description: "Please try again later"
          });
        }
      } else {
        setStep(step + 1)
      }
    }
  }

  const steps = [
    { id: 1, name: "JD" },
    { id: 2, name: "Assessment" },
    { id: 3, name: "Done" }
  ]

  // Handle stepper navigation
  const handleStepChange = (newStep: number) => {
    setStep(newStep + 1); // Convert from 0-based to 1-based indexing
  };

  const handleAiInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAiFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAiSubmit = async () => {
    // Here you would typically make an API call to an AI service
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/job_description/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiFormData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate job description');
      }
      
      const data = await response.json();
      
      // Format the job description by replacing newlines with proper HTML
      const formattedDescription = data.job_description || '';
      
      setFormData(prev => ({
        ...prev,
        title: aiFormData.job_title || formData.title,
        compensation: aiFormData.job_salary || formData.compensation,
        experience: aiFormData.job_requirements || formData.experience,
        description: formattedDescription
      }));
      
      setAiDialogOpen(false);
    } catch (error) {
      console.error('Error generating job description:', error);
      toast({
        variant: "error",
        title: "Failed to generate job description",
      });
    }
  };

  // Initialize AI form data when the dialog opens
  const handleOpenAiDialog = () => {
    setAiFormData({
      job_title: formData.title,
      job_description: "",
      job_requirements: formData.experience,
      job_responsibilities: "",
      job_qualifications: "",
      job_salary: formData.compensation
    });
    setAiDialogOpen(true);
  };

  // Animation variants
  const contentVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  };

  const handleSmartHire = async () => {
    if (!jobId || !formData.location) {
      toast({
        variant: "error",
        title: "Please fill in location and experience requirements first"
      });
      return;
    }

    setIsSmartHiring(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: 1,
          skills: assessments[0].skills,
          location: formData.location
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start smart hiring');
      }

      const data = await response.json();
      toast({
        variant: "success",
        title: "Smart hiring process started",
        description: "We'll find relevant candidates from LinkedIn and Reddit"
      });
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

  // Add this function to fetch leads
  const fetchLeads = async () => {
    if (!jobId) return;
    
    setIsLoadingLeads(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}/leads`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      
      const data = await response.json();
      if (data.status === 'success') {
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        variant: "error",
        title: "Failed to fetch leads",
        description: "Please try again later"
      });
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // Add effect to fetch leads when jobId changes
  useEffect(() => {
    if (jobId) {
      fetchLeads();
    }
  }, [jobId]);

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex h-screen flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold">Create New Job</h2>
          {/* Steps Navigation */}
          <div>
            <div className="max-w-3xl mx-auto job-stepper-container">
              <Stepper 
                activeStep={step - 1} 
                component={{
                  Separator: ({children}: {children: React.ReactNode}) => (
                    <Flex
                      css={{
                        '& svg': {
                          color: '#005844',
                          strokeWidth: '1px',
                          stroke: '#005844',
                          '& path': {
                            stroke: '#005844',
                            strokeWidth: '1px',
                          }
                        }
                      }}
                    >
                      {children}
                    </Flex>
                  )
                }}
                onChange={handleStepChange}
                css={{
                  borderBottom: 'none',
                  '& button': {
                    color: '$white',
                  },
                  '& span': {
                    color: '$white',
                  }
                }}
              >
                {steps.map((s) => (
                  <StepperItem key={s.id} label={s.name} />
                ))}
              </Stepper>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-gray-800">
            <X className="h-5 w-5" />
          </Button>
        </div>

        

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                >
                  <form id="job-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Software Engineer"
                        required
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <select
                          id="department"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="" disabled>
                            Select department
                          </option>
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employmentType">Employment Type</Label>
                        <select
                          id="employmentType"
                          name="employmentType"
                          value={formData.employmentType}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="" disabled>
                            Select employment type
                          </option>
                          {employmentTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="experience">Experience</Label>
                        <Input
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleChange}
                          placeholder="e.g. 3-5 years"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="compensation">Compensation</Label>
                        <Input
                          id="compensation"
                          name="compensation"
                          value={formData.compensation}
                          onChange={handleChange}
                          placeholder="e.g. $80,000 - $100,000"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Job Location</Label>
                      <select
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="" disabled>
                          Select location
                        </option>
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="description">Job Description</Label>
                        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              style={{
                                border:'none',
                                color: '#005844',
                              }}
                              onClick={handleOpenAiDialog}
                            >
                              Ask AI
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader
                              css={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                justifyContent: "center",
                              }}
                            >
                              <DialogTitle size="md">Generate Job Description with AI</DialogTitle>
                              <DialogDescription>
                                Fill in the details below to generate a comprehensive job description.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogBody>
                              <Flex flexDirection="column" gap="$2" css={{ marginBottom: "$4" }} className="generate-job-description-form">
                                <FormLabel>Job Title</FormLabel>
                                <Input 
                                  name="job_title" 
                                  value={aiFormData.job_title} 
                                  onChange={handleAiInputChange} 
                                />
                              </Flex>
                              <Flex flexDirection="column" gap="$2" css={{ marginBottom: "$4" }}>
                                <FormLabel>Job Description</FormLabel>
                                <TwigsTextarea 
                                  name="job_description" 
                                  value={aiFormData.job_description} 
                                  onChange={handleAiInputChange} 
                                  placeholder="Brief overview of the position..."
                                />
                              </Flex>
                              <Flex flexDirection="column" gap="$2" css={{ marginBottom: "$4" }}>
                                <FormLabel>Requirements</FormLabel>
                                <TwigsTextarea 
                                  name="job_requirements" 
                                  value={aiFormData.job_requirements} 
                                  onChange={handleAiInputChange} 
                                  placeholder="Required skills and experience..."
                                />
                              </Flex>
                              <Flex flexDirection="column" gap="$2" css={{ marginBottom: "$4" }}>
                                <FormLabel>Responsibilities</FormLabel>
                                <TwigsTextarea 
                                  name="job_responsibilities" 
                                  value={aiFormData.job_responsibilities} 
                                  onChange={handleAiInputChange} 
                                  placeholder="Key responsibilities and duties..."
                                />
                              </Flex>
                              <Flex flexDirection="column" gap="$2" css={{ marginBottom: "$4" }}>
                                <FormLabel>Qualifications</FormLabel>
                                <TwigsTextarea 
                                  name="job_qualifications" 
                                  value={aiFormData.job_qualifications} 
                                  onChange={handleAiInputChange} 
                                  placeholder="Education, certifications, etc..."
                                />
                              </Flex>
                              <Flex flexDirection="column" gap="$2">
                                <FormLabel>Salary Range</FormLabel>
                                <Input 
                                  name="job_salary" 
                                  value={aiFormData.job_salary} 
                                  onChange={handleAiInputChange} 
                                  placeholder="e.g. $50,000 - $70,000 per year"
                                />
                              </Flex>
                            </DialogBody>
                            <DialogFooter>
                              <Flex justifyContent="flex-end" css={{ justifyContent: "flex-end" }}>
                                <TwigsButton 
                                  size="lg" 
                                  color="primary" 
                                  onClick={handleAiSubmit}
                                  css={{
                                    backgroundColor: '#005844',
                                  }}
                                >
                                  Generate & Apply
                                </TwigsButton>
                              </Flex>
                            </DialogFooter>
                            <Box css={{ position: "absolute", top: "$8", right: "$8" }}>
                              <DialogClose asChild>
                                <IconButton
                                  size="lg"
                                  icon={<CloseIcon />}
                                  variant="ghost"
                                  aria-label="Close"
                                  color="default"
                                />
                              </DialogClose>
                            </Box>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter job description..."
                        className="min-h-[200px] whitespace-pre-wrap"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hiringLead">Hiring Lead</Label>
                      <Input
                        id="hiringLead"
                        name="hiringLead"
                        value={formData.hiringLead}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                        required
                      />
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-medium">Assessment Setup</h3>
                  <p className="text-muted-foreground">
                    Configure assessment questions and evaluation criteria for candidates.
                  </p>
                  <AssessmentComponent onAssessmentsChange={handleAssessmentsChange} />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                  className="space-y-6 text-center"
                >
                  <h3 className="text-2xl font-medium">Job Created Successfully!</h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Your job has been created and is now ready to be shared with candidates. 
                    Use the feedback link below to collect responses from applicants.
                  </p>
                  <div className="rounded-md border p-4 bg-gray-50 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                      <input 
                        type="text" 
                        value={surveyLink} 
                        readOnly 
                        className="w-full bg-transparent border-none focus:outline-none text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        style={{
                          marginLeft: '12px',
                          backgroundColor: '#005844',
                          color: 'white',
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(surveyLink);
                          toast({
                            variant: "success",
                            title: "Link copied to clipboard!",
                          });
                    
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Share this link with candidates to collect their feedback and responses.
                  </p>
                  <div className="flex flex-col items-center gap-4 mt-6">
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
                  </div>
                  
                  {/* Add the leads section */}
                  <div className="mt-8">
                    {isLoadingLeads ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-[#005844] mx-auto"></div>
                        <p className="text-muted-foreground mt-2">Loading leads...</p>
                      </div>
                    ) : (
                      <LeadsList leads={leads} />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4 justify-center">
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
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-medium">Share Job</h3>
                  <p className="text-muted-foreground">Configure how and where to share this job posting.</p>
                  <div className="rounded-md bg-gray-50 p-4">
                    <p className="text-center text-muted-foreground">
                      Job sharing options will be implemented in the next phase.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex max-w-3xl mx-auto justify-between">
            <Button type="button" variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : onClose())}>
              {step > 1 ? "Back" : "Cancel"}
            </Button>
            {step === 3 ? (
              <Button
                type="button"
                onClick={onClose}
                className="bg-black hover:bg-gray-800"
              >
                Close
              </Button>
            ) : (
                <Button
                  
                type="submit"
                form={step === 1 ? "job-form" : undefined}
                onClick={step > 1 ? handleSubmit : undefined}
                className=""
              >
                {step === 2 ? "Save Job" : "Next"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

