const getAuthHeader = (): { Authorization: string } | null | undefined => {
  if (typeof window === "undefined") return undefined

  const stored = localStorage.getItem("auth")
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    const token = parsed?.token ?? ""
    if (!token) return null
    return { Authorization: `Bearer ${token}` }
  } catch (e) {
    return null
  }
}

export async function authFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const auth = getAuthHeader()
  const mergedInit: RequestInit = { ...(init ?? {}) }

  const initialHeaders = mergedInit.headers ?? {}
  const headers = new Headers(initialHeaders as HeadersInit)
  if (auth && auth.Authorization) {
    headers.set("Authorization", auth.Authorization)
  }
  mergedInit.headers = headers

  return fetch(input, mergedInit)
}

export default authFetch
