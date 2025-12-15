"use client"

import {useSearchParams} from "next/navigation";
import {router} from "next/client";
import {useEffect} from "react";

export default function MicrosoftAuth(): React.JSX.Element {


    const code: string | null = useSearchParams().get('code');

    async function handleCode(): Promise<void> {
        // backend expects { code }
        const payload = {code};

        const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text || "Server error");
        }

        const data = await res.json();

        // Persist auth info (token + user + roles) for other parts of the app
        try {
            localStorage.setItem("auth", JSON.stringify({
                token: data.token,
                user: data.user,
                isAdmin: data.isAdmin,
                contextIsAdmin: data.contextIsAdmin ?? [],
            }));
        } catch (e) {
            console.warn("Could not persist auth to localStorage", e);
        }

        await router.push("/dashboard");
    }

    useEffect(() => {
        if (code) {
            handleCode();
        }
    }, [code]);

    return (
        <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
            <h1>Code :</h1>
            <p>{code ? code : 'Aucun code trouvé dans l\'URL.'}</p>
        </div>
    );
}