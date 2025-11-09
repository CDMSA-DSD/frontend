"use client"

import Background from "../../components/background"
import React, {useState} from "react";
import {useRouter} from "next/navigation";
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function AcceptInvitation() : React.JSX.Element {
    const router : AppRouterInstance = useRouter();

    type RegisterFormData = {
        org: { id : number},
        name: string,
        username: string,
        email : string,
        password: string,
    }

    const [formData, setFormData] = useState<RegisterFormData>({
        org: { id : 1},
        name: "",
        username: "",
        email: "",
        password: "",
    })


    async function handleSubmit(e : React.FormEvent<HTMLFormElement>) : Promise<void> {
        e.preventDefault(); // Prevent reloading

        // Form Validity
        const form = e.currentTarget;
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/users", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(res.statusText);
            console.log("✅ Données envoyées :", formData);

            router.push("/dashboard");
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div style={{backgroundColor: "white", height: "100vh"}}>
            <Background/>
            <div>
                <div className="flex justify-center items-center h-[100vh] mx-auto backdrop-blur-md">
                    <div
                        className="w-[560px] rounded-[24px] bg-white border border-[#5E50A4] shadow-2xl p-20 gap-4"
                    >
                        <h2 className="text-3xl font-bold text-center text-black">
                            Register
                        </h2>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-semibold text-black mb-1">
                                Name
                            </label>
                            <input
                                type="text" required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                placeholder="John"
                            />
                        </div>
                        {/*
                            <div>
                                <label className="block text-sm font-semibold text-black mb-1">
                                    Username
                                </label>
                                <input
                                    type="text" required
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                    placeholder="John"
                                />
                            </div>
                        */}
                        <div>
                            <label className="block text-sm font-semibold text-black mb-1">
                                Email
                            </label>
                            <input
                                type="email" required
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value, username: e.target.value})}
                                className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-black mb-1">
                                Password
                            </label>
                            <input
                                type="password" required
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                placeholder="John"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-2 w-full h-[56px] rounded-[24px] bg-[#5E50A4] text-white"
                        >
                            Next
                        </button>
                    </form>
                    </div>
                </div>
            </div>
        </div>

        )
}