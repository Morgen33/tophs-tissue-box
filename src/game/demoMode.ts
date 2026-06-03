/**
 * Demo mode for previews — add ?demo=1 to the URL.
 * Example: http://localhost:3002/?demo=1
 *
 * - No email required
 * - Unlimited pulls (unique demo email per pull)
 * - Separate localStorage from the real game
 */
export function isDemoMode(): boolean {
  const params = new URLSearchParams(window.location.search)
  const demo = params.get('demo')
  return demo === '1' || demo === 'true' || demo === 'yes'
}

/** Unique throwaway email per demo pull so one-pull-per-email never blocks. */
export function createDemoPullEmail(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@toph.preview`
}

export function getDemoModeUrl(): string {
  const url = new URL(window.location.href)
  url.searchParams.set('demo', '1')
  return url.toString()
}
