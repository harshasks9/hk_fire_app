import { monteCarlo, RECOMMENDED_ID } from "./model";

/** Computed once, at build time (the /ht2 page is static). */
export const ROBUST = monteCarlo();

/**
 * The recommendation rule: of the systems that break ₹30 L in no more than
 * 2% of runs, the one that wins most often. Winning most often on its own
 * rewards systems parked at the cap.
 */
export const MAX_BREAK = 2;
export const ROBUST_PICK = ROBUST.wins.find((w) => (ROBUST.risk[w.id]?.breaks ?? 100) <= MAX_BREAK)!;

export const recWinShare = ROBUST.wins.find((w) => w.id === RECOMMENDED_ID)?.share ?? 0;
export const recRisk = ROBUST.risk[RECOMMENDED_ID] ?? { eats: 0, breaks: 0 };
export const dimShare = (dim: keyof typeof ROBUST.byDim, id: string) => ROBUST.byDim[dim].find((x) => x.id === id)?.share ?? 0;
