import React from "react";

export default function okBanner({text}:{text:string | null}): React.JSX.Element{
    return (
        <>
            {text && (
                <div
                    role="alert"
                    className="mb-4 flex items-start justify-between rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-red-700"
                >
                    <p className="text-sm font-medium whitespace-pre-line">{text.trim()}</p>
                </div>
            )}
        </>
    )
}