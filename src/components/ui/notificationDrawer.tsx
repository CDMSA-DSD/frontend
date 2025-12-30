"use client";

import React from "react";
import { X } from "lucide-react";
import type { Notification } from "@/lib/types";

type NotificationDrawerProps = {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(); // luego se puede cambiar por "x minutes ago"
}

export function NotificationDrawer({
  open,
  onClose,
  notifications,
  onNotificationClick,
  onMarkAllRead,
  onClearAll,
}: NotificationDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Fondo semitransparente que oscurece TODO, incluido el sidebar */}
      <div
        className="flex-1 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral */}
      <aside className="w-full max-w-md h-full bg-white shadow-xl flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Notifications</h2>

          <div className="flex items-center gap-3">
            <button
              onClick={onMarkAllRead}
              className="text-sm text-cdmsa-text-primary hover:underline"
            >
              Mark all read
            </button>

            <button
              onClick={onClearAll}
              className="text-sm text-gray-600 hover:underline"
            >
              Clear
            </button>

            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>


        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">
              You have no notifications yet.
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => onNotificationClick(n)}
                className={`w-full text-left rounded-xl border bg-white px-4 py-3 shadow-sm hover:shadow-md transition 
                  ${!n.read
                    ? "border-purple-300 bg-purple-50"
                    : "border-gray-200"
                  }`}
              >
                <p className="text-sm font-medium text-gray-900">
                  {n.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(n.createdAt)}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
