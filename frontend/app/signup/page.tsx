"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { setUser } from "@/lib/redux/userSlice"
import { setCompany } from "@/lib/redux/companySlice" // Import setCompany
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })
  const router = useRouter()
  const dispatch = useDispatch()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(setUser({ name: formData.name, email: formData.email }))
    console.log("API call to register user:", formData)
    setStep(2)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${step === 1 ? "bg-primary text-primary-foreground" : "border border-gray-300 text-gray-500"}`}
              >
                1
              </div>
              <span className={`ml-2 text-sm font-medium ${step === 1 ? "text-primary" : "text-gray-500"}`}>
                Registration
              </span>
            </div>
            <div className="mx-4 h-0.5 w-16 bg-gray-200"></div>
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${step === 2 ? "bg-primary text-primary-foreground" : "border border-gray-300 text-gray-500"}`}
              >
                2
              </div>
              <span className={`ml-2 text-sm font-medium ${step === 2 ? "text-primary" : "text-gray-500"}`}>
                Account settings
              </span>
            </div>
            <div className="mx-4 h-0.5 w-16 bg-gray-200"></div>
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-500">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">Confirm</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Create your account</CardTitle>
              <CardDescription className="text-center">Enter your information to get started</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Sign Up
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {step === 2 && <CompanyDetailsForm />}
      </div>
    </div>
  )
}

// Replace the existing CompanyDetailsForm function with this updated version
function CompanyDetailsForm() {
  const [companyData, setCompanyData] = useState({
    name: "",
    size: "",
    locations: [] as string[],
    departments: [] as string[],
  })
  const router = useRouter()
  const dispatch = useDispatch()

  const companySizes = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-500 employees",
    "501-1000 employees",
    "1000+ employees",
  ]

  const availableLocations = [
    "New York, NY",
    "San Francisco, CA",
    "London, UK",
    "Toronto, Canada",
    "Sydney, Australia",
    "Berlin, Germany",
    "Tokyo, Japan",
    "Remote",
  ]

  const availableDepartments = [
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCompanyData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLocationSelect = (location: string) => {
    setCompanyData((prev) => {
      if (prev.locations.includes(location)) {
        return {
          ...prev,
          locations: prev.locations.filter((l) => l !== location),
        }
      } else {
        return {
          ...prev,
          locations: [...prev.locations, location],
        }
      }
    })
  }

  const handleDepartmentSelect = (department: string) => {
    setCompanyData((prev) => {
      if (prev.departments.includes(department)) {
        return {
          ...prev,
          departments: prev.departments.filter((d) => d !== department),
        }
      } else {
        return {
          ...prev,
          departments: [...prev.departments, department],
        }
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(setCompany(companyData))
    console.log("API call to save company details:", companyData)
    router.push("/dashboard")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">Company Details</CardTitle>
        <CardDescription className="text-center">Tell us about your company</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              name="name"
              value={companyData.name}
              onChange={handleChange}
              placeholder="Acme Inc."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Company Size</Label>
            <select
              id="size"
              name="size"
              value={companyData.size}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="" disabled>
                Select company size
              </option>
              {companySizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Locations</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {companyData.locations.length > 0
                    ? `${companyData.locations.length} location${companyData.locations.length > 1 ? "s" : ""} selected`
                    : "Select locations"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search locations..." />
                  <CommandList>
                    <CommandEmpty>No location found.</CommandEmpty>
                    <CommandGroup>
                      {availableLocations.map((location) => (
                        <CommandItem key={location} value={location} onSelect={() => handleLocationSelect(location)}>
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              companyData.locations.includes(location) ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {location}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {companyData.locations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {companyData.locations.map((location) => (
                  <div key={location} className="flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs">
                    {location}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1 h-3 w-3"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <X className="h-2 w-2" />
                      <span className="sr-only">Remove {location}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Departments</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {companyData.departments.length > 0
                    ? `${companyData.departments.length} department${companyData.departments.length > 1 ? "s" : ""} selected`
                    : "Select departments"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search departments..." />
                  <CommandList>
                    <CommandEmpty>No department found.</CommandEmpty>
                    <CommandGroup>
                      {availableDepartments.map((department) => (
                        <CommandItem
                          key={department}
                          value={department}
                          onSelect={() => handleDepartmentSelect(department)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              companyData.departments.includes(department) ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {department}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {companyData.departments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {companyData.departments.map((department) => (
                  <div key={department} className="flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs">
                    {department}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1 h-3 w-3"
                      onClick={() => handleDepartmentSelect(department)}
                    >
                      <X className="h-2 w-2" />
                      <span className="sr-only">Remove {department}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Complete Setup
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

