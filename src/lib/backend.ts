const FALLBACK_BACKEND_URL = "https://tourist-backend-acsb.onrender.com"

export function getBackendUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || FALLBACK_BACKEND_URL).replace(/\/+$/, "")
}

export async function fetchBackendJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getBackendUrl()}${path}`, {
    ...init,
    cache: init.cache ?? "no-store",
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  })

  const contentType = response.headers.get("content-type") || ""
  const rawBody = await response.text()

  if (!response.ok) {
    const detail = rawBody ? `: ${rawBody.slice(0, 160)}` : ""
    throw new Error(`Backend returned ${response.status}${detail}`)
  }

  if (!rawBody) {
    return null as T
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(`Expected JSON from backend but received ${contentType || "unknown content type"}`)
  }

  try {
    return JSON.parse(rawBody) as T
  } catch {
    throw new Error("Backend returned invalid JSON")
  }
}
