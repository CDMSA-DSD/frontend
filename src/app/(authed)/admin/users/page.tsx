"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { UsersList } from "@/components/users/users-list"

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
        return (
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        )
    })

    if (loading) return <div className="p-8 text-center">Loading...</div>

    return (
        <div className="min-h-screen bg-background px-8 py-10">
            <div className="mx-auto max-w-5xl">
                <h1 className="mb-8 text-4xl font-bold text-foreground">
                    Manage the organization&apos;s users here
                </h1>

                {/* Search + button row */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="flex-1">
                        <div
                            className="
                                h-14 
                            rounded-full 
                            bg-[#f2f2f2] 
                            px-6 
                            flex 
                            items-center 
                            shadow-sm
                            "
                        >
                            <Input
                                type="text"
                                placeholder="Search for a user"
                                className="
                                    bg-transparent 
                                    border-0 
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
        </div>
    )
}
