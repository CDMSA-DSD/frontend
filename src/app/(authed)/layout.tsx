"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";
import { NotificationBell } from "@/src/components/ui/notificationBell";

type SurveyLayoutProps = {
  children: React.ReactNode
}

export default function SurveyLayout({ children }: SurveyLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col relative">

        {/* Zona superior izquierda: menú (móvil) + campanita */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">

          {/* Botón de abrir sidebar (solo móvil) */}
          <button
            className="md:hidden bg-white rounded-full p-2 shadow border border-gray-200"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>

          {/* Icono de notificaciones */}
          <NotificationBell />
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <script type="text/javascript" src="https://viewer.diagrams.net/js/viewer-static.min.js"></script>
    </div>
  )
}

