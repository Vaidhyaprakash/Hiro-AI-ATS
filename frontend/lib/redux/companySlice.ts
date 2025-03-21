import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface CompanyState {
  name: string
  size: string
  locations: string[]
  departments: string[]
}

const initialState: CompanyState = {
  name: "",
  size: "",
  locations: [],
  departments: [],
}

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setCompany: (state, action: PayloadAction<CompanyState>) => {
      state.name = action.payload.name
      state.size = action.payload.size
      state.locations = action.payload.locations
      state.departments = action.payload.departments
    },
  },
})

export const { setCompany } = companySlice.actions
export default companySlice.reducer

