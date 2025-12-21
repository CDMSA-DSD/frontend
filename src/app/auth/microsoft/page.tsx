"use client"

import {useRouter, useSearchParams} from "next/navigation";
import {useEffect} from "react";
import {setLoginSession} from "@/lib/utils";
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function MicrosoftAuth(): React.JSX.Element {
    const router : AppRouterInstance = useRouter();


    const code: string | null = useSearchParams().get('code');
    const token: string | null = useSearchParams().get('state');

    async function handleCode(): Promise<void> {
        // backend expects { code, token }
        const payload = {code, token};

        const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/oauth2/microsoft", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            await router.push("/?error=" + text);
        }

        // Persist auth info (token + user + roles) for other parts of the app
        setLoginSession(await res.json());
        await router.push("/dashboard");
    }

    useEffect(() => {
        if (code) {
            handleCode();
        }
    }, [code, token]);

    return (
        <div></div>
    );
}