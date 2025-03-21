import type { Metadata } from "next"
import { Inter, DM_Sans } from "next/font/google"
import "./globals.css"
import { ProvidersWrapper } from "@/components/providers-wrapper"

const inter = Inter({ subsets: ["latin"] })
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Multiple weights
  variable: '--dm-sans'
},
);
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} style={{fontFamily: "DM Sans"}}>
        <ProvidersWrapper>{children}</ProvidersWrapper>
      </body>
    </html>
  )
}


