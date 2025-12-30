"use client"

import React, { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react"
import ErrorBanner from "@/components/ui/errorBanner"
import fetcher from "@/src/lib/fetcher"
import { getAdminStatus, updateContextAdminStatus } from "@/src/lib/utils";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";

export default function Contexts(): React.JSX.Element {
    type ContextType = {
        "id": number,
        "organizationId": number,
        "name": string,
        "type": string,
        "description": string
        "contextAdmin"?: boolean
    }

    type Member = {
        userId: number
        firstname: string
        lastname: string
        email: string
        contextAdmin: boolean
    }

    type ContextAdmin = {
        contextId: number;
        name: string;
    }

    type Permissions = {
        isAdmin?: boolean;
        contextIsAdmin?: ContextAdmin[];
        name?: string;
    };


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

    const [emails, setEmails] = useState<string[]>([])
    const [filteredEmails, setFilteredEmails] = useState<string[]>([])

    const [permissions, setPermissions] = useState<Permissions | null>(getAdminStatus());

    const getOrgEmails = async (orgId: number): Promise<void> => {
        const res = await fetcher(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users?page=0&size=100`
        )

        const data = await res.json()

        const orgEmails =
            data._embedded?.users?.map((u: { email: string }) => u.email) || []

        setEmails(orgEmails)
        setFilteredEmails(orgEmails)
    }


    const search = (event: AutoCompleteCompleteEvent) => {
        let _filteredEmails: string[]

        if (!event.query.trim().length) {
            _filteredEmails = [...emails]
        } else {
            _filteredEmails = emails.filter((email) =>
                email.toLowerCase().startsWith(event.query.toLowerCase())
            )
        }

        setFilteredEmails(_filteredEmails)
    }



    const getExistingContexts = async () => {
        try {
            const adminRes = await fetcher(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/me/contexts/admin`
            )

            if (!adminRes.ok) throw new Error("Could not fetch admin contexts");
            const adminData: ContextAdmin[] = await adminRes.json();

            setPermissions((prev) => ({
                ...prev,
                contextIsAdmin: adminData,
            }));

            updateContextAdminStatus(adminData);

            const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts?page=0&size=100");
            if (!res.ok) throw new Error("Could not find context");

            // reorder contexts so that admin contexts appear first, if user is a context admin, set contextAdmin to true
            if (adminData.length > 0) {
                const reorderedContexts = (JSON.parse(await res.text())).map(
                    (context: ContextType) => ({
                        ...context,
                        contextAdmin: adminData.some((admin) => admin.contextId == context.id),
                    })
                ).sort((a: ContextType, b: ContextType) => {
                    if (a.contextAdmin && !b.contextAdmin) return -1;
                    if (!a.contextAdmin && b.contextAdmin) return 1;
                    return 0;
                });

                setContextList(reorderedContexts);
            } else {
                setContextList(JSON.parse(await res.text()));
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getExistingContexts()
        getOrgEmails(0)
    }, [])



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


    const addContextMember = async (contextId: number, email: string) => {
        try {
            const res = await fetcher(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/contexts/${contextId}/members`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                }
            );

            if (!res.ok) {
                const data = await res.json();
                setError(data.message);
                return;
            }

            setOk(`Member ${email} added.`);

            setEmails((prevEmails) => [...prevEmails, email]);
            setFilteredEmails((prevFilteredEmails) => [...prevFilteredEmails, email]);

            await getContextMembers(contextId);
        } catch (err) {
            console.error(err);
            setError("Failed to add member");
        }
    };


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
                    {(permissions?.isAdmin || permissions?.contextIsAdmin?.length !== 0) && "Manage contexts here" || "View contexts here"}
                </h1>

            {permissions?.isAdmin && (
                <button
                    onClick={() => setShowNewContextModal(true)}
                    className=" h-14 rounded-full bg-cdmsa-primary  px-8  text-sm  font-medium  text-white  shadow-sm  hover:bg-cdmsa-primary-hover transition"
                >
                    Create context
                </button>
            )}
            </div>

            {/* CONTEXT LIST */}
            <div className="flex flex-col gap-4">
                {contextList?.map((context) => {
                    const members = membersByContext[context.id] || []

                    return (
                        <details
                            key={context.id}
                            className="rounded-3xl border border-gray-200 bg-white shadow-sm"
                            onToggle={(e) => {
                                if ((e.target as HTMLDetailsElement).open) {
                                    getContextMembers(context.id)
                                }
                            }}
                        >
                            {/* HEADER */}
                            <summary className="flex cursor-pointer items-center justify-between px-6 py-5 list-none">
                                <div className="flex flex-col gap-1">
                                    {/* Nombre + Type */}
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {context.name}
                                        </h2>

                                        {context.type && (
                                            <span
                                                className="
          text-xs
          px-2
          py-1
          rounded-full
          bg-cdmsa-sidebar
          text-cdmsa-text-primary
          font-medium
        "
                                            >
                                                {context.type}
                                            </span>
                                        )}
                                    </div>

                                    {/* Descripción */}
                                    {context.description && (
                                        <p className="text-sm text-gray-500 max-w-2xl">
                                            {context.description}
                                        </p>
                                    )}
                                </div>


                                <ChevronDown
                                    className="
    h-5 w-5
    text-gray-400
    transition-transform
    group-open:rotate-180
  "
                                />

                            </summary>

                            {/* BODY */}
                            <div className="border-t border-gray-200 px-6 py-6">

                                {/* ADD MEMBER */}
                                {(context.contextAdmin || permissions?.isAdmin) && (
                                <form
                                    className="mb-6 flex items-center gap-4 w-full"
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        const email = selectedEmailByContext[context.id]
                                        if (!email) return
                                        addContextMember(context.id, email)
                                    }}
                                >
                                    <AutoComplete
                                        value={selectedEmailByContext[context.id] || ""}
                                        suggestions={filteredEmails}
                                        completeMethod={search}
                                        onChange={(e) =>
                                            setSelectedEmailByContext((prev) => ({
                                                ...prev,
                                                [context.id]: e.value,
                                            }))
                                        }
                                        className="flex-1"
                                        inputClassName="
  w-full
  h-12
  rounded-full
  bg-[#f2f2f2]
  px-6
  text-sm
  outline-none
  focus:outline-none
  focus:ring-2
  focus:ring-cdmsa-border
  focus:border-[#C7BDF0]
"

                                        panelClassName="
  mt-2
  rounded-2xl
  bg-white
  shadow-lg
  border
  border-[#E6E1F3]
  p-2
"
                                        itemTemplate={(email: string) => (
                                            <div className="px-3 py-1 text-sm hover:bg-gray-100 rounded-lg">
                                                {email}
                                            </div>
                                        )}

                                        placeholder="Insert user email"
                                    />

                                    <button
                                        type="submit"
                                        className="whitespace-nowrap h-12 rounded-full bg-cdmsa-primary px-6 text-sm font-medium text-white hover:bg-cdmsa-primary-hover transition"
                                    >
                                        Add user
                                    </button>
                                </form>
                                )}

                                {/* MEMBERS TABLE */}
                                <div className="
  rounded-2xl
  border
  border-gray-200
  divide-y
  divide-gray-200
  overflow-hidden
">
                                    <div className="
  grid
  grid-cols-[1fr_1fr_0.75fr_0fr]
  items-center
  px-4
  py-4
  gap-4
  text-sm
  font-medium
  text-gray-600
  bg-gray-50
">
                                        <span>Name</span>
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
                                                className="grid grid-cols-[1fr_1fr_auto_auto] items-center px-4 py-4 gap-4"

                                            >

                                                <div className="font-medium text-gray-900">
                                                    {member.firstname || member.lastname
                                                        ? `${member.firstname ?? ""} ${member.lastname ?? ""}`.trim()
                                                        : "—"}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {member.email}
                                                </div>



                                                {/* ROLE SELECT */}
                                                <select
                                                    value={member.contextAdmin ? "admin" : "member"}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        if (value === "admin") {
                                                            addContextAdmin(context.id, member.userId)
                                                        } else {
                                                            removeContextAdmin(context.id, member.userId)
                                                        }
                                                    }}
                                                    disabled={!permissions?.isAdmin}
                                                    className="
    h-9
    rounded-full
    bg-cdmsa-sidebar
    px-3
    text-sm
    text-gray-700
    outline-none
    focus:ring-2
    focus:ring-cdmsa-border
  "
                                                >
                                                    <option value="member">Member</option>
                                                    <option value="admin">Context admin</option>
                                                </select>

                                                {/* REMOVE ICON */}
                                                <button
                                                    onClick={() => removeContextMember(context.id, member.userId)}
                                                    disabled={!(permissions?.isAdmin || context.contextAdmin)}
                                                    className="
    ml-20
    text-gray-400
    hover:text-red-500
    transition
  "
                                                    aria-label="Remove user"
                                                >
                                                    <X size={18} />
                                                </button>
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
                    className="w-[560px] rounded-[24px] bg-white border border-cdmsa-border shadow-2xl p-8"
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
                                className="w-full rounded-[10px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cdmsa-border
 px-4 py-4"
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
                                className="w-full rounded-[10px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cdmsa-border
 px-4 py-4"
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
                                className="w-full rounded-[10px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cdmsa-border
 px-4 py-4 min-h-[120px]"
                            />
                        </div>
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 h-[40px] rounded-[20px] bg-cdmsa-secondary
 text-cdmsa-text-primary hover:bg-cdmsa-sidebar"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 h-[40px] rounded-[20px] bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover"
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