import { EMPTY_TISSUE_MESSAGES, RESULT_COPY } from './constants'
import { createDemoPullEmail, isDemoMode } from './demoMode'
import {
  commitPullRecord,
  drawRandomFromStore,
  findPullByEmail,
  getInventory,
  hasEmailPulled,
  isValidEmail,
  isWalletUsed,
  normalizeEmail,
  updatePullClaim,
} from './storage'
import type { PullResult, ResultType, TissuePull } from './types'

function randomEmptyMessage(): string {
  return EMPTY_TISSUE_MESSAGES[
    Math.floor(Math.random() * EMPTY_TISSUE_MESSAGES.length)
  ]
}

function makeId(): string {
  return `pull_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function resultMessage(type: ResultType): string {
  if (type === 'empty_tissue') return randomEmptyMessage()
  return RESULT_COPY[type].title
}

/**
 * MOCK pull — draws locally from remainingPool.
 *
 * PRODUCTION: replace body with:
 *   const res = await fetch('/api/pull', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ email }),
 *   })
 *   if (!res.ok) throw new Error(await res.text())
 *   return res.json() as PullResult
 *
 * Server must:
 * - validate email
 * - enforce one pull per email (DB unique constraint)
 * - atomically draw from server-side pool (transaction / row lock)
 * - return { pull, inventory } — never trust client randomness
 */
export async function executePull(email: string): Promise<PullResult> {
  const normalized = isDemoMode()
    ? createDemoPullEmail()
    : normalizeEmail(email)

  if (!isDemoMode()) {
    if (!isValidEmail(normalized)) {
      throw new Error('Enter a valid email.')
    }

    if (hasEmailPulled(normalized)) {
      const existing = findPullByEmail(normalized)!
      return { pull: existing, inventory: getInventory() }
    }
  }

  // Simulate network latency — remove in production or keep minimal
  await new Promise((r) => setTimeout(r, 120))

  const inventory = getInventory()
  if (inventory.tissuesLeft <= 0) {
    throw new Error('All tissues have been pulled. The box is empty.')
  }

  // MOCK draw — MUST move to server function in production
  const drawn = drawRandomFromStore()
  if (!drawn) throw new Error('No prizes left in the box.')

  const pull: TissuePull = {
    id: makeId(),
    email: normalized,
    wallet_address: null,
    result_type: drawn,
    result_message: resultMessage(drawn),
    created_at: new Date().toISOString(),
    claimed: false,
    claim_tx_hash: null,
  }

  commitPullRecord(pull)

  return { pull, inventory: getInventory() }
}

/**
 * MOCK wallet claim.
 *
 * PRODUCTION:
 *   await fetch('/api/claim', {
 *     method: 'POST',
 *     body: JSON.stringify({ pullId, walletAddress, signature }),
 *   })
 */
export async function claimWithWallet(
  pullId: string,
  walletAddress: string,
): Promise<TissuePull> {
  const wallet = walletAddress.trim()
  if (!wallet) throw new Error('Connect a wallet first.')

  if (!isDemoMode() && isWalletUsed(wallet)) {
    throw new Error('This wallet already claimed a Booger.')
  }

  await new Promise((r) => setTimeout(r, 80))

  const updated = updatePullClaim(pullId, wallet)
  if (!updated) throw new Error('Pull not found.')

  return updated
}

export function getResultDisplay(pull: TissuePull): {
  title: string
  followUp: string
  shareText: string
  needsWallet: boolean
} {
  const copy = RESULT_COPY[pull.result_type]
  const needsWallet = pull.result_type === 'free_booger' && !pull.claimed

  if (pull.result_type === 'empty_tissue') {
    return {
      title: pull.result_message,
      followUp: 'Better luck next drop. Your finger still smells like cardboard.',
      shareText: copy.shareText,
      needsWallet: false,
    }
  }

  return {
    title: copy.title,
    followUp: copy.followUp,
    shareText: copy.shareText,
    needsWallet,
  }
}
