"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {Suspense, useEffect} from "react";
import { setLoginSession } from "@/lib/utils";

function MicrosoftAuthInner(): null {
    const router = useRouter();
    const searchParams = useSearchParams();

    const code = searchParams.get("code");
    const token = searchParams.get("state");

    useEffect(() => {
        if (!code) return;

        async function handleCode() {
            const payload = { code, token };

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
    }, [code, token, router]);

    return null;
}

export default function MicrosoftAuthPage() {
    return (
        <Suspense fallback={null}>
            <MicrosoftAuthInner />
        </Suspense>
    );
}

