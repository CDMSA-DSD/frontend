"use client"

import Background from "../../components/background"
import React, { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import MicrosoftOAuth from "@/components/ui/MicrosoftOAuth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"

export default function AcceptInvitation(): React.JSX.Element {
  const router: AppRouterInstance = useRouter()

  return (
    <div style={{ backgroundColor: "white", height: "100vh" }}>
      <Background />
      <div>
        <div className="flex justify-center items-center h-[100vh] mx-auto backdrop-blur-md">
          <div className="w-[560px] rounded-[24px] bg-white border border-[#5E50A4] shadow-2xl p-20 gap-4">
            <Suspense fallback={<div>Loading...</div>}>
              <AcceptInvitationForm router={router} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )

function AcceptInvitationForm({ router }: { router: AppRouterInstance }) {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  type RegisterFormData = {
    firstname: string
    lastname: string
    email: string
    password: string
    passwordConfirm: string
  }

  const [formData, setFormData] = useState<RegisterFormData>({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    passwordConfirm: "",
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault()
    setErrorMessage(null)

    if (!token) {
      setErrorMessage("Invalid or missing invitation token.")
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setErrorMessage("Passwords do not match.")
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        password: formData.password,
      }

      const res = await fetch(
        `${BACKEND_URL}/auth/register-invitation?token=${encodeURIComponent(
          token
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        let backendMessage = "Failed to register with this invitation."
        try {
          const data = await res.json()
          if (data?.message) backendMessage = data.message
        } catch {
          // ignore JSON parse errors
        }

        setErrorMessage(backendMessage);
        return
      }

      // succesful registration – redirect user to login
      router.push("/")
    } catch (err) {
      console.error(err)
      setErrorMessage("Unexpected error while registering. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 flex items-start justify-between rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-red-700"
        >
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {!token && (
        <p className="mb-4 text-sm text-red-700">
          Invitation token is missing or invalid. Please use a valid
          invitation link.
        </p>
      )}

      <h2 className="text-3xl font-bold text-center text-cdmsa-text-primary">
        Register
      </h2>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-black mb-1">
              First name
            </label>
            <input
              type="text"
              required
              value={formData.firstname}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  firstname: e.target.value,
                }))
              }
              className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
              placeholder="John"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-black mb-1">
              Surname
            </label>
            <input
              type="text"
              required
              value={formData.lastname}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lastname: e.target.value,
                }))
              }
              className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
            placeholder="********"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-1">
            Confirm password
          </label>
          <input
            type="password"
            required
            value={formData.passwordConfirm}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                passwordConfirm: e.target.value,
              }))
            }
            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !token}
          className="mt-2 w-full h-[56px] rounded-[24px] bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover transition-colors disabled:bg-cdmsa-secondary disabled:cursor-not-allowed"
        >
          {submitting ? "Registering..." : "Register"}
        </button>
        <MicrosoftOAuth inviteToken={token}/>
      </form>
    </>
  )
}
}
