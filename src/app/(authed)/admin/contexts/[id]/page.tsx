"use client"

import React, {ChangeEvent, FormEvent, useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {AutoComplete, AutoCompleteCompleteEvent} from 'primereact/autocomplete';
import ErrorBanner from "@/components/ui/errorBanner"
import OkBanner from "@/components/ui/okBanner"
import fetcher from "@/src/lib/fetcher"

export default function GetContextById(): React.JSX.Element {
    type Context = {
        "id":number,
        "organizationId":number
        "name":string,
        "type":string,
        "description":string,
    }

    type Member = {
        "userId": number,
        "firstname": string,
        "lastname": string,
        "email": string,
        "contextAdmin":boolean
    }

    const [emails, setEmails] = useState<string[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [filteredEmails, setFilteredEmails] = useState<string[]>([]);

    const [error, setError] = useState<string>("");
    const [ok, setOk] = useState<string>("");

    const { id } = useParams();
    const router = useRouter();
    const [context, setContext] = useState<Context>()
    const [members, setMembers] = useState<Member[]>()

    /**
     * @brief Get all emails from the organization of the current [id] context in order to suggest them when adding a new context member
     */
    const getOrgEmails = async (orgId : number): Promise<void> => {
        const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/users?page=0&size=100");

        const data = await res.json();
        const orgEmails = data._embedded?.users?.map((user: { email: string }) => user.email) || [];
        setEmails(orgEmails);
        setFilteredEmails(orgEmails);
    }

    /**
     * @brief Look if the input value starts as the same as other emails from the same organization. -> getOrgEmails()
     */
    const search = (event: AutoCompleteCompleteEvent) => {

        let _filteredEmails : string[];

        if (!event.query.trim().length) {
            _filteredEmails = [...emails];
        }
        else {
            _filteredEmails = emails.filter((email) => {
                return email.toLowerCase().startsWith(event.query.trim().toLowerCase());
            });
        }
        setFilteredEmails(_filteredEmails);
    }

    /**
     * @brief Get related information from context (Title, type...)
     */
    const getExistingContext = async () : Promise<void> => {
        try {

            const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id);
            if (res.ok) {
                const data : Context = await res.json();
                setContext(data);
                await getOrgEmails(data.organizationId)
            }
            else throw new Error("Server error");
        } catch (err) {
            console.log(err);
        }
    };

    /**
     * @brief Get all the user from context [id]
     */
    const getContextMembers = async () : Promise<void> => {
        try {
            const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/members");
            if (res.ok) setMembers(JSON.parse(await res.text()));
            else throw new Error("Could not find members");
        } catch (err) {
            console.log(err);
        }
    };

    /**
     * @brief Promote an existing context member to context admin
     * @param userId
     */
    const addContextAdmin = async (userId : number) => {

        try {
            const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({userId}),
            });
            if (res.ok) await getContextMembers();
            else throw new Error("Could not find members");
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * @brief Downgrade an existing context admin from the context to normal member.
     * @param userId
     */
    const removeContextAdmin = async (userId : number) => {
        try {
            const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/admins/" + userId , {
                method: "DELETE",
            });
            if (res.ok) await getContextMembers();
            else throw new Error("Could not find members");
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * @brief Add a new context member via email
     * @param email
     */
    const addContextMember = async (email:string) => {
        try {
            const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({email}),
            });
            if (res.ok) setOk(prev => `${prev}\nMember ${email} added.`);
            else {
                const data : {message:string} = await res.json()
                setError(prev =>`${prev}\nCannot add member ${email}: ${data.message}`);
            };
            getContextMembers();
        } catch (err){
            throw err;
        }
    }

    const removeContextMember = async (userId : number) => {
        try {
            const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/members/" + userId , {
                method: "DELETE",
            });
            if (res.ok) await getContextMembers();
            else throw new Error("Server Error");
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * @brief Delete this context (soft delete on backend)
     */
    const deleteContextById = async () => {
        if (!confirm("Are you sure you want to delete this context? This action can only be performed by an admin.")) return;
        try {
            const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id, {
                method: "DELETE",
            });
            if (res.ok) {
                setOk(prev => `${prev}\nContext deleted.`);
                // navigate back to contexts list
                router.push('/admin/contexts');
            } else {
                let msg = '';
                try { const data = await res.json(); msg = data?.message ?? res.statusText; } catch { msg = res.statusText }
                setError(prev => `${prev}\nCould not delete context: ${msg}`);
            }
        } catch (err) {
            setError(prev => `${prev}\nCould not delete context: ${String(err)}`);
        }
    }

    useEffect(() => {
        getExistingContext();
        getContextMembers();
    }, []);


    // Terrible code
    return (
        <div className="flex flex-col mt-5 h-screen max-w-2xl mx-auto ml-auto mr-auto text-black">
            <ErrorBanner text={error}/>
            <OkBanner text={ok}/>
            <h1 className="text-4xl text-[#5E50A4]">{context?.name}</h1>
            <div className="flex justify-end mt-2">
                <button
                    onClick={deleteContextById}
                    className="flex-none h-[56px] px-6 rounded-[24px] bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                    Delete Context
                </button>
            </div>
            <div className="p-4">
                <h2 className="text-1xl text-[#625B71]">Type: {context?.type}</h2>
                <p>{context?.description}</p>
            </div>
            <div>
                <h1 className="text-4xl text-[#5E50A4]">Context Admins</h1>
                {members?.every((member) => !member.contextAdmin) && (
                    <div className="flex flex-row items-center p-4 mb-4 border border-[#5E50A4] rounded-[24px]">
                        <p>There is currently no context admin!</p>
                    </div>
                )}
                {members?.map((member: Member)  : false | React.JSX.Element => (
                    member.contextAdmin &&
                    <div key={member.userId} className="flex flex-row items-center p-4 mb-4 border border-[#5E50A4] rounded-[24px]">
                        <p> {member.email}</p>
                        <div className="ml-auto">
                            <button className="drop-shadow-xl lg:w-auto p-4 rounded-[24px] bg-[#5E50A4] text-white hover:bg-violet-700 transition-colors"
                            onClick={() => removeContextAdmin(member.userId)}
                            >
                                ⬇ Revoke Context Admin ⬇
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div>
                <h1 className="text-4xl text-[#5E50A4]">Context Members</h1>
                <div className="">
                    <form     className="mb-4 flex flex-row items-center gap-3"
                              onSubmit={(e) => {
                                  e.preventDefault();
                                  setOk("");
                                  setError("");
                                  selectedEmails.map(email => addContextMember(email));
                                  setSelectedEmails([]);
                              }}
                    >
                        <div className="flex w-full border border-[#5E50A4] rounded-[24px] p-4">
                            <AutoComplete
                                multiple
                                value={selectedEmails}
                                suggestions={filteredEmails}
                                completeMethod={search}
                                onChange={(e: any) => setSelectedEmails(e.value)}
                                panelClassName="rounded-[24px] p-4 bg-white text-black shadow-lg"
                                style={{

                                }}
                                selectedItemTemplate={(email: string) => (
                                    <div className="flex items-center rounded-2xl bg-[#F5F0FF] border border-[#5E50A4] px-3 py-1 mr-2">
                                        <span className="text-sm text-[#1D1B20]">{email}</span>

                                        <button
                                            type="button"
                                            className="ml-2 flex items-center justify-center w-5 h-5 rounded-full hover:bg-[#E0D4FF] transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedEmails((prev) => prev.filter((v) => v !== email));
                                            }}
                                        >
                                            <i className="pi pi-times text-xs text-[#5E50A4]" />
                                        </button>
                                    </div>
                                )}

                            />
                        </div>
                        <button className="flex-none h-[56px] px-6 rounded-[24px] bg-[#5E50A4] text-white hover:bg-violet-700 transition-colors">
                            Add Member(s)
                        </button>
                    </form>
                </div>
                {members?.every((member) => member.contextAdmin) && (
                    <div className="flex flex-row items-center p-4 mb-4 border border-[#5E50A4] rounded-[24px]">
                        <p>There are currently no regular members!</p>
                    </div>
                )}
                {members?.map((member: Member)  : false | React.JSX.Element => (
                    !member.contextAdmin &&
                    <div key={member.userId} className="flex flex-row items-center p-4 mb-4 border border-[#5E50A4] rounded-[24px]">
                        <p> {member.email}</p>
                        <div className="ml-auto">
                            <button className="drop-shadow-xl lg:w-auto p-4 mr-3 rounded-[24px] bg-[#5E50A4] text-white hover:bg-violet-700 transition-colors"
                                    onClick={() => addContextAdmin(member.userId)}
                            >
                                ⬆ Set Context Admin ⬆
                            </button>
                            <button className="drop-shadow-xl lg:w-auto p-4 rounded-[24px] bg-[#5E50A4] text-white hover:bg-violet-700 transition-colors"
                            onClick={() => removeContextMember(member.userId)}
                            >
                                Remove from context
                            </button>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    )
}