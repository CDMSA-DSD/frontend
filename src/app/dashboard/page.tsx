"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function OrganizationSettings() {
  const [companyName, setCompanyName] = useState("")
  const [domain, setDomain] = useState("")
  const [description, setDescription] = useState("")
  const [githubToken, setGithubToken] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const API_BASE = "http://localhost:8080/org_details"

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await fetch(API_BASE)
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`GET ${res.status} ${res.statusText} — ${text}`)
        }
        const data = await res.json()
        setCompanyName(data.companyName || data.name || "")
        setDomain(data.domain || "")
        setDescription(data.description || "")
        setGithubToken(data.githubToken || "")
      } catch (err) {
        console.error(err)
        setMessage("Failed to load organization data.")
      } finally {
        setLoading(false)
      }
    }
    fetchOrg()
  }, [])

  const handleSaveChanges = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    try {
      const res = await fetch(API_BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,  
          domain,
          description,
          githubToken,
        }),

      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`PUT ${res.status} ${res.statusText} — ${text}`)
      }

      const updated = await res.json()
      setCompanyName(updated.name ?? updated.companyName ?? "")
      setDomain(updated.domain ?? "")
      setDescription(updated.description ?? "")
      setGithubToken(updated.githubToken ?? "")
      setMessage("Changes saved successfully!")
    } catch (err) {
      console.error(err)
      setMessage("Error while saving changes.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-8 text-3xl font-normal text-foreground">
          Manage the organization's settings here
        </h1>

        <form onSubmit={handleSaveChanges} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-name" className="text-sm font-normal">
              Company Name
            </Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain" className="text-sm font-normal">
              Domain
            </Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-normal">
              Description or industry
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github-token" className="text-sm font-normal">
              GitHub Access Token
            </Label>
            <Input
              id="github-token"
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="h-12 w-full bg-[#6366f1] text-white hover:bg-[#5558e3]"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>

          {message && (
            <p className="text-sm text-center mt-4 text-muted-foreground">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
