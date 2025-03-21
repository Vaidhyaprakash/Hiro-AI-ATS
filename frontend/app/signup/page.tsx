"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "@/lib/redux/userSlice";
import { setCompany } from "@/lib/redux/companySlice"; // Import setCompany
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@sparrowengg/twigs-react"; // Add this import at the top with other imports
import { motion, AnimatePresence } from "framer-motion"; // Add this import

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, ChevronsUpDown, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const router = useRouter();
  const dispatch = useDispatch();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setUser({ name: formData.name, email: formData.email }));
    console.log("API call to register user:", formData);
    setStep(2);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step === 1
                    ? "bg-primary text-primary-foreground"
                    : "border border-gray-300 text-gray-500"
                }`}
              >
                1
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  step === 1 ? "text-primary" : "text-gray-500"
                }`}
              >
                Registration
              </span>
            </div>
            <div className="mx-4 h-0.5 w-16 bg-gray-200"></div>
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step === 2
                    ? "bg-primary text-primary-foreground"
                    : "border border-gray-300 text-gray-500"
                }`}
              >
                2
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  step === 2 ? "text-primary" : "text-gray-500"
                }`}
              >
                Account settings
              </span>
            </div>
            <div className="mx-4 h-0.5 w-16 bg-gray-200"></div>
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-500">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">
                Confirm
              </span>
            </div>
          </div>
        </div> */}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none" style={{boxShadow:'none'}}>
                <CardHeader style={{padding:'24px 24px 48px 24px'}}>
                  <CardTitle className="text-center" style={{fontSize:'32px'}}>
                  Lets get started
                  </CardTitle>
                  <CardDescription className="text-center" style={{fontSize:'16px', marginTop:'8px'}}>
                  Create an account by entering your following details
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" style={{fontWeight:'400', fontSize:'12px', color:'#575757'}}>Full Name</Label>
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
                      <Label htmlFor="email" style={{fontWeight:'400', fontSize:'12px',color:'#575757'}}>Email</Label>
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
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <CompanyDetailsForm />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Replace the existing CompanyDetailsForm function with this updated version
function CompanyDetailsForm() {
  const [companyData, setCompanyData] = useState({
    name: "",
    company_size: 1,
    locations: [] as string[],
    departments: [] as string[],
    website: "",
  });
  const router = useRouter();
  const dispatch = useDispatch();

  const companySizes = [
    { value: 1, label: "1-10 employees" },
    { value: 2, label: "11-50 employees" },
    { value: 3, label: "51-200 employees" },
    { value: 4, label: "201-500 employees" },
    { value: 5, label: "501-1000 employees" },
    { value: 6, label: "1000+ employees" },
  ] as const;

  const availableLocations = [
    "New York, NY",
    "San Francisco, CA",
    "London, UK",
    "Toronto, Canada",
    "Sydney, Australia",
    "Berlin, Germany",
    "Tokyo, Japan",
    "Remote",
  ];

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
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCompanyData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (location: string) => {
    setCompanyData((prev) => {
      if (prev.locations.includes(location)) {
        return {
          ...prev,
          locations: prev.locations.filter((l) => l !== location),
        };
      } else {
        return {
          ...prev,
          locations: [...prev.locations, location],
        };
      }
    });
  };

  const handleDepartmentSelect = (department: string) => {
    setCompanyData((prev) => {
      if (prev.departments.includes(department)) {
        return {
          ...prev,
          departments: prev.departments.filter((d) => d !== department),
        };
      } else {
        return {
          ...prev,
          departments: [...prev.departments, department],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',  // Important! Specify content type
        },
        body: JSON.stringify({  // Make sure data matches the CompanyRegistrationRequest model
          name: companyData.name,
          departments: companyData.departments,
          locations: companyData.locations,
          company_size: Number(companyData.company_size), // Convert to number if it's a string
          website: companyData?.website || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to register company');
      }

      const data = await response.json();
      dispatch(setCompany(data));
      router.push("/dashboard")
      // Handle success (e.g., redirect or show success message)
      
    } catch (error) {
      console.error('Error registering company:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  return (
    <Card style={{boxShadow:'none', border:'none'}}>
      <CardHeader style={{padding:'24px 24px 48px 24px', border:'none', boxShadow:'none'}}>
        <CardTitle className="text-center" style={{fontSize:'24px'}}>Let's setup your organization</CardTitle>
        <CardDescription className="text-center" style={{fontSize:'16px', marginTop:'8px'}}>
        Enter the following details
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="name" style={{fontWeight:'400', fontSize:'12px', color:'#575757'}}>Company Name</Label>
            <Input
              id="name"
              name="name"
              value={companyData.name}
              onChange={handleChange}
              placeholder="Acme Inc."
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="company_size" style={{fontWeight:'400', fontSize:'12px',color:'#575757'}}>Company Size</Label>
            <Select
              size="lg"
              id="company_size"
              name="company_size"
              value={companySizes.find(size => size.value === companyData.company_size)}
              onChange={(value: number) => setCompanyData(prev => ({ ...prev, company_size: Number(value) }))}
              options={companySizes.map(size => ({
                label: size.label,
                value: size.value.toString()
              }))}
              css={{
                '.twigs-select__input-container': {
                  fontSize: '12px !important',
                },
                "&:focus, &:hover, &:active, &:focus-visible": {
                  outlineColor: "red !important",
                  border: "none",
                },
                '.twigs-select__control--is-focused': {
                  boxShadow: 'rgb(255, 255, 255) 0px 0px 0px 2px, #00584480 0px 0px 0px 4px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px !important'
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label style={{fontWeight:'400', fontSize:'12px',color:'#575757'}}>Locations</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {companyData.locations.length > 0
                    ? `${companyData.locations.length} location${
                        companyData.locations.length > 1 ? "s" : ""
                      } selected`
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
                        <CommandItem
                          key={location}
                          value={location}
                          onSelect={() => handleLocationSelect(location)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              companyData.locations.includes(location)
                                ? "opacity-100"
                                : "opacity-0"
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
                  <div
                    key={location}
                    className="flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs"
                  >
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
          <div className="space-y-1">
            <Label style={{fontWeight:'400', fontSize:'12px',color:'#575757'}}>Departments</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {companyData.departments.length > 0
                    ? `${companyData.departments.length} department${
                        companyData.departments.length > 1 ? "s" : ""
                      } selected`
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
                              companyData.departments.includes(department)
                                ? "opacity-100"
                                : "opacity-0"
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
                  <div
                    key={department}
                    className="flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs"
                  >
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
          <Button type="submit" className="w-full" style={{marginTop:'8px', fontWeight:'600', fontSize:'16px'}}>
            Complete Setup
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
