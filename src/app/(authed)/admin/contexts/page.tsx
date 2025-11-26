"use client"

import React, {useEffect, useState} from "react";
import Background from "@/components/background"
import Link from "next/link";
import ErrorBanner from "@/components/ui/errorBanner"
import fetcher from "@/src/lib/fetcher"

export default function Contexts(): React.JSX.Element {
    type ContextType = {
        "id": number,
        "organizationId": number,
        "name": string,
        "type": string,
        "description": string
    }

    const [showNewContextModal, setShowNewContextModal] = useState(false);
    const [contextList, setContextList] = useState<ContextType[] | null>(null);

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

    return (
        <div className="min-h-screen p-8 items-center justify-between mb-4 text-black">
            <Background/>
            <div className="mb-4">
                <h1 className="mb-8 text-4xl font-bold text-foreground text-gray-900 max-w-3xl">Manage the organization's contexts here</h1>
            </div>
            <div className="display flex flex-col gap-4 max-w-2/3">
                {contextList?.sort((a, b) => a.id - b.id).map((item: ContextType) => (
                    <div key={item.id} className="border p-5 gap-5 border-[#5E50A4] rounded-[24px]">
                        <div className="flex flex-row items-center">
                            <Link href={"/admin/contexts/" + item.id}><h2
                                className="text-3xl text-[#5E50A4]">{item.name}</h2></Link>
                            {item.type && (<p className=" ml-3"> Type : {item.type}</p>)}
                        </div>
                        <p className="text-2xl"> {item.description}</p>
                    </div>
                ))}
            </div>
            <button className="mt-2 mx-auto p-4 h-[56px] rounded-[24px] bg-[#5E50A4] text-white"
                    onClick={() => setShowNewContextModal(true)}>
                Add a new context
            </button>
            <NewContextModal open={showNewContextModal} onClose={() => setShowNewContextModal(false)}/>
        </div>
    );



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
                    const data : {message:string} = await res.json()
                    setErrorMessage(data.message)
                }else{
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
                                    setFormData((prev) => ({...prev, name: e.target.value}))
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
                                    setFormData((prev) => ({...prev, type: e.target.value}))
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