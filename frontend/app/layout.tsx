import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ProvidersWrapper } from "@/components/providers-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HR Recruit Platform",
  description: "A comprehensive HR recruitment platform",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{
      fontFamily: "DM Sans"
    }}>
      <body className={inter.className} style={{fontFamily: "DM Sans"}}>
        <ProvidersWrapper>{children}</ProvidersWrapper>
      </body>
    </html>
  )
}


