"use client"

import React, { useState } from "react"
import { Sidebar } from "./sidebar"
import { Menu } from 'lucide-react'

type SurveyLayoutProps = {
  children: React.ReactNode
}

export default function SurveyLayout({ children }: SurveyLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col relative">
        <button
          className="absolute top-4 left-4 z-50 md:hidden bg-white rounded-full p-2 shadow border border-gray-200"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}