import type { Goal, ScenarioAssumptions } from './types'

export const GOALS: Goal[] = [
  {
    id: 'goal-fi',
    name: 'Financial independence',
    icon: 'peak',
    targetAmount: 6_000_000,
    targetDate: '2040-01-01',
    currency: 'USD',
    currentFunding: 2_540_000,
    monthlyContribution: 9_800,
    onTrack: 'on_track',
    projectionNote:
      'At a 6.5% real return with current contributions, projected net worth reaches $6.1M by Jan 2040.',
    linkedAccounts: ['acc-fid', 'acc-schwab', 'acc-401k', 'acc-roth', 'acc-zerodha', 'acc-mf'],
  },
  {
    id: 'goal-college',
    name: 'College fund — Aanya',
    icon: 'book',
    targetAmount: 320_000,
    targetDate: '2036-08-01',
    currency: 'USD',
    currentFunding: 88_000,
    monthlyContribution: 1_100,
    onTrack: 'at_risk',
    projectionNote:
      'Projected at $291K by Aug 2036 — about 9% short. Raising contributions to $1,350/mo closes the gap.',
    adjustment: 'Increase monthly contribution by $250, or add half of next year’s RSU vest.',
    linkedAccounts: ['acc-schwab'],
  },
  {
    id: 'goal-himalaya',
    name: 'Sabbatical travel fund',
    icon: 'compass',
    targetAmount: 60_000,
    targetDate: '2028-06-01',
    currency: 'USD',
    currentFunding: 24_500,
    monthlyContribution: 900,
    onTrack: 'on_track',
    projectionNote: 'Fully funded by March 2028 at the current savings rate.',
    linkedAccounts: ['acc-marcus'],
  },
]

export const DEFAULT_ASSUMPTIONS: ScenarioAssumptions = {
  inflationPct: 2.6,
  usReturnPct: 6.8,
  inReturnPct: 10.5,
  incomeGrowthPct: 4.0,
  spendingGrowthPct: 3.0,
  retirementAge: 52,
  withdrawalRatePct: 3.5,
  lifeExpectancy: 92,
  propertyAppreciationPct: 3.2,
  vacancyPct: 5,
  usdInrDriftPct: 2.0,
}

export const ASSUMPTION_HISTORY = [
  { date: '2026-05-10', change: 'US equity return lowered 7.2% → 6.8% after advisor review' },
  { date: '2026-02-02', change: 'Retirement age moved 55 → 52 (sabbatical plan)' },
  { date: '2025-11-20', change: 'Added USD/INR drift assumption of 2%/yr' },
]
