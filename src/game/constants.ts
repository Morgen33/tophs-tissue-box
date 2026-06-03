import type { ResultType } from './types'

/** Fixed global prize limits (250 total pulls). */
export const PRIZE_LIMITS: Record<ResultType, number> = {
  free_booger: 100,
  snotlist: 25,
  golden_tissue: 5,
  empty_tissue: 120,
}

export const TOTAL_PULLS = 250

export const HEADLINE = "Toph's Tissue Box"
export const SUBLINE = '250 tissues. 100 free Boogers hidden inside. One pull per person.'

export const PULL_BUTTON_LABELS = [
  'Pull a Tissue',
  'Pick Your Booger',
  'Reach Into the Box',
  'Test Your Finger Luck',
] as const

export const EMPTY_TISSUE_MESSAGES = [
  'Dry Tissue.',
  'No Booger this time.',
  'The box rejected your finger.',
  'Almost picked one.',
  'Just a crusty pull.',
  'You got sniffed.',
  'Empty snot.',
  'The Booger dodged you.',
] as const

export const RESULT_COPY: Record<
  ResultType,
  { title: string; followUp: string; shareText: string }
> = {
  free_booger: {
    title: 'You pulled a free Booger.',
    followUp: 'Connect your wallet to claim your Booger.',
    shareText: "I just pulled a free Booger from Toph's Tissue Box.",
  },
  snotlist: {
    title: 'You pulled a Snotlist spot.',
    followUp:
      'You did not get a free Booger this round, but you made the list for future drops and bonuses.',
    shareText: "I pulled a Snotlist spot from Toph's Tissue Box.",
  },
  golden_tissue: {
    title: 'You pulled a Golden Tissue.',
    followUp:
      'This is one of the rarest pulls in the box. You unlocked a special bonus.',
    shareText: "I pulled a Golden Tissue from Toph's Tissue Box.",
  },
  empty_tissue: {
    title: '',
    followUp: '',
    shareText:
      "I reached into Toph's Tissue Box and got absolutely nothing.",
  },
}
