/**
 * The theatre's geometry, in metres, and every number derived from it.
 *
 * Axes, as you sit facing the screen:
 *   x — distance from the screen (front) wall, 0 → L
 *   y — distance from the left wall, 0 → W. The left wall is the east wall,
 *       the one with the door.
 *   z — height above the finished floor.
 *
 * The finished ceiling drops by 8 inches (203 mm) from the earlier 2.75 m.
 * Every figure that depends on the ceiling is computed here from `H`, so the
 * room drawings, the component cards and the tests all read the same numbers.
 */

export const INCH = 0.0254;

export const ROOM = {
  shellL: 6.2,
  shellW: 4.37,
  /** Finished length, lining to lining. */
  L: 6.05,
  /** Finished clear width. */
  W: 4.13,
  ceilingBefore: 2.75,
  drop: 8 * INCH,
  get H() { return this.ceilingBefore - this.drop; },
  /** Depth of the absorbent layer on the ceiling (clouds, fabric over wool). */
  ceilingTreatment: 0.05,
};

export const H = ROOM.H; // 2.5468

export const STAGE = { depth: 0.6, height: 0.15 };

export const SCREEN = {
  diagonalIn: 120,
  x: 0.6,
  width: 2.657,
  height: 1.494,
  /** Lowered 50 mm (from 0.95) so the top border clears the lower ceiling. */
  bottom: 0.9,
  bottomBefore: 0.95,
  /** Centred on the seats, which sit 0.165 m right of the room's centre line. */
  cy: 2.23,
  gain: 0.95,
  get top() { return this.bottom + this.height; },
  get left() { return this.cy - this.width / 2; },
  get right() { return this.cy + this.width / 2; },
  get cz() { return this.bottom + this.height / 2; },
};

export const RISER = {
  x0: 4.16,
  /** Raised 50 mm (from 0.40) to win back the sightline lost by lowering the screen. */
  height: 0.45,
  heightBefore: 0.4,
  stepRise: 0.225,
};

/** Seated human, recliner upright: ear height and top of head above the seat base. */
export const SEATED = { ear: 1.1, headTop: 1.22, standing: 1.85 };

export const ROWS = [
  { id: "row1", label: "Row 1", earX: 3.5, earZ: SEATED.ear, seatW: 0.95, x0: 2.85, x1: 3.85, base: 0, ys: [1.28, 2.23, 3.18] },
  { id: "row2", label: "Row 2", earX: 5.48, earZ: RISER.height + SEATED.ear, seatW: 0.9, x0: 4.83, x1: 5.83, base: RISER.height, ys: [1.28, 2.23, 3.18] },
] as const;

export const DOOR = { wall: "left" as const, x0: 3.25, x1: 4.15, height: 2.1, swing: "outward" };

/** The projector moves to a shelf on the rear wall — see `projectorStudy`. */
export const PROJECTOR = {
  lensX: 5.62,
  lensY: SCREEN.cy,
  lensZ: 2.4,
  body: { w: 0.5, d: 0.5, h: 0.234 },
  boxBottom: 2.24,
  /** JVC NZ500 / NZ700 zoom range, from the reviews. */
  throwRange: [1.34, 2.14] as [number, number],
  verticalShiftMax: 0.7,
};

export type SpeakerRole = "lcr" | "wide" | "side" | "rear" | "top" | "sub";

export interface Marker {
  id: string;
  /** The component (catalog id) it opens. */
  component: string;
  role: SpeakerRole | "projector" | "screen" | "rack" | "mic";
  label: string;
  x: number; y: number; z: number;
  /** Which wall it sits on, for elevations. */
  on?: "front" | "left" | "right" | "rear" | "ceiling" | "floor" | "riser";
}

const TOP_Y = [1.1, 3.36];

export const MARKERS: Marker[] = [
  { id: "L", component: "lcr", role: "lcr", label: "L", x: 0.3, y: 1.1, z: 1.32, on: "front" },
  { id: "C", component: "lcr", role: "lcr", label: "C", x: 0.3, y: SCREEN.cy, z: 1.32, on: "front" },
  { id: "R", component: "lcr", role: "lcr", label: "R", x: 0.3, y: 3.36, z: 1.32, on: "front" },
  { id: "Lw", component: "wides", role: "wide", label: "Lw", x: 1.9, y: 0, z: 1.3, on: "left" },
  { id: "Rw", component: "wides", role: "wide", label: "Rw", x: 1.9, y: ROOM.W, z: 1.3, on: "right" },
  { id: "Lss", component: "sides", role: "side", label: "Lss", x: 4.4, y: 0, z: 1.9, on: "left" },
  { id: "Rss", component: "sides", role: "side", label: "Rss", x: 4.4, y: ROOM.W, z: 1.9, on: "right" },
  { id: "Lrs", component: "rears", role: "rear", label: "Lrs", x: ROOM.L, y: 0.35, z: 2.05, on: "rear" },
  { id: "Rrs", component: "rears", role: "rear", label: "Rrs", x: ROOM.L, y: 3.78, z: 2.05, on: "rear" },
  { id: "Ltf", component: "atmos", role: "top", label: "Ltf", x: 2.0, y: TOP_Y[0], z: H, on: "ceiling" },
  { id: "Rtf", component: "atmos", role: "top", label: "Rtf", x: 2.0, y: TOP_Y[1], z: H, on: "ceiling" },
  { id: "Ltm", component: "atmos", role: "top", label: "Ltm", x: 3.9, y: TOP_Y[0], z: H, on: "ceiling" },
  { id: "Rtm", component: "atmos", role: "top", label: "Rtm", x: 3.9, y: TOP_Y[1], z: H, on: "ceiling" },
  { id: "Ltr", component: "atmos", role: "top", label: "Ltr", x: 5.4, y: TOP_Y[0], z: H, on: "ceiling" },
  { id: "Rtr", component: "atmos", role: "top", label: "Rtr", x: 5.4, y: TOP_Y[1], z: H, on: "ceiling" },
  { id: "SW1", component: "subs", role: "sub", label: "SW1", x: 0.32, y: 1.03, z: STAGE.height, on: "floor" },
  { id: "SW2", component: "subs", role: "sub", label: "SW2", x: 0.32, y: 3.1, z: STAGE.height, on: "floor" },
  { id: "SW3", component: "subs", role: "sub", label: "SW3", x: 5.78, y: 0.3, z: RISER.height, on: "riser" },
  { id: "SW4", component: "subs", role: "sub", label: "SW4", x: 5.78, y: 3.88, z: RISER.height, on: "riser" },
];

export const SUB_SIZE = { w: 0.45, d: 0.55, h: 0.55 };

/* --------------------------------------------------------------- derived */

const deg = (r: number) => (r * 180) / Math.PI;
const round = (n: number, p = 2) => Math.round(n * 10 ** p) / 10 ** p;

export const volume = (h = H) => ROOM.L * ROOM.W * h;
export const surface = (h = H) => 2 * (ROOM.L * ROOM.W + ROOM.L * h + ROOM.W * h);

/** Axial room modes along one dimension (Hz). */
export const axialModes = (dim: number, n = 3) => Array.from({ length: n }, (_, i) => round(((i + 1) * 343) / (2 * dim), 1));

export const schroeder = (rt60 = 0.3, h = H) => round(2000 * Math.sqrt(rt60 / volume(h)), 0);

/** Sabine: absorption (m² sabins) needed for a target RT60. */
export const absorptionNeeded = (rt60 = 0.3, h = H) => round((0.161 * volume(h)) / rt60, 1);

/** Absorption the room already has without panels: six recliners and carpet. */
export const absorptionBaseline = () => round(6 * 0.8 + ROOM.L * ROOM.W * 0.35, 1);

/** Square metres of broadband panel (α≈0.9) to add. */
export const panelArea = (rt60 = 0.3, h = H) => round((absorptionNeeded(rt60, h) - absorptionBaseline()) / 0.9, 1);

export const viewingAngle = (distance: number) => round(deg(2 * Math.atan(SCREEN.width / 2 / distance)), 1);

export const screenDistance = (row: 0 | 1) => ROWS[row].earX - SCREEN.x;

/** Elevation of a ceiling speaker above one row's ears, and whether it is ahead of or behind them. */
export function elevation(m: Marker, row: 0 | 1, h = H) {
  const r = ROWS[row];
  const earZ = row === 1 ? RISER.height + SEATED.ear : SEATED.ear;
  const dx = r.earX - m.x;
  const dz = (m.on === "ceiling" ? h : m.z) - earZ;
  const e = deg(Math.atan2(dz, Math.abs(dx)));
  return { deg: round(e, 0), where: Math.abs(dx) < 0.25 ? "overhead" : dx > 0 ? "ahead" : "behind", above: round(dz, 2) };
}

/**
 * Can row 2 see the bottom of the picture over row 1's heads?
 * Clearance is how far the line from a row-2 eye to the screen's bottom edge
 * passes above the top of an upright row-1 head.
 */
export function sightline(screenBottom = SCREEN.bottom, riser = RISER.height) {
  const eye = { x: ROWS[1].earX, z: riser + SEATED.ear };
  const t = (ROWS[0].earX - SCREEN.x) / (eye.x - SCREEN.x);
  const zAtRow1 = screenBottom + t * (eye.z - screenBottom);
  return { clearance: round(zAtRow1 - SEATED.headTop, 3), zAtRow1: round(zAtRow1, 3), eyeZ: eye.z };
}

export const throwDistance = (lensX = PROJECTOR.lensX) => round(lensX - SCREEN.x, 2);
export const throwRatio = (lensX = PROJECTOR.lensX) => round(throwDistance(lensX) / SCREEN.width, 2);
/** Vertical lens shift needed, as a fraction of picture height. */
export const lensShift = (lensZ = PROJECTOR.lensZ) => round((lensZ - SCREEN.cz) / SCREEN.height, 3);

export const screenArea = () => SCREEN.width * SCREEN.height;
/** On-screen luminance (nits) for calibrated lumens on this screen. */
export const nits = (lumens: number, gain = SCREEN.gain) => Math.round((lumens * gain) / (Math.PI * screenArea()));

/** Height of the projector's lower beam edge at distance x from the front wall. */
export function beamBottomAt(x: number, lensX = PROJECTOR.lensX, lensZ = PROJECTOR.lensZ) {
  return round(lensZ - ((lensX - x) / (lensX - SCREEN.x)) * (lensZ - SCREEN.bottom), 2);
}

/**
 * Why the projector left the ceiling. With the lower ceiling, a hush box in
 * the middle of the room hangs where people stand up on the riser.
 */
export function projectorStudy() {
  const midRoom = { lensX: 4.8, boxBottom: H - 0.3 };
  const standingOnRiser = RISER.height + SEATED.standing;
  return {
    midRoom: { ...midRoom, throwRatio: throwRatio(midRoom.lensX), headroom: round(midRoom.boxBottom - standingOnRiser, 2) },
    rearShelf: {
      lensX: PROJECTOR.lensX, boxBottom: PROJECTOR.boxBottom, throwRatio: throwRatio(),
      seatedClearance: round(beamBottomAt(ROWS[1].earX - 0.05) - (RISER.height + SEATED.headTop), 2),
    },
    standingOnRiser,
  };
}

/** Rough in-room SPL at a seat: 1 m peak output less distance and screen losses. */
export function splAt(peak1m: number, distance: number, atScreen = true) {
  const loss = 20 * Math.log10(distance) - 3 /* room gain in a treated small room */;
  return Math.round(peak1m - loss - (atScreen ? 1 : 0));
}

/** Everything that moved when the ceiling came down, before → after. */
export function ceilingImpact() {
  const before = ROOM.ceilingBefore;
  const after = H;
  const sBefore = sightline(SCREEN.bottomBefore, RISER.heightBefore);
  const sLowOnly = sightline(SCREEN.bottom, RISER.heightBefore);
  const sAfter = sightline();
  const tr = MARKERS.find((m) => m.id === "Ltr")!;
  return [
    { k: "Finished ceiling", before: `${before.toFixed(2)} m`, after: `${after.toFixed(3)} m`, note: "8 in (203 mm) lower. The void above carries ducts, isolation hangers and the projector's exhaust." },
    { k: "Room volume", before: `${volume(before).toFixed(1)} m³`, after: `${volume(after).toFixed(1)} m³`, note: "7% less air. Slightly louder for the same power; slightly less natural bass gain." },
    { k: "Height mode", before: `${axialModes(before, 1)[0]} Hz`, after: `${axialModes(after, 1)[0]} Hz`, note: "Both rows' ears now sit close to its null (1.27 m), so both rows lose a little around 67 Hz. Floor subs can't fix it; the ceiling-corner traps and Dirac ART help." },
    { k: "Schroeder frequency", before: `${schroeder(0.3, before)} Hz`, after: `${schroeder(0.3, after)} Hz`, note: "Room modes rule up to here; treatment rules above." },
    { k: "Broadband panel needed", before: `${panelArea(0.3, before)} m²`, after: `${panelArea(0.3, after)} m²`, note: "For RT60 0.30 s. Less area, and the ceiling's share moves to thinner, flush panels." },
    { k: "Screen bottom edge", before: `${SCREEN.bottomBefore.toFixed(2)} m`, after: `${SCREEN.bottom.toFixed(2)} m`, note: `Top of picture ${SCREEN.top.toFixed(2)} m, leaving ${Math.round((after - SCREEN.top) * 1000)} mm for the velvet border and a clear strip to the ceiling.` },
    { k: "Riser", before: `${RISER.heightBefore.toFixed(2)} m`, after: `${RISER.height.toFixed(2)} m`, note: `Lowering the screen alone cut row 2's clearance over row 1 to ${Math.round(sLowOnly.clearance * 1000)} mm; +50 mm on the riser brings it back to ${Math.round(sAfter.clearance * 1000)} mm (was ${Math.round(sBefore.clearance * 1000)} mm).` },
    { k: "Standing headroom on the riser", before: `${(before - RISER.heightBefore).toFixed(2)} m`, after: `${(after - RISER.height).toFixed(2)} m`, note: "About 2.1 m under the flush ceiling. Nothing may hang over the riser walkway." },
    { k: "Row 2 ears to ceiling", before: `${(before - RISER.heightBefore - SEATED.ear).toFixed(2)} m`, after: `${(after - RISER.height - SEATED.ear).toFixed(2)} m`, note: `Overheads get close to row 2. The rear pair sits ${elevation(tr, 1).above} m above row-2 ears: wide-dispersion drivers, and levels trimmed in calibration.` },
    { k: "Projector", before: "Ceiling, mid-room, lens 2.60 m", after: `Rear-wall shelf, lens ${PROJECTOR.lensZ.toFixed(2)} m`, note: `A mid-room hush box would hang ${Math.abs(projectorStudy().midRoom.headroom * 1000).toFixed(0)} mm into the head height of a 1.85 m person standing on the riser. From the rear wall the throw is ${throwDistance()} m (ratio ${throwRatio()}), inside the JVC zoom range, needing ${Math.round(lensShift() * 100)}% lens shift.` },
    { k: "Atmos", before: "Ears 1.25–1.65 m below", after: `Ears ${(after - RISER.height - SEATED.ear).toFixed(2)}–${(after - SEATED.ear).toFixed(2)} m below`, note: "Keep all six flush in the ceiling: no angled boxes, no clouds under them. Front and middle pairs stay at Dolby angles for row 1." },
    { k: "HVAC", before: "Rear soffit supply", after: "Side-wall linear slots, front half", note: "Row 2 heads are 1.0 m under the ceiling: no supply air above them. Supply along the ceiling from the front half, return low through the riser." },
  ];
}

export const fmtM = (n: number, p = 2) => `${n.toFixed(p)} m`;
