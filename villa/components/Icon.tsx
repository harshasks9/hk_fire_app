import React from "react";

/**
 * One icon set for the whole app: 20px grid, 1.6 stroke, round joins —
 * drawn like the plans, with a single line weight and no fills.
 */
const P: Record<string, React.ReactNode> = {
  home: <><path d="M3 9.5 10 4l7 5.5" /><path d="M5 8.5V16h10V8.5" /><path d="M8.5 16v-4h3v4" /></>,
  villa: <><path d="M3.5 16.5V7.5L10 3.5l6.5 4v9" /><path d="M2.5 16.5h15" /><path d="M7.5 16.5v-4h5v4" /><path d="M7.5 9h5" /></>,
  plan: <><rect x="3" y="3" width="14" height="14" rx="1" /><path d="M3 10h6M9 3v4M9 10v7M13 10v7M13 10h4" /></>,
  checklist: <><path d="M3.5 5.5 5 7l2.5-2.5M3.5 10.5 5 12l2.5-2.5M3.5 15.5 5 17l2.5-2.5" /><path d="M10 6h6.5M10 11h6.5M10 16h4" /></>,
  design: <><path d="M10 3a7 7 0 1 0 0 14c1 0 1.6-.8 1.3-1.7-.4-1.1.3-2.3 1.5-2.3H15a2 2 0 0 0 2-2A7 7 0 0 0 10 3z" /><circle cx="6.8" cy="9" r=".9" /><circle cx="9.5" cy="6.4" r=".9" /><circle cx="13" cy="7.4" r=".9" /></>,
  decisions: <><path d="M4 10.5 8.2 14.5 16 5.5" /></>,
  phases: <><path d="M3 5h5M6 10h6M10 15h7" /><path d="M3 5v0M17 15v0" /></>,
  timeline: <><path d="M3 5.5h8M3 10h14M3 14.5h6" /><circle cx="14.5" cy="5.5" r="1.6" /></>,
  costs: <><path d="M4 16V9M8.5 16V5M13 16v-4.5M17 16v-6" /></>,
  buy: <><path d="M3 4h2l2 8.5h7.5L16.5 6.5H6" /><circle cx="8" cy="16" r="1.2" /><circle cx="14" cy="16" r="1.2" /></>,
  procurement: <><path d="M3.5 6.5 10 3l6.5 3.5v7L10 17l-6.5-3.5z" /><path d="M3.5 6.5 10 10l6.5-3.5M10 10v7" /></>,
  vendors: <><circle cx="7.5" cy="7" r="2.5" /><path d="M3 16c.6-2.6 2.3-4 4.5-4s3.9 1.4 4.5 4" /><path d="M12.5 4.8a2.5 2.5 0 0 1 0 4.4M14 12.2c1.4.5 2.4 1.8 2.9 3.8" /></>,
  site: <><path d="M10 17s5.5-5 5.5-9A5.5 5.5 0 0 0 4.5 8c0 4 5.5 9 5.5 9z" /><circle cx="10" cy="8" r="1.9" /></>,
  notes: <><path d="M5 3h7l3.5 3.5V17H5z" /><path d="M12 3v3.5h3.5M7.5 10h5M7.5 13h5" /></>,
  documents: <><path d="M3.5 5.5h5l1.5 2h6.5v8.5h-13z" /></>,
  history: <><path d="M3.5 10a6.5 6.5 0 1 0 2-4.7" /><path d="M3.5 3.5v3h3" /><path d="M10 6.5V10l2.5 1.5" /></>,
  sheet: <><rect x="3" y="4" width="14" height="12" rx="1" /><path d="M3 8h14M3 12h14M8 4v12" /></>,
  manage: <><path d="M4 6h8M15 6h1M4 14h1M8 14h8" /><circle cx="13.5" cy="6" r="1.6" /><circle cx="6.5" cy="14" r="1.6" /></>,
  admin: <><circle cx="10" cy="10" r="2.4" /><path d="M10 2.8v2M10 15.2v2M2.8 10h2M15.2 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4" /></>,
  menu: <><path d="M3.5 6h13M3.5 10h13M3.5 14h13" /></>,
  more: <><circle cx="4.5" cy="10" r=".6" /><circle cx="10" cy="10" r=".6" /><circle cx="15.5" cy="10" r=".6" /></>,
  search: <><circle cx="9" cy="9" r="5.5" /><path d="m13.2 13.2 3.3 3.3" /></>,
  plus: <><path d="M10 4v12M4 10h12" /></>,
  close: <><path d="M5 5l10 10M15 5 5 15" /></>,
  check: <><path d="M4.5 10.5 8 14l7.5-8" /></>,
  "chevron-right": <><path d="m8 5 5 5-5 5" /></>,
  "chevron-left": <><path d="m12 5-5 5 5 5" /></>,
  "chevron-down": <><path d="m5.5 8 4.5 4.5L14.5 8" /></>,
  "arrow-right": <><path d="M4 10h12M11.5 5.5 16 10l-4.5 4.5" /></>,
  "arrow-left": <><path d="M16 10H4M8.5 5.5 4 10l4.5 4.5" /></>,
  edit: <><path d="M12.5 4.5 15.5 7.5 7.5 15.5H4.5V12.5z" /><path d="M11 6l3 3" /></>,
  trash: <><path d="M4 6h12M8 6V4h4v2M5.5 6l.8 10h7.4l.8-10" /></>,
  open: <><path d="M11 4h5v5M16 4l-7 7" /><path d="M14 11.5V16H4V6h4.5" /></>,
  camera: <><path d="M3 7h3l1.5-2h5L14 7h3v9H3z" /><circle cx="10" cy="11.3" r="2.8" /></>,
  flag: <><path d="M5 17V3.5M5 4h9l-2 3.5 2 3.5H5" /></>,
  task: <><rect x="3.5" y="3.5" width="13" height="13" rx="2" /><path d="m7 10 2 2 4-4.5" /></>,
  progress: <><path d="M3.5 16.5h13" /><path d="M6 16.5v-5M10 16.5V8M14 16.5V4.5" /></>,
  compare: <><rect x="3" y="4" width="6" height="12" rx="1" /><rect x="11" y="4" width="6" height="12" rx="1" /></>,
  layout: <><rect x="3" y="3" width="14" height="14" rx="1" /><rect x="6" y="9" width="5" height="5" /><path d="M13 6v8" /></>,
  drawings: <><path d="M3 5.5 8 3.5l4 2 5-2v11l-5 2-4-2-5 2z" /><path d="M8 3.5v11M12 5.5v11" /></>,
  user: <><circle cx="10" cy="7" r="3" /><path d="M4 17c.8-3 3.1-4.5 6-4.5s5.2 1.5 6 4.5" /></>,
  alert: <><path d="M10 3.5 17.5 16.5h-15z" /><path d="M10 8.5v3.5M10 14.2v.1" /></>,
  info: <><circle cx="10" cy="10" r="7" /><path d="M10 9v4.5M10 6.5v.1" /></>,
  download: <><path d="M10 3.5v9M6 9l4 4 4-4M4 16.5h12" /></>,
  upload: <><path d="M10 13V4M6 7.5 10 3.5l4 4M4 16.5h12" /></>,
  calendar: <><rect x="3" y="4.5" width="14" height="12" rx="1.5" /><path d="M3 8.5h14M7 3v3M13 3v3" /></>,
  rupee: <><path d="M6 4h8M6 7.5h8M6 4h2.5a3.5 3.5 0 0 1 0 7H6l6 5.5" /></>,
  sparkle: <><path d="M10 3v4M10 13v4M3 10h4M13 10h4M5.5 5.5l2 2M12.5 12.5l2 2M5.5 14.5l2-2M12.5 7.5l2-2" /></>,
  cloud: <><path d="M6 15.5h8.5a3 3 0 0 0 .3-6A4.5 4.5 0 0 0 6.2 8 3.8 3.8 0 0 0 6 15.5z" /></>,
  lock: <><rect x="4.5" y="9" width="11" height="8" rx="1.5" /><path d="M7 9V6.5a3 3 0 0 1 6 0V9" /></>,
};

export type IconName = keyof typeof P;

export function Icon({
  name, size = 18, className, strokeWidth = 1.6, title,
}: { name: string; size?: number; className?: string; strokeWidth?: number; title?: string }) {
  return (
    <svg
      viewBox="0 0 20 20" width={size} height={size} className={className}
      fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={title ? undefined : true} role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {P[name] ?? P.more}
    </svg>
  );
}

/** The project mark: a plan with a door swinging into it. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} aria-hidden>
      <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--color-ink)" />
      <path d="M8 20V8h12v12h-5" fill="none" stroke="#f2f1ed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 20a5 5 0 0 0-5-5" fill="none" stroke="#c9a864" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 20v-5" stroke="#c9a864" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
