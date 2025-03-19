import type React from "react"
import type { Metadata } from "next"
import { ExamProvider } from '@/contexts/ExamContext'

export const metadata: Metadata = {
  title: "Exam Portal",
  description: "Online examination platform",
}

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ExamProvider>
      <div className="min-h-screen bg-background">
        <main className="flex-1">{children}</main>
      </div>
    </ExamProvider>
  )
} 