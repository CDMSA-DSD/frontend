"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { UsersList } from "@/components/users/users-list"
import { X } from "lucide-react"
import fetcher from "@/src/lib/fetcher"

type OrgUser = {
  id: number
  email: string
  role: string
  status: string
  joinedAt?: string
}

type Invitation = {
  id: number
  link: string
  expiresAt: string
  state: string
  token?: string
  createdAt?: string
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"

export default function UsersPage() {
  const [users, setUsers] = useState<OrgUser[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)
  const [lastInvitation, setLastInvitation] = useState<Invitation | null>(null)

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [invitationsLoading, setInvitationsLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetcher(`${BACKEND_URL}/users?page=0&size=100`)

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`GET /users ${res.status} ${res.statusText} — ${text}`)
        }

        const data = await res.json()

        const rawUsers: any[] =
          (data && data._embedded && data._embedded.users) || data || []

        console.log("RAW /users RESPONSE:", rawUsers)

        const mapped: OrgUser[] = rawUsers.map((u: any) => {
          const backendRole =
            u.role ??
            u.organizationRole ??
            u.orgRole ??
            u.roleInOrganization ??
            u.memberRole

          return {
            id: u.id,
            email: u.email,
            role: u.jobTitle || backendRole || "Member",
            status: u.status ?? "ACTIVE",
            joinedAt: u.joinedAt,
          }
        })

        setUsers(mapped)
      } catch (err) {
        console.error(err)
        setMessage("Failed to load users.")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const fetchInvitations = async () => {
    setInvitationsLoading(true)

    try {
      const res = await fetcher(`${BACKEND_URL}/invitations?size=50`)

      if (!res.ok) {
        const text = await res.text()
        throw new Error(
          `GET /invitations ${res.status} ${res.statusText} — ${text}`,
        )
      }

      const raw = await res.json()

      let list: any[] = []

      if (Array.isArray(raw)) {
        list = raw
      } else if (raw && raw._embedded) {
        const embedded = raw._embedded
        const firstKey = Object.keys(embedded)[0]
        if (firstKey && Array.isArray(embedded[firstKey])) {
          list = embedded[firstKey]
        }
      }

      const filtered = list.filter((item: any) => {
        const enabledFlag =
          item.enabled ??
          item.enable ??
          item.isEnabled ??
          item.active ??
          item.isActive

        if (typeof enabledFlag === "boolean") {
          return enabledFlag
        }

        const stateStr = String(item.state ?? item.status ?? "").toUpperCase()
        return stateStr !== "DISABLED"
      })

      const mapped: Invitation[] = filtered.map((item: any) => {
        const token = item.token ?? ""
        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : ""
        const link =
          item.link ??
          (token && baseUrl
            ? `${baseUrl}/accept-invitation?token=${token}`
            : "")

        return {
          id: item.id,
          link,
          expiresAt: item.expiresAt ?? "",
          state: item.state ?? item.status ?? "",
          token,
          createdAt: item.createdAt ?? "",
        }
      })

      setInvitations(mapped)
    } catch (err) {
      console.error(err)
      setMessage("Failed to load invitations.")
    } finally {
      setInvitationsLoading(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    setMessage("")

    try {
      const res = await fetcher(`${BACKEND_URL}/users/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(
          `DELETE /users/${id} ${res.status} ${res.statusText} — ${text}`,
        )
      }

      setUsers((prev) => prev.filter((u) => u.id !== id))
      setMessage("User removed successfully.")
    } catch (err) {
      console.error(err)
      setMessage("Error while removing user.")
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.status.toLowerCase().includes(q)
    )
  })

  const openInviteModal = () => {
    setIsInviteModalOpen(true)
    setMessage("")
    fetchInvitations()
  }

  const closeInviteModal = () => {
    if (isSubmittingInvite) return
    setIsInviteModalOpen(false)
  }

  useEffect(() => {
    if (!isInviteModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeInviteModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isInviteModalOpen, isSubmittingInvite])

  const handleInviteSubmit = async () => {
    if (isSubmittingInvite) return

    setMessage("")
    setIsSubmittingInvite(true)

    try {
      const res = await fetcher(`${BACKEND_URL}/invitations`, {
        method: "POST",
      })

      if (res.status === 401) {
        setMessage("Session expired. Please log in again.")
        return
      }

      if (res.status === 403) {
        setMessage("You are not allowed to create invitations (403).")
        return
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(
          `POST /invitations ${res.status} ${res.statusText} — ${text}`,
        )
      }

      const raw = await res.json()
      console.log("Invitation response:", raw)

      const invite: Invitation = {
        id: raw.id,
        link: raw.link ?? raw.url ?? "",
        expiresAt: raw.expiresAt ?? raw.expires_at ?? "",
        state: raw.state ?? raw.status ?? "",
        token: raw.token,
        createdAt: raw.createdAt,
      }

      setLastInvitation(invite)
      setInvitations((prev) => {
        const without = prev.filter((i) => i.id !== invite.id)
        return [...without, invite]
      })
      setMessage("Invitation link created successfully.")
    } catch (err) {
      console.error(err)
      if (!message) {
        setMessage("Failed to create invitation link.")
      }
    } finally {
      setIsSubmittingInvite(false)
    }
  }

  const handleDeleteInvitation = async (id: number) => {
    setMessage("")

    try {
      const res = await fetcher(`${BACKEND_URL}/invitations/${id}`, {
        method: "DELETE",
      })

      if (res.status === 401) {
        setMessage("Session expired. Please log in again.")
        return
      }

      if (res.status === 403) {
        setMessage("You are not allowed to delete invitations (403).")
        return
      }

      if (res.status === 404) {
        setMessage("Invitation not found.")
        return
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(
          `DELETE /invitations/${id} ${res.status} ${res.statusText} — ${text}`,
        )
      }

      setInvitations((prev) => prev.filter((inv) => inv.id !== id))

      setMessage("Invitation invalidated successfully.")
    } catch (err) {
      console.error(err)
      setMessage("Failed to invalidate invitation.")
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  const isInviteDisabled = isSubmittingInvite

  return (
    <div className="min-h-screen p-8 items-center justify-between mb-4 text-black">
      <div className="mb-4">
        <h1 className="mb-8 text-4xl font-bold text-foreground text-gray-900 max-w-3xl">
          Manage the organization&apos;s users here
        </h1>

        {/* Search + button row */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex h-14 items-center rounded-full bg-[#f2f2f2] px-6 shadow-sm">
              <Input
                type="text"
                placeholder="Search for a user"
                className="
                  flex-1
                  bg-transparent
                  border-0
                  outline-none
                  focus:outline-none
                  focus-visible:ring-0
                  focus-visible:ring-offset-0
                  placeholder:text-gray-500
                "
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={openInviteModal}
            className="
              h-14
              rounded-full
              bg-[#f2f2f2]
              px-8
              text-sm
              font-medium
              shadow-sm
              hover:bg-[#e5e5e5]
              transition
            "
          >
            Invite controls
          </button>
        </div>

        {/* Users table */}
        <UsersList users={filteredUsers} onDeleteUser={handleDeleteUser} />

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">
            {message}
          </p>
        )}
      </div>

      {/* Invite controls modal */}
      {isInviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-sm backdrop-saturate-125"
          onClick={closeInviteModal}
        >
          <div
            className="mx-4 w-full max-w-lg rounded-2xl border-2 border-violet-600 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b p-8">
              <h2 className="text-center text-3xl font-bold text-gray-900">
                Invite controls
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Generate an invitation link that anyone can use to register in
                this organization.
              </p>
            </div>

            {/* Body */}
            <div className="space-y-6 p-8">
              <button
                type="button"
                onClick={handleInviteSubmit}
                disabled={isInviteDisabled}
                className="
                  w-full
                  rounded-lg
                  bg-violet-600
                  px-6
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  transition-colors
                  hover:bg-violet-700
                  disabled:bg-violet-400
                  disabled:cursor-not-allowed
                "
              >
                {isSubmittingInvite ? "Creating..." : "Create invitation link"}
              </button>

              {lastInvitation && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">
                    Latest invitation link
                  </p>
                  <Input
                    readOnly
                    value={lastInvitation.link || ""}
                    className="text-xs"
                  />
                  <p className="text-xs text-gray-500">
                    State: {lastInvitation.state || "—"} — Expires at:{" "}
                    {lastInvitation.expiresAt
                      ? new Date(lastInvitation.expiresAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">
                  Existing invitations
                </p>

                {invitationsLoading ? (
                  <p className="text-xs text-gray-500">
                    Loading invitations...
                  </p>
                ) : invitations.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No invitations created yet.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-3 overflow-y-auto">
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3"
                      >
                        <Input
                          readOnly
                          value={inv.link || ""}
                          className="text-xs"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500">
                            State: {inv.state || "—"} — Expires at:{" "}
                            {inv.expiresAt
                              ? new Date(inv.expiresAt).toLocaleString()
                              : "—"}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvitation(inv.id)}
                            disabled={isSubmittingInvite}
                            className="
                              rounded-md
                              border border-red-600
                              px-3
                              py-1
                              text-xs
                              font-medium
                              text-red-600
                              hover:bg-red-50
                              disabled:opacity-50
                            "
                          >
                            Invalidate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 p-6">
              <button
                type="button"
                onClick={closeInviteModal}
                disabled={isSubmittingInvite}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-purple-100
                  px-6
                  py-2.5
                  text-sm
                  font-medium
                  text-purple-700
                  transition-colors
                  hover:bg-purple-200
                  disabled:opacity-50
                "
              >
                <X className="h-5 w-5" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
