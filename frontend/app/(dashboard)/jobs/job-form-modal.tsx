"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useDispatch } from "react-redux"
import { addJob } from "@/lib/redux/jobsSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import { Flex, Stepper, StepperItem, toast, Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose, DialogTrigger, DialogContent, FormLabel, IconButton, Box, Button as TwigsButton, Textarea as TwigsTextarea } from "@sparrowengg/twigs-react";
import { AssessmentComponent } from "./assessment-component"
import { CloseIcon } from '@sparrowengg/twigs-react-icons'
import { motion, AnimatePresence } from "framer-motion";

interface JobFormModalProps {
  isOpen: boolean
  onClose: () => void
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

  const handleSubmit = (e: React.FormEvent) => {
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
    
        // Make API call to create job
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/application/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to create job')
          }
          return response.json()
        })
          .then(data => {
            const responseData = data
            responseData.title = data.job_title
            responseData.id = data.job_id
            console.log(data)
            dispatch(addJob(responseData))
            setSurveyLink(data.feedback_url)
          setStep(step + 1)
        })
        .catch(error => {
          console.error('Error creating job:', error)
        })
      } else {
        setStep(step + 1)
      }
      if (step === 3) {
        setStep(1)
        setFormData({
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
        onClose()
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
                                  size="md" 
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
                                  size="md" 
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

