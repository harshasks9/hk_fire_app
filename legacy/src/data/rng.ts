/** Deterministic PRNG so sample data & charts are stable across reloads. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Geometric-ish random walk ending exactly at `endValue`. */
export function walkTo(
  endValue: number,
  points: number,
  seed: number,
  dailyVol = 0.013,
  drift = 0.00045,
): number[] {
  const rnd = mulberry32(seed)
  const raw: number[] = [1]
  for (let i = 1; i < points; i++) {
    const shock = (rnd() + rnd() + rnd() - 1.5) * 2 * dailyVol
    raw.push(raw[i - 1] * (1 + drift + shock))
  }
  const scale = endValue / raw[raw.length - 1]
  return raw.map((v) => v * scale)
}
