import { NextResponse } from "next/server"
import { proxyBackendRequest } from "@/lib/backend"

export const dynamic = "force-dynamic"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error"
}

export async function GET() {
  try {
    return await proxyBackendRequest("/api/admin/tourists", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: unknown) {
    console.error("Admin tourist proxy failed:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 })
  }
}
