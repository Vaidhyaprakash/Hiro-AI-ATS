"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ExamState {
  examId: number
  // Add other exam state properties here
}

interface ExamContextType {
  examState: ExamState
  setExamState: React.Dispatch<React.SetStateAction<ExamState>>
}

const ExamContext = createContext<ExamContextType | undefined>(undefined)

export function ExamProvider({ children }: { children: ReactNode }) {
  const [examState, setExamState] = useState<ExamState>({
    examId: 0,
    // Initialize other exam state properties here
  })

  return (
    <ExamContext.Provider value={{ examState, setExamState }}>
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