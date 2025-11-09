"use client"

import Background from "../components/background"
import React, {useState} from "react";
import {useRouter} from "next/navigation";
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function Home(): React.JSX.Element {
    const [showNewOrganizationModal, setShowNewOrganizationModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    return (
        <div style={{backgroundColor: "white", height: "100vh"}}>
            <Background/>

            <div className="flex flex-col gap-4 justify-center items-center h-screen max-w-2xl mx-auto">
                {/* Made with Figma */}
                <svg width="131" height="96" viewBox="0 0 131 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.6">
                        <line y1="-1.50402" x2="26.6757" y2="-1.50402"
                              transform="matrix(0.72131 -0.692613 0.691627 0.722255 44.282 82.0857)" stroke="#625B71"
                              stroke-opacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="46.9282" y2="-1.50402"
                              transform="matrix(0.999747 0.022497 -0.0224356 0.999748 13.9697 54.8997)" stroke="#625B71"
                              stroke-opacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="46.6837" y2="-1.50402"
                              transform="matrix(0.671888 0.740653 -0.739738 0.672895 33.4744 15.0444)" stroke="#625B71"
                              stroke-opacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="38.7414" y2="-1.50402"
                              transform="matrix(0.646343 -0.763047 0.762175 0.647372 74.3296 50.6768)" stroke="#625B71"
                              stroke-opacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="41.2294" y2="-1.50402"
                              transform="matrix(0.990922 0.134438 -0.134077 0.990971 76.9661 58.8589)" stroke="#625B71"
                              stroke-opacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="40.2477" y2="-1.50402"
                              transform="matrix(0.464978 -0.885322 0.884798 0.465975 10.0161 50.6768)" stroke="#625B71"
                              stroke-opacity="0.47" strokeWidth="3.00805"/>
                        <ellipse cx="99.3709" cy="19.7956" rx="9.22536" ry="9.23798" fill="#AEA9E8"/>
                        <ellipse cx="119.798" cy="64.2695" rx="11.2022" ry="11.2175" fill="#C4B7FF"/>
                        <ellipse cx="69.8488" cy="54.8997" rx="13.1791" ry="13.1971" fill="#5E50A4"/>
                        <ellipse cx="30.3118" cy="10.5577" rx="10.5433" ry="10.5577" fill="#A67DFF"/>
                        <ellipse cx="9.88431" cy="52.9199" rx="9.88431" ry="9.89783" fill="#6A63BF"/>
                        <ellipse cx="39.01" cy="86.5729" rx="9.22536" ry="9.23798" fill="#5658DA"/>
                    </g>
                </svg>

                <h1 className="text-8xl text-black font-bold">Welcome</h1>

                <h2 className="text-3xl text-[#625B71] text-center">Get started by creating a new organization or
                    logging into your account</h2>
                <div className="flex gap-3">
                    <button className="drop-shadow-xl lg:w-[407px] h-[85px] rounded-[24px] bg-[#5E50A4] text-white"
                            onClick={() => setShowNewOrganizationModal(true)}>
                        Create an Organization
                    </button>
                    <button
                        className="drop-shadow-xl lg:w-[245px] h-[85px] rounded-[24px] text-[#4F378A] bg-[#DFDDFF]"
                        onClick={() => setShowLoginModal(true)}
                    >Login
                    </button>
                </div>
            </div>
            <NewOrganizationModal open={showNewOrganizationModal} onClose={() => setShowNewOrganizationModal(false)}/>
            <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)}/>
        </div>
    );

    function NewOrganizationModal({open, onClose}: { open: boolean; onClose: () => void; })
        : React.JSX.Element | null {
        const router: AppRouterInstance = useRouter();

        type NewOrganizationFormData = {
            orgName: string,
            orgDomain: string,
            orgDescription: string,

            adminName: string,
            adminUsername: string,
            adminEmail: string,
            adminPassword: string,
        };

        const [step, setStep] = useState<1 | 2>(1);
        const [submitting, setSubmitting] = useState(false);
        const [formData, setFormData] = useState<NewOrganizationFormData>(
            {
                orgName: '',
                orgDomain: '',
                orgDescription: '',

                adminName: '',
                adminUsername: '',
                adminEmail: '',
                adminPassword: '',
            }
        );

        async function handleSubmit() {
            try {
                setSubmitting(true);
                console.log(process.env.NEXT_PUBLIC_BACKEND_URL + "/orgs")
                const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/orgs", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(formData),
                });
                if (!res.ok) throw new Error("Erreur serveur");
                console.log("✅ Données envoyées :", formData);

                router.push("/dashboard");
            } catch (err) {
                console.error(err);
            } finally {
                setSubmitting(false);
            }
        }

        if (!open) return null
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md "
                    onClick={() => {
                        onClose();
                        setStep(1);
                    }}
                >
                    <div
                        className="w-[560px] rounded-[24px] bg-white border border-[#5E50A4] shadow-2xl p-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-3xl font-bold text-center text-black">
                            Create an Organization
                        </h2>

                        {step === 1 && (
                            <div>
                                <p className="mt-3 text-center font-semibold text-black">
                                    Create your admin account first
                                </p>
                                <div className="mt-5 h-3 w-full rounded-full bg-[#D9D9D9] overflow-hidden">
                                    <div
                                        className="h-3 bg-[#5E50A4]"
                                        style={{width: "55%"}}
                                    />
                                </div>

                                <form
                                    className="mt-6 flex flex-col gap-5 text-black"
                                    onSubmit={(e) => e.preventDefault() /* Because parent div close the modal */}
                                >
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-semibold text-black mb-1">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.adminName}
                                                onChange={(e) => {
                                                    setFormData({...formData, adminName: e.currentTarget.value})
                                                }}
                                                className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                                placeholder="John"
                                            />
                                        </div>
                                        {/* <div className="flex-1">
                                            <label className="block text-sm font-semibold text-black mb-1">
                                                Surname
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.adminName}
                                                onChange={(e) => setAdmin({ surname: e.target.value })}
                                                className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                                placeholder="Doe"
                                            />
                                        </div> */}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.adminEmail}
                                            onChange={(e) => {
                                                setFormData({...formData, adminEmail: e.currentTarget.value, adminUsername: e.currentTarget.value});
                                            }}
                                            className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.adminPassword}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                adminPassword: e.currentTarget.value
                                            })}
                                            className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                            placeholder="********"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        onClick={() => setStep(2)}
                                        className="mt-2 w-full h-[56px] rounded-[24px] bg-[#5E50A4] text-white"
                                    >
                                        Next
                                    </button>
                                </form>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <p className="mt-3 text-center font-semibold text-black">
                                    Enter your organization details
                                </p>
                                <div className="mt-5 h-3 w-full rounded-full bg-[#D9D9D9] overflow-hidden flex">
                                    <div
                                        className="h-3 bg-[#5E50A4] ml-auto"
                                        style={{width: "55%"}}
                                    />
                                </div>

                                <form
                                    className="mt-6 flex flex-col gap-5 text-black"
                                    onSubmit={(e) => e.preventDefault()}
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Company name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.orgName}
                                            onChange={(e) =>
                                                setFormData({...formData, orgName: e.currentTarget.value})
                                            }
                                            className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                            placeholder="A company"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Domain
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.orgDomain}
                                            onChange={(e) =>
                                                setFormData({...formData, orgDomain: e.currentTarget.value})
                                            }
                                            className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                            placeholder="example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.orgDescription}
                                            onChange={(e) =>
                                                setFormData({...formData, orgDescription: e.currentTarget.value})
                                            }
                                            className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                            rows={3}
                                            placeholder="Short description"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            className="flex-1 h-[56px] rounded-[24px] bg-[#5E50A4] text-white"
                                        >
                                            {submitting ? "Creating..." : "Create Organization"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    function LoginModal({open, onClose}: { open: boolean; onClose: () => void; })
        : React.JSX.Element | null {
        const router = useRouter();
        type LoginFormData = {
            // email: string; // is not used yet.
            username:string
            password: string;
            remember: boolean;
        }

        /**
         * TODO Make this version generic.
         * Handle the submit form and redirect to the dashboard if ok
         * @param e The form, must be used to prevent reloading
         *
         * @alpha
         */
        async function handleSubmit() {
            try {
                const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/users/login", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(formData),
                });
                if (!res.ok) throw new Error("Erreur serveur");
                console.log("✅ Données envoyées :", formData);

                router.push("/dashboard");
            } catch (err) {
                console.error(err);
            }
        }


        const [formData, setFormData] = useState<LoginFormData>({username: "", password: "", remember: false});
        if (!open) return null
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md "
                    onClick={() => onClose()}
                >
                    <div
                        className="w-[560px] rounded-[24px] bg-white border border-[#5E50A4] shadow-2xl p-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-3xl font-bold text-center text-black">
                            Login
                        </h2>
                        <form
                            className="mt-6 flex flex-col gap-5 text-black"
                            onSubmit={(e) => e.preventDefault() /* Because parent div close the modal */}
                        >
                            <div>
                                <label className="block text-sm font-semibold text-black mb-1">
                                    Username {/* TODO FIX FROM BACKEND IT SHOULD BE EMAIL !*/}
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                                    className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-black mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                                    className="w-full rounded-[10px] border border-[#5E50A4] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5E50A4]"
                                    placeholder="********"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => handleSubmit()}
                                className="mt-2 w-full h-[56px] rounded-[24px] bg-[#5E50A4] text-white"
                            >
                                Login
                            </button>
                            <div className="flex items-center justify-between text-sm w-full">
                                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-400 text-[#5E50A4] focus:ring-[#5E50A4]"
                                    />
                                    <span className="text-black">Remember me</span>
                                </label>

                                <a href="/forgot-password" className="text-[#5E50A4] hover:underline">
                                    Forgot Password?
                                </a>
                            </div>
                            <p className="text-sm text-center mt-4">
                                <a href="#" onClick={() => {onClose(); setShowNewOrganizationModal(true)}} className="text-[#5E50A4] font-semibold hover:underline">
                                    Create an Organization instead
                                </a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}
