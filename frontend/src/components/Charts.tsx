import React from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Line, LineChart,
} from 'recharts'

export interface Datum { label: string; value: number; secondary?: number }

const COLORS = ['#4f8ef7', '#22d3ee', '#34d399', '#a78bfa', '#fb923c', '#f87171']

function ChartTooltip({ active, payload, label, unit = '' }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: p.color || p.fill }} />
          <span style={{ color: 'var(--text-muted)' }}>{p.name || p.dataKey}:</span>
          <strong>{p.value}{unit}</strong>
        </div>
      ))}
    </div>
  )
}

const axis = { stroke: '#3d4f73', fontSize: 11, fontFamily: 'system-ui, sans-serif' }
const grid = 'rgba(255,255,255,0.055)'

/** Smooth gradient area chart — ideal for time-series telemetry. */
export function TrendArea({ data, color = '#38bdf8', unit = '', height = 240, name = 'Value' }: {
  data: Datum[]; color?: string; unit?: string; height?: number; name?: string
}) {
  if (!data.length) return <ChartEmpty height={height} label="No telemetry points collected yet" />
  const id = `area-${color.replace('#', '')}`
  return (
    <div className="chart-container" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.42} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 5" stroke={grid} vertical={false} />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: color, strokeOpacity: .35 }} />
          <Area type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={2.4}
            fill={`url(#${id})`} activeDot={{ r: 5, strokeWidth: 2, stroke: '#0b1020' }}
            animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Rounded comparison bars — severities, costs, priorities. */
export function CompareBars({ data, colors, height = 240, unit = '', horizontal = false }: {
  data: Datum[]; colors?: string[]; height?: number; unit?: string; horizontal?: boolean
}) {
  if (!data.length) return <ChartEmpty height={height} label="No data available" />
  return (
    <div className="chart-container" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 12, left: horizontal ? 10 : -18, bottom: 0 }} barSize={22}>
          <CartesianGrid strokeDasharray="3 5" stroke={grid} vertical={false} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={axis} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="label" tick={axis} tickLine={false} axisLine={false} width={76} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} width={48} />
            </>
          )}
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: 'rgba(255,255,255,.035)' }} />
          <Bar dataKey="value" name="Count" radius={[6, 6, 6, 6]} animationDuration={800}>
            {data.map((_, i) => (
              <Cell key={i} fill={(colors && colors[i]) || COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Donut breakdown with a labelled centre. */
export function Donut({ data, height = 240, centreLabel = 'Total' }: {
  data: Datum[]; height?: number; centreLabel?: string
}) {
  if (!data.length) return <ChartEmpty height={height} label="No data available" />
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius="56%" outerRadius="78%"
            paddingAngle={3} stroke="none" animationDuration={800}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px' }}>{total}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{centreLabel}</div>
        </div>
      </div>
    </div>
  )
}

/** Tiny inline sparkline for cards. */
export function Sparkline({ values, color = '#38bdf8', height = 42 }: {
  values: number[]; color?: string; height?: number
}) {
  const data = values.map((v, i) => ({ label: String(i), value: v }))
  if (data.length < 2) return null
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false}
            isAnimationActive animationDuration={700} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Multi-series line chart (e.g., CPU vs memory). */
export function MultiLine({ data, series, height = 240 }: {
  data: any[]; series: { key: string; label: string; color: string }[]; height?: number
}) {
  if (!data.length) return <ChartEmpty height={height} label="No samples collected yet" />
  return (
    <div className="chart-container" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 5" stroke={grid} vertical={false} />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip />} />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color}
              strokeWidth={2.2} dot={false} animationDuration={700} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ChartEmpty({ height = 220, label = 'No data available' }: { height?: number; label?: string }) {
  return (
    <div className="empty-state" style={{ height, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 28, opacity: .35 }}>◔</div>
      <div className="empty-state-title" style={{ fontSize: 13 }}>{label}</div>
      <div className="empty-state-desc" style={{ fontSize: 11 }}>
        Data appears here as soon as the local services report metrics.
      </div>
    </div>
  )
}

export { COLORS as CHART_COLORS }
