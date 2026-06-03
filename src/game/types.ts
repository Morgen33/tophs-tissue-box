/**
 * Result types for tissue_pulls.result_type
 * Maps to Supabase / Firebase enum or text column.
 */
export type ResultType =
  | 'free_booger'
  | 'snotlist'
  | 'golden_tissue'
  | 'empty_tissue'

/**
 * tissue_pulls table shape (backend-ready).
 *
 * CREATE TABLE tissue_pulls (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   email TEXT NOT NULL UNIQUE,
 *   wallet_address TEXT,
 *   result_type TEXT NOT NULL,
 *   result_message TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   claimed BOOLEAN DEFAULT false,
 *   claim_tx_hash TEXT
 * );
 */
export interface TissuePull {
  id: string
  email: string
  wallet_address: string | null
  result_type: ResultType
  result_message: string
  created_at: string
  claimed: boolean
  claim_tx_hash: string | null
}

export interface PrizeInventory {
  tissuesLeft: number
  freeBoogersLeft: number
  snotlistLeft: number
  goldenTissuesLeft: number
  emptyTissuesLeft: number
}

export interface PullResult {
  pull: TissuePull
  inventory: PrizeInventory
}

export type GamePhase =
  | 'landing'
  | 'pulling'
  | 'result'
  | 'already_pulled'
  | 'sold_out'
