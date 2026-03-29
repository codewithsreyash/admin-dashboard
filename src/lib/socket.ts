import { io, type Socket } from "socket.io-client"
import { getBackendUrl } from "@/lib/backend"

let dashboardSocket: Socket | null = null

export const DASHBOARD_SOCKET_EVENTS = {
  adminJoinTripRoom: "admin_join_trip_room",
  locationUpdate: "location_update",
  newAlert: "new_alert",
  connected: "connected",
  error: "socket_error",
} as const

export function getDashboardSocket() {
  if (!dashboardSocket) {
    dashboardSocket = io(getBackendUrl(), {
      autoConnect: false,
      transports: ["websocket"],
      auth: {
        role: "admin",
        tripId: "ALL",
      },
    })
  }

  return dashboardSocket
}

export function disconnectDashboardSocket() {
  if (!dashboardSocket) {
    return
  }

  dashboardSocket.removeAllListeners()
  dashboardSocket.disconnect()
  dashboardSocket = null
}
