import authFetch from "@/lib/fetcher"
import type { Notification, NotificationStatus } from "@/lib/types"

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"

type PagedResponse = {
  _embedded?: Record<string, Notification[]>
  page?: {
    number: number
    size: number
    totalElements: number
    totalPages: number
  }
}

export async function fetchNotifications(opts?: {
  read?: boolean
  page?: number
  size?: number
}): Promise<Notification[]> {
  const params = new URLSearchParams()

  if (typeof opts?.read === "boolean") {
    params.append("read", String(opts.read))
  }
  params.append("page", String(opts?.page ?? 0))
  params.append("size", String(opts?.size ?? 20))

  const query = params.toString()
  const url = `${API_BASE}/me/notifications${query ? `?${query}` : ""}`

  const res = await authFetch(url)
  if (!res.ok) {
    throw new Error(
      `Failed to fetch notifications: ${res.status} ${res.statusText}`,
    )
  }

  const data: PagedResponse = await res.json()

  const embedded = data._embedded ?? {}
  const firstKey = Object.keys(embedded)[0]
  if (!firstKey) return []

  return embedded[firstKey] ?? []
}

export async function fetchNotificationStatus(): Promise<NotificationStatus> {
  const url = `${API_BASE}/me/notifications/status`
  const res = await authFetch(url)
  if (!res.ok) {
    throw new Error(
      `Failed to fetch notification status: ${res.status} ${res.statusText}`,
    )
  }
  return (await res.json()) as NotificationStatus
}

export async function markNotificationRead(id: number): Promise<void> {
  const url = `${API_BASE}/me/notifications/${id}/read`
  const res = await authFetch(url, { method: "PATCH" })
  if (!res.ok) {
    throw new Error(
      `Failed to mark notification as read: ${res.status} ${res.statusText}`,
    )
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const url = `${API_BASE}/me/notifications/mark-all-read`
  const res = await authFetch(url, { method: "POST" })
  if (!res.ok) {
    throw new Error(
      `Failed to mark all notifications as read: ${res.status} ${res.statusText}`,
    )
  }
}
