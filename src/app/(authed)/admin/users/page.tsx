"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UsersList } from "@/components/users/users-list"
import { X } from "lucide-react"

type OrgUser = {
  id: number
  email: string
  role: string
  joinedAt?: string
}

const API_BASE = "http://localhost:8080/users"

export default function UsersPage() {
  const [users, setUsers] = useState<OrgUser[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "",
    message: "",
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(API_BASE)
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`GET ${res.status} ${res.statusText} — ${text}`)
        }

        const data = await res.json()
        const mapped: OrgUser[] = data.map((u: { id: number; email: string }) => ({
          id: u.id,
          email: u.email,
          role: "Employee",
          joinedAt: undefined,
        }))

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

  const handleDeleteUser = async (id: number) => {
    setMessage("")

    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`DELETE ${res.status} ${res.statusText} — ${text}`)
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
    return u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
  })

  const openInviteModal = () => {
    setIsInviteModalOpen(true)
  }

  const closeInviteModal = () => {
    if (isSubmittingInvite) return
    setIsInviteModalOpen(false)
    setInviteForm({ email: "", role: "", message: "" })
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
      const res = await fetch(`${API_BASE}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          message: inviteForm.message || undefined,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`POST ${res.status} ${res.statusText} — ${text}`)
      }

      setMessage("Invitation sent successfully.")
      closeInviteModal()
    } catch (err) {
      console.error(err)
      setMessage("Failed to send invitation.")
    } finally {
      setIsSubmittingInvite(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  const isInviteDisabled =
    !inviteForm.email.trim() || !inviteForm.role.trim() || isSubmittingInvite

  return (
    <div className="min-h-screen bg-background px-8 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-4xl font-bold text-foreground">
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
              text-foreground 
              shadow-sm 
              hover:bg-[#e5e5e5]
              transition
            "
          >
            Invite user
          </button>
        </div>

        <UsersList users={filteredUsers} onDeleteUser={handleDeleteUser} />

        {message && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </div>

      {/* Invite User Modal */}
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
                Invite user
              </h2>
            </div>

            {/* Body */}
            <div className="space-y-6 p-8">
              {/* Email */}
              <div>
                <label
                  htmlFor="invite-email"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={isSubmittingInvite}
                  className="h-11 border-gray-300"
                />
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="invite-role"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="invite-role"
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  disabled={isSubmittingInvite}
                  className="
                    block 
                    w-full 
                    h-11 
                    rounded-lg 
                    border 
                    border-gray-300 
                    px-3 
                    text-sm
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-violet-500
                  "
                >
                  <option value="">Select a role</option>
                  <option value="Dev">Dev</option>
                  <option value="HR Staff">HR Staff</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="invite-message"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  Message (optional)
                </label>
                <Textarea
                  id="invite-message"
                  rows={4}
                  value={inviteForm.message}
                  onChange={(e) =>
                    setInviteForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  disabled={isSubmittingInvite}
                  className="resize-none border-gray-300"
                  placeholder="Add a short message to the invite (optional)"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6">
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
                Cancel
              </button>

              <button
                type="button"
                onClick={handleInviteSubmit}
                disabled={isInviteDisabled}
                className="
                  w-48
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
                {isSubmittingInvite ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
