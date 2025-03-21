import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Job {
  id: string
  title: string
  department: string
  location: string
  employmentType: string
  experience: string
  compensation: string
  description: string
  hiringLead: string
  createdOn: string
  status: "Open" | "Draft"
  candidates: number
}

interface JobsState {
  jobs: Job[]
  currentJob: Job | null
}

const initialState: JobsState = {
  jobs: [
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
      createdOn: "Feb 14, 2025",
      status: "Open",
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
      createdOn: "Feb 14, 2025",
      status: "Open",
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
      createdOn: "Oct 15, 2024",
      status: "Open",
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
      createdOn: "Oct 13, 2024",
      status: "Open",
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
      createdOn: "Oct 13, 2024",
      status: "Draft",
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
      createdOn: "Oct 13, 2024",
      status: "Open",
      candidates: 4,
    },
  ],
  currentJob: null,
}

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    addJob: (state, action: PayloadAction<Omit<Job, "id" | "createdOn" | "candidates">>) => {
      const newJob: Job = {
        ...action.payload,
        id: Date.now().toString(),
        createdOn: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        candidates: 0,
      }
      state.jobs.push(newJob)
    },
    setCurrentJob: (state, action: PayloadAction<string | null>) => {
      if (action.payload === null) {
        state.currentJob = null
      } else {
        state.currentJob = state.jobs.find((job) => job.id === action.payload) || null
      }
    },
  },
})

export const { addJob, setCurrentJob } = jobsSlice.actions
export default jobsSlice.reducer

