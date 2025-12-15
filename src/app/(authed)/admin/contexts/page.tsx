"use client"

import React, { useEffect, useState } from "react";
import ErrorBanner from "@/components/ui/errorBanner"
import fetcher from "@/src/lib/fetcher"
import { Input } from "@/src/components/ui/input";

export default function Contexts(): React.JSX.Element {
    type ContextType = {
        "id": number,
        "organizationId": number,
        "name": string,
        "type": string,
        "description": string
    }

    type Member = {
        userId: number
        firstname: string
        lastname: string
        email: string
        contextAdmin: boolean
    }


    const [showNewContextModal, setShowNewContextModal] = useState(false);
    const [contextList, setContextList] = useState<ContextType[] | null>(null);

    const [membersByContext, setMembersByContext] = useState<
        Record<number, Member[]>
    >({})

    const [selectedEmailByContext, setSelectedEmailByContext] = useState<
        Record<number, string>
    >({})

    const [error, setError] = useState<string>("")
    const [ok, setOk] = useState<string>("")


    const getExistingContexts = async () => {
        try {
            const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts");
            if (res.ok) setContextList(JSON.parse(await res.text()));
            else throw new Error("Could not find context");
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getExistingContexts();
    }, []);


    const getContextMembers = async (contextId: number) => {
        try {
            const res = await fetcher(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/contexts/${contextId}/members`
            )

            if (!res.ok) throw new Error("Could not fetch members")

            const data: Member[] = await res.json()

            setMembersByContext((prev) => ({
                ...prev,
                [contextId]: data,
            }))
        } catch (err) {
            console.error(err)
            setError("Failed to load context members")
        }
    }

    const addContextAdmin = async (
        contextId: number,
        userId: number
    ) => {
        await fetcher(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/contexts/${contextId}/admins`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            }
        )

        await getContextMembers(contextId)
    }

    const removeContextAdmin = async (
        contextId: number,
        userId: number
    ) => {
        await fetcher(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/contexts/${contextId}/admins/${userId}`,
            { method: "DELETE" }
        )

        await getContextMembers(contextId)
    }


    const addContextMember = async (
        contextId: number,
        email: string
    ) => {
        try {
            const res = await fetcher(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/contexts/${contextId}/members`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                }
            )

            if (!res.ok) {
                const data = await res.json()
                setError(data.message)
                return
            }

            setOk(`Member ${email} added.`)
            setSelectedEmailByContext((prev) => ({
                ...prev,
                [contextId]: "",
            }))

            await getContextMembers(contextId)
        } catch (err) {
            console.error(err)
            setError("Failed to add member")
        }
    }

    const removeContextMember = async (
        contextId: number,
        userId: number
    ) => {
        await fetcher(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/contexts/${contextId}/members/${userId}`,
            { method: "DELETE" }
        )

        await getContextMembers(contextId)
    }



    return (
        <div className="min-h-screen p-8 text-black max-w-6xl mx-auto">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    Manage contexts
                </h1>

                <button
                    onClick={() => setShowNewContextModal(true)}
                    className="h-14 rounded-full bg-[#f2f2f2] px-8 text-sm font-medium shadow-sm hover:bg-[#e5e5e5] transition"
                >
                    Create context
                </button>
            </div>

            {/* CONTEXT LIST */}
            <div className="flex flex-col gap-4">
                {contextList?.map((context) => {
                    const members = membersByContext[context.id] || []

                    return (
                        <details
                            key={context.id}
                            className="rounded-3xl border bg-white shadow-sm"
                            onToggle={(e) => {
                                if ((e.target as HTMLDetailsElement).open) {
                                    getContextMembers(context.id)
                                }
                            }}
                        >
                            {/* HEADER */}
                            <summary className="flex cursor-pointer items-center justify-between px-6 py-5 list-none">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {context.name}
                                    </h2>
                                    {context.type && (
                                        <p className="text-sm text-gray-500">{context.type}</p>
                                    )}
                                </div>

                                <span className="text-xl text-gray-400 transition-transform group-open:rotate-180">
                                    ˅
                                </span>
                            </summary>

                            {/* BODY */}
                            <div className="border-t px-6 py-6">
                                {/* ADD MEMBER */}
                                <form
                                    className="mb-6 flex items-center gap-4"
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        const email = selectedEmailByContext[context.id]
                                        if (!email) return
                                        addContextMember(context.id, email)
                                    }}
                                >
                                    <Input
                                        placeholder="Insert user email"
                                        className="h-14 rounded-full bg-[#f2f2f2]"
                                        value={selectedEmailByContext[context.id] || ""}
                                        onChange={(e) =>
                                            setSelectedEmailByContext((prev) => ({
                                                ...prev,
                                                [context.id]: e.target.value,
                                            }))
                                        }
                                    />

                                    <button
                                        type="submit"
                                        className="h-14 rounded-full bg-violet-600 px-6 text-sm font-medium text-white hover:bg-violet-700 transition"
                                    >
                                        Add user
                                    </button>
                                </form>

                                {/* MEMBERS TABLE */}
                                <div className="rounded-2xl border overflow-hidden">
                                    <div className="grid grid-cols-[1fr_160px_80px] bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                                        <span>Email</span>
                                        <span>Role</span>
                                        <span></span>
                                    </div>

                                    {members.length === 0 ? (
                                        <div className="px-4 py-6 text-sm text-gray-500">
                                            No members in this context.
                                        </div>
                                    ) : (
                                        members.map((member) => (
                                            <div
                                                key={member.userId}
                                                className="grid grid-cols-[1fr_160px_80px] items-center border-t px-4 py-4"
                                            >
                                                <span>{member.email}</span>

                                                <span className="text-sm">
                                                    {member.contextAdmin ? "Context admin" : "Member"}
                                                </span>

                                                <div className="flex justify-end gap-2">
                                                    {member.contextAdmin ? (
                                                        <button
                                                            onClick={() =>
                                                                removeContextAdmin(context.id, member.userId)
                                                            }
                                                            className="text-xs text-gray-500 hover:underline"
                                                        >
                                                            Demote
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                addContextAdmin(context.id, member.userId)
                                                            }
                                                            className="text-xs text-violet-600 hover:underline"
                                                        >
                                                            Promote
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() =>
                                                            removeContextMember(context.id, member.userId)
                                                        }
                                                        className="text-xs text-red-600 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </details>
                    )
                })}
            </div>

            {/* CREATE CONTEXT MODAL */}
            <NewContextModal
                open={showNewContextModal}
                onClose={() => setShowNewContextModal(false)}
            />
        </div>
    )




    function NewContextModal({
        open,
        onClose,
    }: {
        open: boolean;
        onClose: () => void;
    }): React.JSX.Element | null {
        const [formData, setFormData] = useState({
            name: "",
            type: "",
            description: "",
        });
        const [errorMessage, setErrorMessage] = useState<string>();

        /**
         * TODO Make this version generic.
         * Handle the submit form and redirect to the current page if ok
         * @param e The form, must be used to prevent reloading
         *
         * @alpha
         */
        async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
            e.preventDefault();
            try {
                const res = await fetcher(
                    process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(formData),
                    }
                );

                if (!res.ok) {
                    const data: { message: string } = await res.json()
                    setErrorMessage(data.message)
                } else {
                    setErrorMessage("")
                    await getExistingContexts();
                    onClose();
                }

            } catch (err) {
                console.log(err);
            }
        }

        if (!open) return null;
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md "
                onClick={() => onClose()}
            >
                <div
                    className="w-[560px] rounded-[24px] bg-white border border-[#5E50A4] shadow-2xl p-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    {errorMessage && (
                        <ErrorBanner text={errorMessage} />
                    )}
                    <h2 className="text-3xl font-bold text-center text-black mb-6">
                        New context
                    </h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-black">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                className="w-full rounded-[10px] border px-4 py-4"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Type</label>
                            <input
                                type="text"
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                                }
                                className="w-full rounded-[10px] border px-4 py-4"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                className="w-full rounded-[10px] border px-4 py-4 min-h-[120px]"
                            />
                        </div>
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 h-[40px] rounded-[20px] border text-[#5E50A4]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 h-[40px] rounded-[20px] bg-[#5E50A4] text-white"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}