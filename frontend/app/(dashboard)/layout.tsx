"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { LayoutDashboard, Briefcase, Users, User, LogOut } from "lucide-react"
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Contacts", href: "/contacts", icon: Users },
  ]

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen">
        <Sidebar>
          <SidebarHeader className="flex h-14 items-center border-b px-4 bg-black text-white">
            <h1 className="text-xl font-bold">HR Recruit</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className="hover:bg-gray-100 data-[active=true]:bg-gray-200 data-[active=true]:text-black"
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Profile" className="hover:bg-gray-100">
                  <a href="/profile">
                    <User />
                    <span>Profile</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Signup" className="hover:bg-gray-100">
                  <a href="/signup">
                    <LogOut />
                    <span>Signup</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 overflow-auto">
          <header className="flex h-14 items-center border-b px-4 bg-white">
            <SidebarTrigger />
            <div className="ml-4">
              <h2 className="text-lg font-semibold">
                {pathname.split("/")[1].charAt(0).toUpperCase() + pathname.split("/")[1].slice(1)}
              </h2>
            </div>
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

