import React from "react";

export default function MicrosoftOAuth({inviteToken} : {inviteToken?: string | null}) : React.JSX.Element | null {
    if(process.env.NEXT_PUBLIC_MICROSOFT_OAUTH_CLIENT_ID == null)
        return null;
    return (
        <a className="items-center justify-center p-4 flex mt-2 w-full h-[56px] rounded-[24px] bg-[#5E50A4] text-white hover:bg-violet-700 transition-colors"
           href={("").concat("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?",
                   `client_id=${process.env.NEXT_PUBLIC_MICROSOFT_OAUTH_CLIENT_ID}`,
                   "&response_type=code",
                   `&redirect_uri=${process.env.NEXT_PUBLIC_SITE_URL}/auth/microsoft`,
                   "&response_mode=query",
                   "&scope=openid%20profile%20email%20https%3A%2F%2Fgraph.microsoft.com%2Fuser.read",
                   inviteToken ? "&state=" + inviteToken : "")}>
            <img className="mr-4" src="https://learn.microsoft.com/en-us/entra/identity-platform/media/howto-add-branding-in-apps/ms-symbollockup_mssymbol_19.svg"/>
            <p>Login with Microsoft Account</p>
        </a>
    );
}