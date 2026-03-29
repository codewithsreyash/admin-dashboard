import type { DashboardTourist } from "@/lib/dashboard-types"

export const STALE_SIGNAL_THRESHOLD_MS = 3 * 60 * 1000
export const SIGNAL_REFRESH_INTERVAL_MS = 30 * 1000

export type TouristSignalState = "live" | "stale"

function toTimestampMs(value?: string | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  const timestampMs = new Date(value).getTime()
  return Number.isFinite(timestampMs) ? timestampMs : null
}

export function formatSignalAge(ageMs: number | null) {
  if (ageMs === null) {
    return "unknown"
  }

  if (ageMs < 30 * 1000) {
    return "just now"
  }

  if (ageMs < 60 * 1000) {
    return "<1m ago"
  }

  if (ageMs < 60 * 60 * 1000) {
    return `${Math.floor(ageMs / (60 * 1000))}m ago`
  }

  if (ageMs < 24 * 60 * 60 * 1000) {
    return `${Math.floor(ageMs / (60 * 60 * 1000))}h ago`
  }

  return `${Math.floor(ageMs / (24 * 60 * 60 * 1000))}d ago`
}

export function getTouristSignalMeta(tourist: DashboardTourist, nowMs = Date.now()) {
  const lastPingMs = toTimestampMs(tourist.lastPing)
  const ageMs = lastPingMs === null ? null : Math.max(0, nowMs - lastPingMs)
  const isStale = ageMs === null || ageMs >= STALE_SIGNAL_THRESHOLD_MS
  const state: TouristSignalState = isStale ? "stale" : "live"
  const ageLabel = formatSignalAge(ageMs)

  return {
    state,
    isStale,
    ageMs,
    ageLabel,
    lastPingLabel: lastPingMs === null ? "Signal timestamp unavailable" : new Date(lastPingMs).toLocaleString(),
    badgeLabel: isStale ? `Signal Lost${ageMs === null ? "" : ` - ${ageLabel}`}` : `Live - ${ageLabel}`,
    detailLabel: isStale ? `Last seen ${ageLabel}` : `Last ping ${ageLabel}`,
  }
}

export function compareTouristsBySignal(left: DashboardTourist, right: DashboardTourist, nowMs = Date.now()) {
  const leftSignal = getTouristSignalMeta(left, nowMs)
  const rightSignal = getTouristSignalMeta(right, nowMs)

  if (leftSignal.isStale !== rightSignal.isStale) {
    return leftSignal.isStale ? 1 : -1
  }

  const leftAge = leftSignal.ageMs ?? Number.POSITIVE_INFINITY
  const rightAge = rightSignal.ageMs ?? Number.POSITIVE_INFINITY
  return leftAge - rightAge
}
