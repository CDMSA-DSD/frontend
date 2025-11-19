import React from "react";

export default function Banner({text}:{text:string}): React.JSX.Element{
    return (
        <>
            {text && (
                <div
                    role="alert"
                    className="mb-4 flex items-start justify-between rounded-lg border border-green-500 bg-green-50 px-4 py-3 text-green-700"
                >
                    <p className="text-sm font-medium">{text}</p>
                </div>
            )}
        </>
    )
}