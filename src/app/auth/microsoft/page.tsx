"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, {FormEvent, Suspense, useEffect, useState} from "react";
import { setLoginSession } from "@/lib/utils";
import {NewOrganizationFormData} from "@/lib/types";

function MicrosoftAuthInner(): React.JSX.Element | null {
    const router = useRouter();
    const searchParams = useSearchParams();

    const code : string | null = searchParams.get("code");
    const state : string | null  = searchParams.get("state");

    useEffect(() => {
        if (!code || state?.includes("newOrg")) return;
        async function handleCode() {
            const payload = { code, token:state };

            const res = await fetch(
                process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/oauth2/microsoft",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                router.push("/?error=" + encodeURIComponent(text));
                return;
            }

            setLoginSession(await res.json());
            router.push("/dashboard");
        }

        handleCode();
    }, [code, state, router]);

    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formData, setFormData] = useState<NewOrganizationFormData>(
        {
            orgName: '',
            orgDomain: '',
            orgDescription: '',

            adminFirstName: '',
            adminLastName: '',
            adminEmail: '',
            adminPassword: '',
            adminPasswordConfirm: '',
        }
    )
    async function handleSubmit(e : FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        const payload = {
            code,
            org: {
                companyName: formData.orgName,
                domain: formData.orgDomain,
                description: formData.orgDescription,
            }
        }

        const res = await fetch(
            process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/register-org/oauth2/microsoft",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            router.push("/?error=" + encodeURIComponent(text));
            return;
        }

        setLoginSession(await res.json());
        router.push("/dashboard");
    }

    if(code && state?.includes("newOrg"))
        return (
            <div>
                <form
                    className="mt-6 flex flex-col gap-5 text-black"
                    onSubmit={handleSubmit}
                >
                    <p className="mt-3 text-center font-semibold text-black">
                        Enter your organization details
                    </p>
                    <div className="mt-5 h-3 w-full rounded-full bg-[#D9D9D9] overflow-hidden flex">
                        <div
                            className="h-3 bg-cdmsa-primary ml-auto"
                            style={{width: "55%"}}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-black mb-1">
                            Company name
                        </label>
                        <input
                            type="text" required
                            value={formData.orgName}
                            onChange={(e) =>
                                setFormData({...formData, orgName: e.currentTarget.value})
                            }
                            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                            placeholder="A company"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-black mb-1">
                            Domain
                        </label>
                        <input
                            type="text" required
                            value={formData.orgDomain}
                            onChange={(e) =>
                                setFormData({...formData, orgDomain: e.currentTarget.value})
                            }
                            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                            placeholder="example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-black mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.orgDescription}
                            onChange={(e) =>
                                setFormData({...formData, orgDescription: e.currentTarget.value})
                            }
                            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                            rows={3}
                            placeholder="Short description"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="flex-1 h-[56px] rounded-[24px] bg-cdmsa-primary text-white hover:cdmsa-primary-hover transition-colors"
                        >
                            {submitting ? "Creating..." : "Create Organization"}
                        </button>
                    </div>
                </form>
            </div>
        )
    return null
}

export default function MicrosoftAuthPage() {
    return (
        <Suspense fallback={null}>
            <MicrosoftAuthInner />
        </Suspense>
    );
}