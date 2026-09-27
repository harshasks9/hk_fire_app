import { monteCarlo, RECOMMENDED_ID } from "./model";

/** Computed once, at build time (the /ht2 page is static). */
export const ROBUST = monteCarlo();

export const recWinShare = ROBUST.wins.find((w) => w.id === RECOMMENDED_ID)?.share ?? 0;
export const recRisk = ROBUST.risk[RECOMMENDED_ID] ?? { eats: 0, breaks: 0 };
export const dimShare = (dim: keyof typeof ROBUST.byDim, id: string) => ROBUST.byDim[dim].find((x) => x.id === id)?.share ?? 0;
