"use client"

import type React from "react"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { addJob } from "@/lib/redux/jobsSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import { Flex, Stepper, StepperItem } from "@sparrowengg/twigs-react";
import { AssessmentComponent } from "./assessment-component"

interface JobFormModalProps {
  isOpen: boolean
  onClose: () => void
}

export function JobFormModal({ isOpen, onClose }: JobFormModalProps) {
  const dispatch = useDispatch()
  const [step, setStep] = useState(1)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 4) {
      setStep(step + 1)
    } else {
      dispatch(
        addJob({
          ...formData,
          status: "Open",
        }),
      )
      console.log("API call to create job:", formData)
      onClose()
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
        status: "Draft",
      })
    }
  }

  const steps = [
    { id: 1, name: "JD" },
    { id: 2, name: "Assessment" },
    { id: 3, name: "Emails" },
    { id: 4, name: "Share" },
  ]

  // Handle stepper navigation
  const handleStepChange = (newStep: number) => {
    setStep(newStep + 1); // Convert from 0-based to 1-based indexing
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex h-screen flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-black text-white">
          <h2 className="text-xl font-bold">Create New Job</h2>
          {/* Steps Navigation */}
          <div>
            <div className="max-w-3xl mx-auto">
              <Stepper 
                activeStep={step - 1} 
                component={{
                  Separator: ({children}: {children: React.ReactNode}) => (
                    <Flex
                      css={{
                        '& svg': {
                          color: '$white',
                          strokeWidth: '1px',
                          stroke: '$white',
                          '& path': {
                            stroke: '$white',
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
            {step === 1 && (
              <form id="job-form" onSubmit={handleSubmit} >
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
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter job description..."
                    className="min-h-[200px]"
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
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Assessment Setup</h3>
                <p className="text-muted-foreground">
                  Configure assessment questions and evaluation criteria for candidates.
                </p>
                <AssessmentComponent />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Templates</h3>
                <p className="text-muted-foreground">
                  Configure email templates for different stages of the hiring process.
                </p>
                <div className="rounded-md bg-gray-50 p-4">
                  <p className="text-center text-muted-foreground">
                    Email template configuration will be implemented in the next phase.
                  </p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Share Job</h3>
                <p className="text-muted-foreground">Configure how and where to share this job posting.</p>
                <div className="rounded-md bg-gray-50 p-4">
                  <p className="text-center text-muted-foreground">
                    Job sharing options will be implemented in the next phase.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex max-w-3xl mx-auto justify-between">
            <Button type="button" variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : onClose())}>
              {step > 1 ? "Back" : "Cancel"}
            </Button>
            <Button
              type="submit"
              form={step === 1 ? "job-form" : undefined}
              onClick={step > 1 ? handleSubmit : undefined}
              className="bg-black hover:bg-gray-800"
            >
              {step < 4 ? "Next" : "Create Job"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

