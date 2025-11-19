"use client"

import React, {ChangeEvent, FormEvent, useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {AutoComplete, AutoCompleteCompleteEvent} from 'primereact/autocomplete';

const headers = { // TODO: Authentication
    "X-User-Id": "1",
    "Content-Type": "application/json",
};

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
        "username": string,
        "contextAdmin":boolean
    }

    const [emails, setEmails] = useState<string[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [filteredEmails, setFilteredEmails] = useState<string[]>([]);

    const [error, setError] = useState<string>("");
    const [ok, setOk] = useState<string>("");


    /**
     @brief Look if the input value starts as the same as other emails from the same organization
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

    const { id } = useParams();
    const [context, setContext] = useState<Context>()
    const [members, setMembers] = useState<Member[]>()

    const getOrgEmails = async (): Promise<void> => {
        const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/users", {
            method: "GET",
            headers
        });

        const data = await res.json();
        const orgEmails = data
            .filter((user : {"org" : {"id":number}}) => user["org"]["id"].toString() == id)
            .map((user : { email:string }) => user.email)
        setEmails(orgEmails);
        setFilteredEmails(orgEmails);
    }
    const getExistingContext = async () : Promise<void> => {
        try {

            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id, {
                method: "GET",
                headers,
            });
            if (res.ok) setContext(JSON.parse(await res.text()));
            else throw new Error("Could not find context");
        } catch (err) {
            console.log(err);
        }
    };
    const getContextMembers = async () : Promise<void> => {
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/members", {
                method: "GET",
                headers
            });
            if (res.ok) setMembers(JSON.parse(await res.text()));
            else throw new Error("Could not find members");
        } catch (err) {
            console.log(err);
        }
    };
    const addContextAdmin = async (userId : number) => {

        try {
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/admins", {
                method: "POST",
                headers,
                body: JSON.stringify({userId}),
            });
            if (res.ok) await getContextMembers();
            else throw new Error("Could not find members");
        } catch (err) {
            console.log(err);
        }
    }
    const removeContextAdmin = async (userId : number) => {
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/admins/" + userId , {
                method: "DELETE",
                headers
            });
            if (res.ok) await getContextMembers();
            else throw new Error("Could not find members");
        } catch (err) {
            console.log(err);
        }
    }

    async function emailSubmit(email:string) {
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/members", {
                method: "POST",
                headers,
                body: JSON.stringify({email}),
            });
            if (res.ok) setOk(`${ok}\nMember ${email} added.`)
            else setError(`${error}\nCannot add member ${email}`);

            getContextMembers();
        } catch (err) {
            throw err;
        } finally {
            // setEmail("")
        }
    }

    const removeContextMember = async (userId : number) => {
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/members/" + userId , {
                method: "DELETE",
                headers
            });
            if (res.ok) await getContextMembers();
            else throw new Error("Could not find members");
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        getExistingContext();
        getContextMembers();
        getOrgEmails();
    }, []);

    return (
        <div className="flex flex-col mt-5 h-screen max-w-2xl mx-auto ml-auto mr-auto text-black">
            <h1 className="text-4xl text-[#5E50A4]">{context?.name}</h1>
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
                        <p> {member.username}</p>
                        <div className="ml-auto">
                            <button className="drop-shadow-xl lg:w-auto p-4 rounded-[24px] bg-[#5E50A4] text-white hover:bg-violet-700 transition-colors"
                            onClick={() => removeContextAdmin(member.userId)}
                            >
                                ⬇ Set Member ⬇
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
                                  selectedEmails.map(email => emailSubmit(email));
                                  setSelectedEmails([]);
                              }}
                    >
                        <div className="flex w-full border border-[#5E50A4] rounded-[24px] p-4">
                            <AutoComplete
                                multiple
                                value={selectedEmails}
                                suggestions={filteredEmails}
                                completeMethod={search}
                                onChange={(e) => setSelectedEmails(e.value)}
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
                        <p>There is currently no regular member!</p>
                    </div>
                )}
                {members?.map((member: Member)  : false | React.JSX.Element => (
                    !member.contextAdmin &&
                    <div key={member.userId} className="flex flex-row items-center p-4 mb-4 border border-[#5E50A4] rounded-[24px]">
                        <p> {member.username}</p>
                        <div className="ml-auto">
                            <button className="drop-shadow-xl lg:w-auto p-4 mr-3 rounded-[24px] bg-[#5E50A4] text-white hover:bg-violet-700 transition-colors"
                                    onClick={() => addContextAdmin(member.userId)}
                            >
                                ⬆ Set Local Admin ⬆
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