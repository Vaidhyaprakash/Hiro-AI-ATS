"use client"

import React, { createContext, useContext, ReactNode } from 'react'

interface ExamState {
  // Add your exam state properties here
  currentQuestion?: number
  // ... other exam state properties
}

interface ExamContextType {
  examState: ExamState
  // Add other context methods if needed
}

const ExamContext = createContext<ExamContextType | undefined>(undefined)

export function ExamProvider({ children }: { children: ReactNode }) {
  const examState: ExamState = {
    // Initialize your exam state here
  }

  return (
    <ExamContext.Provider value={{ examState }}>
      {children}
    </ExamContext.Provider>
  )
}

export function useExam() {
  const context = useContext(ExamContext)
  if (context === undefined) {
    throw new Error('useExam must be used within an ExamProvider')
  }
  return context
} 