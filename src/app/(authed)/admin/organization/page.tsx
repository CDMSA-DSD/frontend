"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import fetcher from "@/src/lib/fetcher"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"
const API_BASE = `${BACKEND_URL}/orgs`

type Repo = {
  name: string
  owner: string
}

type Branch = {
  name: string
}

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
        const res = await fetcher(API_BASE)
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
      const res = await fetcher(API_BASE, {
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
      setRepoOwner(updated.repoOwner ?? null)
      setSelectedRepoName(updated.selectedRepoName ?? null)
      setSelectedBranchName(updated.selectedBranchName ?? null)

      setMessage("Organization details saved successfully.")
    } catch (err) {
      console.error(err)
      setMessage("Error while saving organization details.")
    } finally {
      setSavingOrg(false)
    }
  }

  const handleConnectGitHubWithToken = async () => {
    setConnecting(true)
    setMessage("")

    try {
      const res = await fetcher(`${API_BASE}/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pat: githubToken.trim(),              
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`POST ${res.status} ${res.statusText} — ${text}`)
      }

      const data = await res.json()
      setMessage("GitHub connected with token.")
    } catch (err) {
      console.error(err)
      setMessage("Failed to connect GitHub with token.")
    } finally {
      setConnecting(false)
    }
  }


  const loadRepos = async () => {
    setLoadingRepos(true)
    setMessage("")
    try {
      const res = await fetcher(`${API_BASE}/github/repos`)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`GET ${res.status} ${res.statusText} — ${text}`)
      }
      const data: Repo[] = await res.json()
      setRepos(data)
    } catch (err) {
      console.error(err)
      setMessage("Error while saving changes.")
    } finally {
      setLoadingRepos(false)
    }
  }

  const loadBranches = async (owner: string, repoName: string) => {
    setLoadingBranches(true)
    setMessage("")
    try {
      const res = await fetcher(
        `${API_BASE}/github/${encodeURIComponent(owner)}/${encodeURIComponent(
          repoName,
        )}/branches`,
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`GET ${res.status} ${res.statusText} — ${text}`)
      }
      const data: Branch[] = await res.json()
      setBranches(data)
    } catch (err) {
      console.error(err)
      setMessage("Failed to load branches.")
    } finally {
      setLoadingBranches(false)
    }
  }

  const handleRepoChange = async (value: string) => {
    setSelectedRepoName(value || null)
    setSelectedBranchName(null)
    setBranches([])

    const repo = repos.find((r) => r.name === value)
    const owner = repo?.owner ?? repoOwner
    if (owner && value) {
      await loadBranches(owner, value)
    }
  }

  const handleSaveSelection = async () => {
    if (!repoOwner || !selectedRepoName || !selectedBranchName) {
      setMessage("Please select both repository and branch.")
      return
    }

    setSavingSelection(true)
    setMessage("")

    try {
      const res = await fetcher(`${API_BASE}/github/selection`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repoOwner,
          repoName: selectedRepoName,
          branchName: selectedBranchName,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`PUT ${res.status} ${res.statusText} — ${text}`)
      }

      const data = await res.json()
      setRepoOwner(data.repoOwner ?? repoOwner)
      setSelectedRepoName(data.selectedRepoName ?? selectedRepoName)
      setSelectedBranchName(data.selectedBranchName ?? selectedBranchName)

      setMessage("Repository and branch selection saved.")
    } catch (err) {
      console.error(err)
      setMessage("Failed to save repository/branch selection.")
    } finally {
      setSavingSelection(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-background p-8">
        <h1 className="mb-8 text-4xl font-bold text-foreground text-gray-900 max-w-3xl">
          Manage the organization's settings here
        </h1>

      <div className="max-w-md">
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

          <button
            type="submit"
            disabled={saving}
            className="h-12 w-full bg-[#5E50A4] text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

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
