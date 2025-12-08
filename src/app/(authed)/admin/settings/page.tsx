"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/fetcher";

type MeResponse = {
  id: number;
  email: string;
  firstname?: string;
  lastName?: string;
  jobTitle?: string; // ← backend field for "role"
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export default function SettingsPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // load current user
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await authFetch(`${BACKEND_URL}/me`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`GET /me ${res.status} — ${txt}`);
        }

        const json = (await res.json()) as MeResponse;
        setMe(json);
        setFirstname(json.firstname ?? "");
        setLastname(json.lastName ?? "");
        setJobTitle(json.jobTitle ?? "");
      } catch (e: any) {
        setError(e?.message ?? "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!me) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const body = {
        firstname,
        lastname,
        jobTitle,
      };

      const res = await authFetch(`${BACKEND_URL}/me`, {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`PUT /me ${res.status} — ${txt}`);
      }

      const updated = (await res.json()) as MeResponse;
      setMe(updated);
      setFirstname(updated.firstname ?? "");
      setLastname(updated.lastName ?? "");
      setJobTitle(updated.jobTitle ?? "");
      setSuccess("Settings saved.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading…</div>;
  }

  if (!me) {
    return (
      <div className="p-8 text-red-600">
        {error ?? "Failed to load user profile."}
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-background">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Settings</h1>

      <Card className="max-w-xl border border-gray-200 shadow-sm rounded-2xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input value={me.email} disabled className="bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First name
            </label>
            <Input
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last name
            </label>
            <Input
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role in organization
          </label>
          <Input
            placeholder="e.g. Backend Developer, Product Manager…"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="
              px-6 py-2.5
              rounded-xl
              bg-purple-600
              text-white
              text-sm
              font-medium
              shadow-sm
              hover:bg-purple-700
              disabled:bg-purple-300
              disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Card>
    </main>
  );
}
