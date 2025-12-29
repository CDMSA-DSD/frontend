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

  const [repoOwner, setRepoOwner] = useState<string | null>(null)
  const [selectedRepoName, setSelectedRepoName] = useState<string | null>(null)
  const [selectedBranchName, setSelectedBranchName] = useState<string | null>(
    null,
  )

  const [repos, setRepos] = useState<Repo[]>([])
  const [branches, setBranches] = useState<Branch[]>([])

  const [loading, setLoading] = useState(true)
  const [savingOrg, setSavingOrg] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [savingSelection, setSavingSelection] = useState(false)

  const [message, setMessage] = useState("")

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

        setRepoOwner(data.repoOwner ?? null)
        setSelectedRepoName(data.selectedRepoName ?? null)
        setSelectedBranchName(data.selectedBranchName ?? null)
      } catch (err) {
        console.error(err)
        setMessage("Failed to load organization data.")
      } finally {
        setLoading(false)
      }
    }
    fetchOrg()
  }, [])

  const handleSaveOrgDetails = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSavingOrg(true)
    setMessage("")

    try {
      const res = await fetcher(API_BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          domain,
          description,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`PUT ${res.status} ${res.statusText} — ${text}`)
      }

      const updated = await res.json()
      setCompanyName(updated.companyName ?? updated.name ?? "")
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
      setMessage("Failed to load repositories.")
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

  const isGitHubConnected = Boolean(repoOwner)

  return (
    <div className="min-h-screen p-8">
      <h1 className="mb-8 text-4xl font-bold text-foreground text-gray-900 max-w-3xl">
        Manage the organization's settings here
      </h1>

      <div className="max-w-md">
        <form onSubmit={handleSaveOrgDetails} className="space-y-8">
          {/* Basic info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-sm font-normal text-gray-900">
                Company Name
              </Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-11 bg-white text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain" className="text-sm font-normal text-gray-900">
                Domain
              </Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="h-11 bg-white text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-normal text-gray-900">
                Description or industry
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none bg-white text-gray-900"
              />
            </div>
          </div>

          {/* GitHub section */}
          <div className="space-y-4 border rounded-xl p-4 border-gray-300">
            <div>
              <h2 className="text-base font-semibold text-gray-900">GitHub integration</h2>
              <p className="text-xs mt-1 text-gray-900">
                Connect GitHub and choose the repository and branch where ADRs
                will be stored.
              </p>
            </div>

            {!isGitHubConnected && (
              <div className="space-y-3">
                <p className="text-sm text-red-600">
                  GitHub is not connected for this organization yet.
                </p>
                <div className="space-y-2">
                  <Label
                    htmlFor="github-token"
                    className="text-sm font-normal text-gray-900"
                  >
                    GitHub Access Token
                  </Label>
                  <Input
                    id="github-token"
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="h-11 bg-white text-gray-900"
                    placeholder="ghp_..."
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleConnectGitHubWithToken}
                  disabled={!githubToken || connecting}
                  className="w-full bg-cdmsa-primary hover:bg-cdmsa-primary-hover"
                >
                  {connecting ? "Connecting..." : "Connect GitHub"}
                </Button>
                <p className="text-xs text-gray-900">
                  Use a GitHub personal access token with appropriate repo
                  permissions.
                </p>
              </div>
            )}

            {isGitHubConnected && (
              <div className="space-y-4">
                <p className="text-sm">
                  Connected as{" "}
                  <span className="font-mono">{repoOwner ?? "unknown"}</span>
                </p>

                <div className="space-y-2">
                  <Label className="text-sm font-normal">
                    Repository (for ADRs)
                  </Label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 h-10 rounded-md border px-3 text-sm"
                      value={selectedRepoName ?? ""}
                      onChange={(e) => handleRepoChange(e.target.value)}
                      onFocus={() => {
                        if (repos.length === 0) {
                          loadRepos()
                        }
                      }}
                    >
                      <option value="">
                        {loadingRepos ? "Loading repositories..." : "Select repo"}
                      </option>
                      {repos.map((repo) => (
                        <option key={repo.name} value={repo.name}>
                          {repo.owner}/{repo.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      onClick={loadRepos}
                      disabled={loadingRepos}
                    >
                      {loadingRepos ? "Reloading..." : "Reload"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-normal">
                    Branch (for ADRs)
                  </Label>
                  <select
                    className="w-full h-10 rounded-md border px-3 text-sm"
                    value={selectedBranchName ?? ""}
                    onChange={(e) =>
                      setSelectedBranchName(e.target.value || null)
                    }
                    disabled={!selectedRepoName || loadingBranches}
                  >
                    <option value="">
                      {selectedRepoName
                        ? loadingBranches
                          ? "Loading branches..."
                          : "Select branch"
                        : "Select a repository first"}
                    </option>
                    {branches.map((branch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="button"
                  onClick={handleSaveSelection}
                  disabled={
                    savingSelection ||
                    !repoOwner ||
                    !selectedRepoName ||
                    !selectedBranchName
                  }
                  className="w-full"
                >
                  {savingSelection ? "Saving..." : "Save GitHub selection"}
                </Button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={savingOrg}
            className="h-12 w-full bg-cdmsa-primary text-white rounded-lg hover:bg-cdmsa-primary-hover transition-colors"
          >
            {savingOrg ? "Saving..." : "Save Organization Details"}
          </button>

          {message && (
            <p className="text-sm text-center mt-4">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
