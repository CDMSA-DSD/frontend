"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationDrawer } from "@/src/components/ui/notificationDrawer";
import type { Notification } from "@/lib/types";
import {
    fetchNotifications,
    fetchNotificationStatus,
    markNotificationRead,
    markAllNotificationsRead
} from "@/lib/notifications";

export function NotificationBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadStatus = useCallback(async () => {
        try {
            const status = await fetchNotificationStatus();
            // status.read es "hay notificaciones no leídas"
            setUnreadCount(status.notisNotRead ?? 0);
        } catch (e) {
            console.error("Error loading notification status", e);
        }
    }, []);

    const loadNotifications = useCallback(async () => {
        try {
            const items = await fetchNotifications({ size: 20 });
            setNotifications(items);
        } catch (e) {
            console.error("Error loading notifications", e);
        }
    }, []);

    useEffect(() => {
        // Carga inicial
        void loadStatus();

        // Polling cada 30 segundos
        const id = setInterval(() => {
            void loadStatus();
        }, 30000);

        return () => clearInterval(id);
    }, [loadStatus]);

    const handleOpen = async () => {
        if (!open) {
            await loadNotifications();
            setOpen(true);
        } else {
            setOpen(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleNotificationClick = async (n: Notification) => {
        try {
            if (!n.read) {
                await markNotificationRead(n.id);
                setNotifications((prev) =>
                    prev.map((curr) =>
                        curr.id === n.id ? { ...curr, read: true } : curr,
                    ),
                );
                await loadStatus();
            }

            if (n.rfcId != null) {
                router.push(`/rfc/${n.rfcId}`);
                setOpen(false);
            }
        } catch (e) {
            console.error("Error handling notification click", e);
        }
    };


    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead()
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read: true }))
            )
            await loadStatus()
        } catch (e) {
            console.error("Error marking all as read", e)
        }
    }

    const handleClearAll = () => {
        setNotifications([])
    }

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className="relative rounded-full p-2 bg-white shadow border border-gray-200 hover:bg-gray-50"
                aria-label="Open notifications"
            >
                <Bell className="h-5 w-5 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] min-w-[16px] h-[16px] px-1">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            <NotificationDrawer
                open={open}
                onClose={handleClose}
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onMarkAllRead={handleMarkAllRead}
                onClearAll={handleClearAll}
            />

        </>
    );
}
