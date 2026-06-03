import { createInitialPool, inventoryFromPool } from './inventory'
import { isDemoMode } from './demoMode'
import type { PrizeInventory, ResultType, TissuePull } from './types'

const STORAGE_KEY = isDemoMode()
  ? 'tophs_boogers_demo_v1'
  : 'tophs_boogers_game_v1'
const SESSION_EMAIL_KEY = 'tophs_boogers_session_email'

/**
 * Mock persistence — replace with Supabase / Firebase / API.
 *
 * Backend should own:
 * - remaining prize pool (server-side only in production)
 * - tissue_pulls inserts
 * - email uniqueness constraint
 * - wallet uniqueness on claim
 */
export interface GameStore {
  remainingPool: ResultType[]
  pulls: TissuePull[]
}

function loadStore(): GameStore {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { remainingPool: createInitialPool(), pulls: [] }
  }
  try {
    const parsed = JSON.parse(raw) as GameStore
    if (!Array.isArray(parsed.remainingPool) || !Array.isArray(parsed.pulls)) {
      throw new Error('invalid store')
    }
    return parsed
  } catch {
    return { remainingPool: createInitialPool(), pulls: [] }
  }
}

function saveStore(store: GameStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

let store = loadStore()

export function getInventory(): PrizeInventory {
  return inventoryFromPool(store.remainingPool)
}

export function getAllPulls(): TissuePull[] {
  return [...store.pulls]
}

export function getRemainingPoolLength(): number {
  return store.remainingPool.length
}

export function findPullByEmail(email: string): TissuePull | undefined {
  const normalized = normalizeEmail(email)
  return store.pulls.find((p) => p.email === normalized)
}

export function hasEmailPulled(email: string): boolean {
  if (isDemoMode()) return false
  return !!findPullByEmail(email)
}

export function isDemoModeActive(): boolean {
  return isDemoMode()
}

export function isWalletUsed(wallet: string): boolean {
  const w = wallet.toLowerCase()
  return store.pulls.some(
    (p) => p.wallet_address && p.wallet_address.toLowerCase() === w,
  )
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))
}

/** Session hint so refresh shows same result (not a security boundary — server must enforce). */
export function getSessionEmail(): string | null {
  return sessionStorage.getItem(SESSION_EMAIL_KEY)
}

export function setSessionEmail(email: string): void {
  sessionStorage.setItem(SESSION_EMAIL_KEY, normalizeEmail(email))
}

/**
 * Random draw from remaining pool (mock server draw).
 * PRODUCTION: never call from frontend — server returns result_type.
 */
export function drawRandomFromStore(): ResultType | null {
  if (store.remainingPool.length === 0) return null
  const index = Math.floor(Math.random() * store.remainingPool.length)
  return store.remainingPool.splice(index, 1)[0]
}

/** Persist pull after server assigns result. MOCK: called right after drawRandomFromStore. */
export function commitPullRecord(pull: TissuePull): void {
  store.pulls.push(pull)
  saveStore(store)
}

export function updatePullClaim(
  pullId: string,
  walletAddress: string,
  claimTxHash: string | null = null,
): TissuePull | null {
  const pull = store.pulls.find((p) => p.id === pullId)
  if (!pull) return null
  pull.wallet_address = walletAddress
  pull.claimed = true
  if (claimTxHash) pull.claim_tx_hash = claimTxHash
  saveStore(store)
  return pull
}

/** Dev / admin reset */
export function resetGameStore(): void {
  store = { remainingPool: createInitialPool(), pulls: [] }
  saveStore(store)
  sessionStorage.removeItem(SESSION_EMAIL_KEY)
}

/** Refill demo box (demo mode only). */
export function resetDemoBox(): void {
  if (!isDemoMode()) return
  resetGameStore()
}

export function exportStoreForDebug(): GameStore {
  return {
    remainingPool: [...store.remainingPool],
    pulls: [...store.pulls],
  }
}
