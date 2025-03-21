"use client"

import React, { useEffect } from "react"
import { ReduxProvider } from "@/lib/redux/provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastrProvider } from "@/components/toastr-provider"
import { ThemeProvider as TwigsThemeProvider } from '@sparrowengg/twigs-react'
import config from '../app/twigs.config.js'

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const nextPortals = document.getElementsByTagName('nextjs-portal');
    if (nextPortals.length > 0) {
      // Loop through all elements in the collection
      for (let i = 0; i < nextPortals.length; i++) {
        nextPortals[i].style.display = 'none';
      }
    }
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {/* 
        <ToastrProvider />
        <ReduxProvider>{children}</ReduxProvider>
      </TwigsThemeProvider> */}
       <ToastrProvider />
       <ReduxProvider>{children}</ReduxProvider>
    </ThemeProvider>
  )
} 