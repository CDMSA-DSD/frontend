import React from "react";

export default function background(): React.JSX.Element {
    return (
        <>
            <div>
                <div style={{backgroundColor: "#A9B1E8", opacity: "24%"}}
                     className="fixed right-0 top-0 w-[586px] h-[545px] rounded-full translate-x-1/3 -translate-y-1/3">
                </div>
                <div style={{backgroundColor: "#3300FF", opacity: "11%"}}
                     className="fixed left-0 bottom-0 w-[327px] h-[323px] rounded-full -translate-x-1/2 translate-y+1/2">
                </div>
            </div>
        </>
    )
}