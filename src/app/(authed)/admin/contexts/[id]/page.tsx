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
    const [members, setMembers] = useState<Member[]>([])

    /**
     * @brief Get all emails from the organization of the current [id] context in order to suggest them when adding a new context member
     */
    const getOrgEmails = async (orgId : number): Promise<void> => {
        const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/users");

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


     return (
    <div className="max-w-5xl mx-auto p-8 text-black">
      <ErrorBanner text={error} />
      <OkBanner text={ok} />

      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#5E50A4]">
            {context?.name}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {context?.type} · {context?.description}
          </p>
        </div>

        <button
          onClick={deleteContextById}
          className="h-[40px] px-4 rounded-[20px] border border-red-500 text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {/* ADD MEMBERS */}
      <div className="bg-white border rounded-[24px] p-4 mb-6">
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setOk("");
            selectedEmails.forEach(addContextMember);
            setSelectedEmails([]);
          }}
        >
          <AutoComplete
            multiple
            value={selectedEmails}
            suggestions={filteredEmails}
            completeMethod={search}
            onChange={(e) => setSelectedEmails(e.value)}
            className="w-full"
          />

          <button className="h-[48px] px-6 rounded-[24px] bg-[#5E50A4] text-white">
            Add
          </button>
        </form>
      </div>

      {/* MEMBERS LIST */}
      <div className="bg-white border rounded-[24px] divide-y">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center px-6 py-4"
          >
            <div>
              <p className="font-medium">{member.email}</p>
              {member.contextAdmin && (
                <span className="text-xs font-semibold text-[#5E50A4]">
                  Context admin
                </span>
              )}
            </div>

            <div className="ml-auto flex gap-4">
              {member.contextAdmin ? (
                <button
                  onClick={() => removeContextAdmin(member.userId)}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Demote
                </button>
              ) : (
                <button
                  onClick={() => addContextAdmin(member.userId)}
                  className="text-sm text-[#5E50A4] hover:underline"
                >
                  Promote
                </button>
              )}

              <button
                onClick={() => removeContextMember(member.userId)}
                className="text-sm text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}