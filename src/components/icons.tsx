import React from 'react'

/* Minimal 24×24 stroke icon set — consistent 1.7px stroke, round caps. */

const P: Record<string, React.ReactNode> = {
  home: <><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5.5h4V20" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  pie: <><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z" /><path d="M14.5 2.6a8.5 8.5 0 0 1 6.9 6.9h-6.9z" /></>,
  coins: <><ellipse cx="12" cy="6.5" rx="7" ry="3" /><path d="M5 6.5v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" /><path d="M5 11.5v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" /></>,
  eye: <><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  file: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4" /><path d="M9 12.5h6M9 16h6" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.8" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
  trendUp: <><path d="M3.5 17.5 9 12l3.5 3.5 8-8" /><path d="M15 7.5h5.5V13" /></>,
  layers: <><path d="m12 3.5 9 4.5-9 4.5-9-4.5z" /><path d="m4.5 12.7 7.5 3.8 7.5-3.8" /><path d="m4.5 16.7 7.5 3.8 7.5-3.8" /></>,
  building: <><path d="M4.5 20.5V6l7-3v17.5" /><path d="M11.5 8.5l8 2.5v9.5" /><path d="M4.5 20.5h17" /><path d="M7.5 8.5h1M7.5 12h1M7.5 15.5h1M14.5 13.5h2M14.5 16.5h2" /></>,
  briefcase: <><rect x="3.5" y="7.5" width="17" height="12.5" rx="2" /><path d="M9 7.5V5.4A1.9 1.9 0 0 1 10.9 3.5h2.2A1.9 1.9 0 0 1 15 5.4v2.1" /><path d="M3.5 12.5h17" /></>,
  scale: <><path d="M12 3.5v17" /><path d="M6 6.5h12" /><path d="m6 6.5-2.8 6.3a3 3 0 0 0 5.6 0z" /><path d="m18 6.5-2.8 6.3a3 3 0 0 0 5.6 0z" /><path d="M8.5 20.5h7" /></>,
  shield: <><path d="M12 3.5s2.5 1.8 7 2.2c0 0 1 10.3-7 14.8-8-4.5-7-14.8-7-14.8 4.5-.4 7-2.2 7-2.2z" /><path d="m9 11.8 2.2 2.2 4-4.3" /></>,
  receipt: <><path d="M5.5 3.5h13v17l-2.2-1.5-2.1 1.5-2.2-1.5-2.1 1.5-2.2-1.5L5.5 20.5z" /><path d="M9 8h6M9 11.5h6M9 15h3.5" /></>,
  inbox: <><path d="M4 13.5 6.5 5h11L20 13.5V19H4z" /><path d="M4 13.5h4.5l1.2 2.5h4.6l1.2-2.5H20" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3.2 2" /></>,
  reportChart: <><path d="M5 3.5h14v17H5z" /><path d="M8.5 13.5v3.5M12 10v7M15.5 7.5V17" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m15.8 15.8 4.7 4.7" /></>,
  bell: <><path d="M12 4a5.6 5.6 0 0 0-5.6 5.6c0 5-2 6.1-2 6.1h15.2s-2-1.1-2-6.1A5.6 5.6 0 0 0 12 4z" /><path d="M10 19.2a2.1 2.1 0 0 0 4 0" /></>,
  upload: <><path d="M12 15.5v-11" /><path d="m7.5 8.5 4.5-4.5 4.5 4.5" /><path d="M4.5 15.5v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3.5" /></>,
  sparkles: <><path d="M12 4.5 13.8 9l4.7 1.8-4.7 1.8L12 17l-1.8-4.4L5.5 10.8 10.2 9z" /><path d="M19 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /><path d="M5 3.5l.6 1.6 1.6.6-1.6.6L5 8l-.6-1.7-1.6-.6 1.6-.6z" /></>,
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  chevronRight: <path d="m9.5 6.5 5.5 5.5-5.5 5.5" />,
  chevronLeft: <path d="m14.5 6.5-5.5 5.5 5.5 5.5" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrowUpRight: <><path d="M7 17 17 7" /><path d="M9 7h8v8" /></>,
  arrowDownRight: <><path d="M7 7l10 10" /><path d="M17 9v8H9" /></>,
  alert: <><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4.2" /><circle cx="12" cy="16.8" r="0.4" fill="currentColor" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.5" fill="currentColor" /></>,
  bulb: <><path d="M9.5 18h5" /><path d="M10 21h4" /><path d="M12 3.5a6 6 0 0 0-3.5 10.9c.8.6 1 1.6 1 2.6h5c0-1 .2-2 1-2.6A6 6 0 0 0 12 3.5z" /></>,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5 7 7M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5" /></>,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20.2c1.2-3.4 4-5.2 7.5-5.2s6.3 1.8 7.5 5.2" /></>,
  lock: <><rect x="5.5" y="10.5" width="13" height="9.5" rx="2" /><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  filter: <><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></>,
  download: <><path d="M12 4.5v11" /><path d="m7.5 11.5 4.5 4.5 4.5-4.5" /><path d="M4.5 16v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" /></>,
  refresh: <><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 3.5v3.8h-3.8" /></>,
  key: <><circle cx="8" cy="14.5" r="4.5" /><path d="m11.5 11 8-8" /><path d="M16 6.5 18.5 9M19 3.5 21 5.5" /></>,
  fingerprint: <><path d="M8 20c-1.5-2.5-2-5-2-8a6 6 0 0 1 12 0c0 1.5-.1 3-.4 4.4" /><path d="M12 12c0 3-.4 5.7-1.6 8" /><path d="M15.5 15.5c-.3 1.7-.8 3.2-1.5 4.5" /><path d="M9 6.8A6 6 0 0 1 18 12" transform="scale(0)" /></>,
  send: <><path d="m4 11.5 16-7-5 16-3.2-6.3z" /><path d="m11.8 14.2 8.2-9.7" /></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5z" /><path d="M15 12.5h5v3h-5a1.5 1.5 0 0 1 0-3z" /></>,
  camera: <><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2.5h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="12" cy="13" r="3.2" /></>,
  book: <><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v16.5H6.8A1.8 1.8 0 0 0 5 21.3z" /><path d="M5 19.5V4.5" /><path d="M19 16.5H7" /></>,
  peak: <><path d="m3 19 6-11 4 7 3-4.5L21 19z" /><path d="M9 8V5.5M9 3v.5" /></>,
  history: <><path d="M4.5 12a7.5 7.5 0 1 1 2 5" /><path d="M4.5 12H8M4.5 12V8.5" transform="translate(0 0)" /><path d="M12 8.5V12l2.5 1.8" /></>,
}

export type IconName = keyof typeof P

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.7,
}: {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  )
}
