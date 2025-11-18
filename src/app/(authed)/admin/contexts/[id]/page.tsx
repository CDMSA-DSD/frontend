"use client"

import React, {useEffect, useState} from "react";
import {useParams} from "next/navigation";

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

    const { id } = useParams();
    const [context, setContext] = useState<Context>()
    const [members, setMembers] = useState<Member[]>()

    const getExistingContext = async () => {
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id, {
                method: "GET",
                headers: {
                    "X-User-Id": "1",
                },
            });
            if (res.ok) setContext(JSON.parse(await res.text()));
            else throw new Error("Could not find context");
        } catch (err) {
            console.log(err);
        }
    };

    const getContextMembers = async () => {
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/members", {
                method: "GET",
                headers: {
                    "X-User-Id": "1",
                },
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
                headers: {
                    "X-User-Id": "1",
                    "Content-Type": "application/json",
                },
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
                headers: {
                    "X-User-Id": "1",
                    "Content-Type": "application/json",
                },
            });
            if (res.ok) await getContextMembers();
            else throw new Error("Could not find members");
        } catch (err) {
            console.log(err);
        }
    }
    const removeContextMember = async (userId : number) => {
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/contexts/" + id + "/members/" + userId , {
                method: "DELETE",
                headers: {
                    "X-User-Id": "1",
                    "Content-Type": "application/json",
                },
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