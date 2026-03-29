import { NextResponse } from "next/server"
import { proxyBackendRequest } from "@/lib/backend"

export const dynamic = "force-dynamic"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error"
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params

    return await proxyBackendRequest(`/api/admin/trips/${encodeURIComponent(tripId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: unknown) {
    console.error("Admin trip detail proxy failed:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const body = await req.text()

    return await proxyBackendRequest(`/api/admin/trips/${encodeURIComponent(tripId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    })
  } catch (error: unknown) {
    console.error("Admin trip update proxy failed:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 })
  }
}
