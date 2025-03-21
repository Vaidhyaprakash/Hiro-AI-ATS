import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Define the job type
export interface Job {
  id: string
  title: string
  department?: string
  location?: string
  employmentType?: string
  experience?: string
  compensation?: string
  description?: string
  hiringLead?: string
  created_at?: string
  status?: "Open" | "Draft"
  candidates?: number
  properties?: {
    department?: string
    location?: string
    hiringLead?: string
    status?: string
  }
  createdOn?: string
}

// Define the state type
interface JobsState {
  jobs: Job[]
  loading: boolean
  error: string | null
}

// Initial state
const initialState: JobsState = {
  jobs: [],
  loading: false,
  error: null
}

// Create the slice
const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<Job[]>) => {
      state.jobs = action.payload
      state.loading = false
      state.error = null
    },
    addJob: (state, action: PayloadAction<Job>) => {
      state.jobs.push(action.payload)
    },
    updateJob: (state, action: PayloadAction<Job>) => {
      const index = state.jobs.findIndex(job => job.id === action.payload.id)
      if (index !== -1) {
        state.jobs[index] = action.payload
      }
    },
    deleteJob: (state, action: PayloadAction<string>) => {
      state.jobs = state.jobs.filter(job => job.id !== action.payload)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    }
  }
})

// Export actions and reducer
export const { setJobs, addJob, updateJob, deleteJob, setLoading, setError } = jobsSlice.actions
export default jobsSlice.reducer 