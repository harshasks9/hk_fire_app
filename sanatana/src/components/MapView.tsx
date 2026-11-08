/**
 * The geographic layer: a self-contained SVG map of South and Southeast Asia
 * (Natural Earth 1:50m via world-atlas, clipped at build time) — no tile server,
 * no API key, works offline and on any static host. Pan and zoom with d3-zoom.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { geoConicConformal, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom'
import { select } from 'd3-selection'
import 'd3-transition'
import { Plus, Minus, Maximize2 } from 'lucide-react'
import type { Family } from '../data/store.tsx'
import { Glyph } from './ui.tsx'
import { FAMILY_BY_ID } from '../lib/meta.ts'

let basemapPromise: Promise<GeoJSON.FeatureCollection> | null = null
function loadBasemap() {
  basemapPromise ??= fetch(`${import.meta.env.BASE_URL}data/basemap.json`).then((r) => r.json())
  return basemapPromise
}

export interface MapPoint {
  id: string
  lat: number
  lon: number
  label: string
  family: Family
  /** 0..1 — fades points that are outside the current time window but still shown */
  opacity?: number
  ring?: boolean
  size?: number
  colorOverride?: string
  sub?: string
}

export function MapView({ points, selected, onSelect, height = 560, dark = false, fitTo, children, label = 'Map', showLabels = 'selected' }: {
  points: MapPoint[]
  selected?: string | null
  onSelect?: (id: string | null) => void
  height?: number | string
  dark?: boolean
  fitTo?: 'points' | 'region'
  children?: ReactNode
  label?: string
  showLabels?: 'none' | 'selected' | 'all'
}) {
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null)
  const [size, setSize] = useState({ w: 800, h: 560 })
  const [t, setT] = useState<ZoomTransform>(zoomIdentity)
  const [hover, setHover] = useState<MapPoint | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const zoomer = useRef<ReturnType<typeof zoom<SVGSVGElement, unknown>> | null>(null)

  useEffect(() => { loadBasemap().then(setGeo).catch(() => setGeo({ type: 'FeatureCollection', features: [] })) }, [])
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const projection = useMemo(() => {
    const p = geoConicConformal().parallels([10, 30]).rotate([-82, 0])
    const fitPts = fitTo === 'points' && points.length
      ? { type: 'MultiPoint', coordinates: points.map((x) => [x.lon, x.lat]) }
      : { type: 'MultiPoint', coordinates: [[63, 6], [97, 36], [123, -9], [72, -1]] }
    if (fitTo === 'points' && points.length === 1) {
      p.center([0, points[0].lat]).rotate([-points[0].lon, 0]).scale(2600).translate([size.w / 2, size.h / 2])
    } else {
      p.fitExtent([[24, 24], [size.w - 24, size.h - 24]], fitPts as GeoPermissibleObjects)
    }
    return p
  }, [size.w, size.h, fitTo, fitTo === 'points' ? points.map((x) => x.id).join(',') : ''])  // eslint-disable-line react-hooks/exhaustive-deps
  const path = useMemo(() => geoPath(projection), [projection])

  useEffect(() => {
    if (!svg.current) return
    const z = zoom<SVGSVGElement, unknown>().scaleExtent([0.7, 40]).on('zoom', (ev) => setT(ev.transform))
    zoomer.current = z
    select(svg.current).call(z)
    return () => { select(svg.current!).on('.zoom', null) }
  }, [])
  // zoom to the selected point when it changes from outside
  useEffect(() => {
    if (!selected || !svg.current || !zoomer.current) return
    const pt = points.find((p) => p.id === selected)
    if (!pt) return
    const xy = projection([pt.lon, pt.lat])
    if (!xy) return
    const k = Math.max(t.k, 3.2)
    const target = zoomIdentity.translate(size.w / 2 - xy[0] * k, size.h / 2 - xy[1] * k).scale(k)
    select(svg.current).transition().duration(650).call(zoomer.current.transform, target)
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const land = dark ? '#20264a' : 'var(--land)'
  const stroke = dark ? '#39417a' : 'var(--land-stroke)'
  const sea = dark ? '#14182f' : 'var(--sea)'
  const ink = dark ? '#ece4d3' : 'var(--ink)'
  const halo = dark ? '#12162b' : 'var(--bg)'
  const z = (fn: (k: number) => number) => () => { if (svg.current && zoomer.current) select(svg.current).transition().duration(300).call(zoomer.current.scaleBy, fn(1)) }
  const sorted = [...points].sort((a, b) => (a.id === selected ? 1 : 0) - (b.id === selected ? 1 : 0))

  return (
    <div ref={wrap} className="relative w-full overflow-hidden rounded-xl" style={{ height, background: sea }}>
      <svg ref={svg} width={size.w} height={size.h} role="img" aria-label={`${label}: ${points.length} locations. A list of the same locations is available beside the map.`} className="block touch-none select-none">
        <g transform={t.toString()}>
          {geo?.features.map((f, i) => (
            <path key={i} d={path(f as GeoPermissibleObjects) ?? ''} fill={land} stroke={stroke} strokeWidth={0.6 / t.k} />
          ))}
          {sorted.map((p) => {
            const xy = projection([p.lon, p.lat])
            if (!xy) return null
            const fam = FAMILY_BY_ID[p.family]
            const color = p.colorOverride ?? (dark ? fam.dark : `var(${fam.cssVar})`)
            const r = ((p.size ?? 5) * (p.id === selected ? 1.5 : 1)) / Math.sqrt(t.k)
            const showLabel = showLabels === 'all' || (showLabels === 'selected' && (p.id === selected || hover?.id === p.id))
            return (
              <g key={p.id} transform={`translate(${xy[0]},${xy[1]})`} opacity={p.opacity ?? 1} style={{ cursor: onSelect ? 'pointer' : 'default' }}
                onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)} onClick={(e) => { e.stopPropagation(); onSelect?.(p.id) }}>
                <circle r={r * 2.6} fill="transparent" />
                {p.family === 'geography' && !p.ring ? (
                  <path d={`M0,${-r * 1.25} L${r * 1.15},${r * 0.8} L${-r * 1.15},${r * 0.8} Z`} fill={color} stroke={halo} strokeWidth={1.2 / Math.sqrt(t.k)} strokeLinejoin="round" />
                ) : p.family === 'material' ? (
                  <path d={Array.from({ length: 6 }, (_, i) => `${i ? 'L' : 'M'}${r * 1.1 * Math.cos((Math.PI / 3) * i)},${r * 1.1 * Math.sin((Math.PI / 3) * i)}`).join('') + 'Z'} fill={color} stroke={halo} strokeWidth={1.2 / Math.sqrt(t.k)} />
                ) : (
                  <circle r={r} fill={p.ring ? 'transparent' : color} stroke={p.ring ? color : halo} strokeWidth={(p.ring ? 1.8 : 1.2) / Math.sqrt(t.k)} />
                )}
                {p.id === selected ? <circle r={r * 2.1} fill="none" stroke={ink} strokeWidth={1.2 / Math.sqrt(t.k)} /> : null}
                {showLabel ? (
                  <text x={r + 4 / Math.sqrt(t.k)} y={4 / Math.sqrt(t.k)} fontSize={12 / Math.sqrt(t.k)} fill={ink} stroke={halo} strokeWidth={3 / Math.sqrt(t.k)} paintOrder="stroke" fontFamily="Inter, sans-serif" fontWeight={500}>{p.label}</text>
                ) : null}
              </g>
            )
          })}
        </g>
      </svg>
      {hover ? (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg px-3 py-2 text-xs shadow-lg max-w-[260px]" style={{ background: dark ? 'rgba(26,31,58,0.95)' : 'var(--panel)', border: `1px solid ${dark ? 'var(--night-rule)' : 'var(--rule)'}`, color: ink }}>
          <div className="flex items-center gap-1.5 font-semibold"><Glyph family={hover.family} size={10} dark={dark} />{hover.label}</div>
          {hover.sub ? <div className="opacity-75 mt-0.5">{hover.sub}</div> : null}
        </div>
      ) : null}
      <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
        <button className="btn !p-2" aria-label="Zoom in" onClick={z(() => 1.6)}><Plus size={13} /></button>
        <button className="btn !p-2" aria-label="Zoom out" onClick={z(() => 1 / 1.6)}><Minus size={13} /></button>
        <button className="btn !p-2" aria-label="Reset view" onClick={() => { if (svg.current && zoomer.current) select(svg.current).transition().duration(400).call(zoomer.current.transform, zoomIdentity) }}><Maximize2 size={13} /></button>
      </div>
      {children}
      <div className="absolute left-3 bottom-2 text-[10px] opacity-60" style={{ color: ink }}>Basemap: Natural Earth (public domain). Present-day borders for orientation only.</div>
    </div>
  )
}
