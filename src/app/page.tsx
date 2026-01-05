"use client"

import Background from "../components/background";
import ErrorBanner from "../components/ui/errorBanner";
import React, {FormEvent, Suspense, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import MicrosoftOAuth from "@/components/ui/MicrosoftOAuth";
import {setLoginSession} from "@/lib/utils";
import {NewOrganizationFormData} from "@/lib/types";

export default function Home(): React.JSX.Element {
    function ErrorFromSearchParams() : React.JSX.Element {
        const searchParams = useSearchParams();
        const error : string | null = searchParams.get("error");
        return <ErrorBanner text={error} />;
    }

    const [showNewOrganizationModal, setShowNewOrganizationModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    return (
        <div style={{backgroundColor: "white", height: "100vh"}}>
            <Background/>
            <Suspense fallback={null}>
                <ErrorFromSearchParams/>
            </Suspense>
            <div className="flex flex-col gap-4 justify-center items-center h-screen max-w-2xl mx-auto">
                {/* Made with Figma */}
                <svg width="131" height="96" viewBox="0 0 131 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.6">
                        <line y1="-1.50402" x2="26.6757" y2="-1.50402"
                              transform="matrix(0.72131 -0.692613 0.691627 0.722255 44.282 82.0857)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="46.9282" y2="-1.50402"
                              transform="matrix(0.999747 0.022497 -0.0224356 0.999748 13.9697 54.8997)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="46.6837" y2="-1.50402"
                              transform="matrix(0.671888 0.740653 -0.739738 0.672895 33.4744 15.0444)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="38.7414" y2="-1.50402"
                              transform="matrix(0.646343 -0.763047 0.762175 0.647372 74.3296 50.6768)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="41.2294" y2="-1.50402"
                              transform="matrix(0.990922 0.134438 -0.134077 0.990971 76.9661 58.8589)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="40.2477" y2="-1.50402"
                              transform="matrix(0.464978 -0.885322 0.884798 0.465975 10.0161 50.6768)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <ellipse cx="99.3709" cy="19.7956" rx="9.22536" ry="9.23798" fill="#8eb4eeff"/>
                        <ellipse cx="119.798" cy="64.2695" rx="11.2022" ry="11.2175" fill="#83afd5ff"/>
                        <ellipse cx="69.8488" cy="54.8997" rx="13.1791" ry="13.1971" fill="#256a98ff"/>
                        <ellipse cx="30.3118" cy="10.5577" rx="10.5433" ry="10.5577" fill="#89befaff"/>
                        <ellipse cx="9.88431" cy="52.9199" rx="9.88431" ry="9.89783" fill="#63a2bfff"/>
                        <ellipse cx="39.01" cy="86.5729" rx="9.22536" ry="9.23798" fill="#5691daff"/>
                    </g>
                </svg>

                <h1 className="text-8xl text-cdmsa-text-primary font-bold">Welcome</h1>
                <h2 className="text-xl text-cdmsa-text-primary text-center">A service that keep all your organizations architectural issues and discussions on a RFC and your decisions in an ADR.</h2>
                <h3 className="text-1xl text-cdmsa-text-secondary text-center">Get started by creating a new organization or
                    logging into your account.</h3>
                <div className="flex gap-3">
                    <button className="drop-shadow-xl lg:w-[270px] h-[60px] rounded-[24px] bg-cdmsa-primary text-white hover:cdmsa-primary-hover transition-colors"
                            onClick={() => setShowNewOrganizationModal(true)}>
                        Create an Organization
                    </button>
                    <button
                        className="drop-shadow-xl lg:w-[270px] h-[60px] rounded-[24px] text-cdmsa-text-primary bg-cdmsa-secondary "
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
        // On successful registration we close this modal and open the login modal.
        const [step, setStep] = useState<1 | 2>(1);
        const [submitting, setSubmitting] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [formData, setFormData] = useState<NewOrganizationFormData>(
            {
                orgName: '',
                orgDomain: '',
                orgDescription: '',

                adminFirstName: '',
                adminLastName: '',
                adminEmail: '',
                adminPassword: '',
                adminPasswordConfirm: '',
            }
        );

        /**
         * TODO Make this version generic.
         * Handle the submit form and redirect to the dashboard if ok
         * @param e The form, must be used to prevent reloading
         *
         * @alpha
         */
        async function handleSubmit(e: FormEvent<HTMLFormElement>) {
            e.preventDefault(); // Prevent reloading
            try {
                setSubmitting(true);
                // Validate passwords match
                if (formData.adminPassword !== formData.adminPasswordConfirm) {
                    setError("Passwords do not match");
                    return;
                }

                const payload = {
                    org: {
                        companyName: formData.orgName,
                        domain: formData.orgDomain,
                        description: formData.orgDescription,
                    },
                    admin: {
                        firstname: formData.adminFirstName,
                        lastname: formData.adminLastName,
                        email: formData.adminEmail,
                        password: formData.adminPassword,
                    },
                };

                const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/register-org", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Server Error");

                // Close the create-organization modal and open the login modal
                onClose();
                setShowLoginModal(true);
                setStep(1);
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
                        className="w-[560px] rounded-[24px] bg-white border border-cdmsa-border shadow-2xl p-10"
                        onClick={(e) => e.stopPropagation() /* Because parent div close the modal */}
                    >
                        <h2 className="text-3xl font-bold text-center text-black">
                            Create an Organization
                        </h2>

                        {/* "2 pages" controlled by a useState ([step, setStep]*/}
                        {step === 1 && (
                            <div>
                                <p className="mt-3 text-center font-semibold text-cdmsa-text-primary">
                                    Create your admin account first
                                </p>
                                <div className="mt-5 h-3 w-full rounded-full bg-[#D9D9D9] overflow-hidden">
                                    <div
                                        className="h-3 bg-cdmsa-primary"
                                        style={{width: "55%"}}
                                    />
                                </div>

                                <form
                                    className="mt-6 flex flex-col gap-5 text-black"
                                    onSubmit={ (e) => {e.preventDefault(); setStep(2)}}
                                >
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-semibold text-black mb-1">
                                                First name
                                            </label>
                                            <input
                                                type="text" required
                                                value={formData.adminFirstName}
                                                onChange={(e) => {
                                                    setError(null);
                                                    setFormData({...formData, adminFirstName: e.currentTarget.value})
                                                }}
                                                className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                                                placeholder="John"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-semibold text-black mb-1">
                                                Surname
                                            </label>
                                            <input
                                                type="text" required
                                                value={formData.adminLastName}
                                                onChange={(e) => {
                                                    setError(null);
                                                    setFormData({...formData, adminLastName: e.currentTarget.value})
                                                }}
                                                className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email" required
                                            value={formData.adminEmail}
                                            onChange={(e) => {
                                                setError(null);
                                                setFormData({
                                                    ...formData,
                                                    adminEmail: e.currentTarget.value,
                                                });
                                            }}
                                            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Password
                                        </label>
                                        <input
                                            type="password" required
                                            value={formData.adminPassword}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                adminPassword: e.currentTarget.value
                                            })}
                                            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                                            placeholder="********"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password" required
                                            value={formData.adminPasswordConfirm}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                adminPasswordConfirm: e.currentTarget.value
                                            })}
                                            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                                            placeholder="********"
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-sm text-red-600">{error}</p>
                                    )}

                                    <button
                                        type="submit"
                                        className="mt-2 w-full h-[56px] rounded-[24px] bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover transition-colors"
                                    >
                                        Next
                                    </button>
                                </form>
                                <MicrosoftOAuth newOrg={true}/>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <p className="mt-3 text-center font-semibold text-black">
                                    Enter your organization details
                                </p>
                                <div className="mt-5 h-3 w-full rounded-full bg-[#D9D9D9] overflow-hidden flex">
                                    <div
                                        className="h-3 bg-cdmsa-primary ml-auto"
                                        style={{width: "55%"}}
                                    />
                                </div>

                                <form
                                    className="mt-6 flex flex-col gap-5 text-black"
                                    onSubmit={handleSubmit}
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Company name
                                        </label>
                                        <input
                                            type="text" required
                                            value={formData.orgName}
                                            onChange={(e) =>
                                                setFormData({...formData, orgName: e.currentTarget.value})
                                            }
                                            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                                            placeholder="A company"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Domain
                                        </label>
                                        <input
                                            type="text" required
                                            value={formData.orgDomain}
                                            onChange={(e) =>
                                                setFormData({...formData, orgDomain: e.currentTarget.value})
                                            }
                                            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
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
                                            className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                                            rows={3}
                                            placeholder="Short description"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            className="flex-1 h-[56px] rounded-[24px] bg-cdmsa-primary text-white hover:cdmsa-primary-hover transition-colors"
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
            username: string
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
        async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
            e.preventDefault(); // Prevent reloading
            try {
                // backend expects { email, password }
                const payload = { email: formData.username, password: formData.password };

                const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/login", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(text || "Server error");
                }

                // Persist auth info (token + user + roles) for other parts of the app
                setLoginSession(await res.json());

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
                    onClick={() => onClose()}>
                    <div
                        className="w-[560px] rounded-[24px] bg-white border border-cdmsa-border shadow-2xl p-20"
                        onClick={(e) => e.stopPropagation()  /* Because parent div close the modal */}
                    >
                        <h2 className="text-3xl font-bold text-center text-black">
                            Login
                        </h2>
                        <form
                            onSubmit={handleSubmit}
                            className="mt-6 flex flex-col gap-5 text-black"
                        >
                            <div>
                                <label className="block text-sm font-semibold text-black mb-1">
                                        Email
                                </label>
                                <input
                                    type="text" required
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                                    className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-black mb-1">
                                    Password
                                </label>
                                <input
                                    type="password" required
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                                    className="w-full rounded-[10px] border border-cdmsa-border px-4 py-3 outline-none focus:ring-2 focus:ring-cdmsa-border"
                                    placeholder="********"
                                />
                            </div>

                            <button
                                type="submit"
                                className="mt-2 w-full h-[56px] rounded-[24px] bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover transition-colors"
                            >
                                Login
                            </button>
                            <MicrosoftOAuth/>
                            <div className="flex items-center justify-between text-sm w-full">
                                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-400 text-cdmsa-text-primary focus:ring-cdmsa-text-primary "
                                    />
                                    <span className="text-cdmsa-text-primary">Remember me</span>
                                </label>

                                <a href="/forgot-password" className="text-cdmsa-text-primary hover:underline">
                                    Forgot Password?
                                </a>
                            </div>
                            <p className="text-sm text-center mt-4">
                                <a href="#" onClick={() => {
                                    onClose();
                                    setShowNewOrganizationModal(true)
                                }} className="text-cdmsa-text-primary font-semibold hover:underline">
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
