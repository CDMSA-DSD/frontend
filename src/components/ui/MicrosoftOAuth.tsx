import React from "react";

export default function MicrosoftOAuth({inviteToken, newOrg = false} : {inviteToken?: string | null, newOrg?: boolean}) : React.JSX.Element | null {
    if(process.env.NEXT_PUBLIC_MICROSOFT_OAUTH_CLIENT_ID == null)
        return null;

    const microsoftAuthUrl = new URL(
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    );

    microsoftAuthUrl.search = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_MICROSOFT_OAUTH_CLIENT_ID,
        response_type: "code",
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/microsoft`,
        response_mode: "query",
        scope: "openid profile email https://graph.microsoft.com/user.read",
        ...(inviteToken && { state: inviteToken }),
        ...(newOrg && {state: newOrg ? "newOrg" : ""})
    }).toString();


    return (
        <a className="items-center justify-center p-4 flex mt-2 w-full h-[56px] rounded-[24px] bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover transition-colors"
           href={microsoftAuthUrl.toString()}>
            <img className="mr-4" src="https://learn.microsoft.com/en-us/entra/identity-platform/media/howto-add-branding-in-apps/ms-symbollockup_mssymbol_19.svg"/>
            <p>{newOrg ? "Register" : "Login"} with Microsoft Account</p>
        </a>
    );
}