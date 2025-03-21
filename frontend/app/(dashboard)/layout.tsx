"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { LayoutDashboard, Briefcase, Users, User, LogOut, BarChart, FileText, UserPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navigation = [
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analyse", href: "/analyse", icon: BarChart },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Candidates", href: "/candidates", icon: UserPlus },
    { name: "Reports", href: "/reports", icon: FileText },
  ]

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen">
        <Sidebar className="w-16 flex-shrink-0 bg-white shadow-sm">
          <SidebarHeader className="flex h-14 items-center justify-center border-b px-4 bg-black text-white">
            <h1 className="text-xl font-bold">HR</h1>
          </SidebarHeader>
          <SidebarContent style={{marginTop: '8px'}}>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          className="hover:bg-gray-100 data-[active=true]:bg-gray-200 data-[active=true]:text-black flex justify-center transition-all duration-200 ease-in-out"
                        >
                          <a href={item.href} className="flex items-center justify-center py-3 relative group">
                            <item.icon className="h-8 w-8 transition-transform duration-200 group-hover:scale-110" />
                            {pathname === item.href && (
                              <motion.div 
                                layoutId="activeIndicator"
                                className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-md"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                          </a>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-gray-800 text-white border-none">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild className="hover:bg-gray-100 flex justify-center transition-all duration-200 ease-in-out">
                        <a href="/profile" className="flex items-center justify-center py-3 group">
                          <User className="h-8 w-8 transition-transform duration-200 group-hover:scale-110" />
                        </a>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-800 text-white border-none">
                      Profile
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild className="hover:bg-gray-100 flex justify-center transition-all duration-200 ease-in-out">
                        <a href="/logout" className="flex items-center justify-center py-3 group">
                          <LogOut className="h-8 w-8 transition-transform duration-200 group-hover:scale-110" />
                        </a>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-800 text-white border-none">
                      Logout
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 overflow-auto">
          <header className="flex h-10 items-center px-4 bg-white">
          </header>
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-4 bg-white"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </SidebarProvider>
  )
}

