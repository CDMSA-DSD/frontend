"use client"

import { useState, type FormEvent} from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function OrganizationSettings() {
  const [companyName, setCompanyName] = useState<string>("DSD 2025")
  const [domain, setDomain] = useState<string>("fer.unizg.hr/rasip/dsd")
  const [description, setDescription] = useState<string>("DSD 2025")
  const [githubToken, setGithubToken] = useState<string>("##################")

  const handleSaveChanges = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("Saving changes:", { companyName, domain, description, githubToken })
  }

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
            className="h-12 w-full bg-[#6366f1] text-white hover:bg-[#5558e3]"
          >
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  )
}
