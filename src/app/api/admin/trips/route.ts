import { NextResponse } from "next/server"
import { proxyBackendRequest } from "@/lib/backend"

export const dynamic = "force-dynamic"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error"
}

export async function GET() {
  try {
    return await proxyBackendRequest("/api/admin/trips", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: unknown) {
    console.error("Admin trips proxy failed:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text()

    return await proxyBackendRequest("/api/admin/trips", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    })
  } catch (error: unknown) {
    console.error("Admin trip creation proxy failed:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 })
  }
}
