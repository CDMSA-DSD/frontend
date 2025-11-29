"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu, Bell } from "lucide-react";
import { NotificationDrawer } from "@/components/ui/notificationDrawer";
import { useRouter } from "next/navigation";
import type { Notification } from "@/lib/types";

type SurveyLayoutProps = {
  children: React.ReactNode;
};

const mockNotifications: Notification[] = [
  {
    id: 1,
    message: "You were mentioned in RFC-123",
    createdAt: "2025-11-27T10:00:00Z",
    read: false,
    targetUrl: "/rfc/123",
  },
  {
    id: 2,
    message: "RFC-234 was approved",
    createdAt: "2025-11-27T09:30:00Z",
    read: true,
    targetUrl: "/rfc/234",
  },
  {
    id: 3,
    message: "ADR-56 was updated",
    createdAt: "2025-11-27T08:15:00Z",
    read: true,
    targetUrl: "/adr/56",
  },
];

export default function SurveyLayout({ children }: SurveyLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);

  const router = useRouter();

  const hasUnread = notifications.some((n) => !n.read);

  const handleNotificationClick = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    router.push(notification.targetUrl);

    setNotificationsOpen(false);
  };

  return (
    <div className="flex h-screen bg-white">
      {}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {}
      <div className="flex-1 flex flex-col relative">
        {}
        <button
          className="absolute top-4 left-4 z-50 md:hidden bg-white rounded-full p-2 shadow border border-gray-200"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>

        {}
        <header className="hidden md:flex items-center justify-end px-6 py-4">
          <button
            onClick={() => setNotificationsOpen(true)}
            aria-label="Open notifications"
            className="relative rounded-full p-2 bg-white shadow border border-gray-200 hover:bg-gray-50"
          >
            <Bell className="h-5 w-5 text-gray-700" />
            {}
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-purple-500" />
            )}
          </button>
        </header>

        {}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {}
        <NotificationDrawer
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
        />
      </div>
    </div>
  );
}
