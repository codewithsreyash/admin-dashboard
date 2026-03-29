import { NextResponse } from "next/server"
import { proxyBackendRequest } from "@/lib/backend"

export const dynamic = "force-dynamic"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error"
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const body = await req.text()

    return await proxyBackendRequest(`/api/admin/trips/${encodeURIComponent(tripId)}/tourists`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    })
  } catch (error: unknown) {
    console.error("Admin trip assignment proxy failed:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 })
  }
}
