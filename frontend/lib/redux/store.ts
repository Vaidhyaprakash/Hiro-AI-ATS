import { configureStore } from "@reduxjs/toolkit"
import userReducer from "./userSlice"
import companyReducer from "./companySlice"
import jobsReducer from "./slices/jobsSlice"

export const store = configureStore({
  reducer: {
    user: userReducer,
    company: companyReducer,
    jobs: jobsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

