import { PRIZE_LIMITS, TOTAL_PULLS } from './constants'
import type { PrizeInventory, ResultType } from './types'

/** Build the full shuffled prize deck (250 entries). */
export function createInitialPool(): ResultType[] {
  const pool: ResultType[] = []
  for (const [type, count] of Object.entries(PRIZE_LIMITS) as [
    ResultType,
    number,
  ][]) {
    for (let i = 0; i < count; i++) pool.push(type)
  }
  shuffle(pool)
  return pool
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

export function inventoryFromPool(pool: ResultType[]): PrizeInventory {
  const counts = {
    free_booger: 0,
    snotlist: 0,
    golden_tissue: 0,
    empty_tissue: 0,
  }
  for (const t of pool) counts[t]++
  return {
    tissuesLeft: pool.length,
    freeBoogersLeft: counts.free_booger,
    snotlistLeft: counts.snotlist,
    goldenTissuesLeft: counts.golden_tissue,
    emptyTissuesLeft: counts.empty_tissue,
  }
}

export function drawFromPool(pool: ResultType[]): ResultType | null {
  if (pool.length === 0) return null
  const index = Math.floor(Math.random() * pool.length)
  return pool.splice(index, 1)[0]
}

export function isSoldOut(pool: ResultType[]): boolean {
  return pool.length === 0
}

export function maxVisualStack(): number {
  return Math.min(7, TOTAL_PULLS)
}
