import { useMemo, useRef, useState } from "react";

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  values: number[]; // aligned with `xLabels`
  formatValue?: (v: number) => string;
}

interface TrendLineChartProps {
  xLabels: string[];
  series: TrendSeries[];
  height?: number;
  yFormat?: (v: number) => string;
  unit?: string;
}

const MARGIN = { top: 12, right: 12, bottom: 24, left: 40 };

export function TrendLineChart({ xLabels, series, height = 220, yFormat = (v) => v.toFixed(1) }: TrendLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 640;
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const allValues = series.flatMap((s) => s.values);
  const minY = Math.min(0, ...allValues);
  const maxY = Math.max(1, ...allValues) * 1.12;

  const xFor = (i: number) => (xLabels.length <= 1 ? innerW / 2 : (i / (xLabels.length - 1)) * innerW);
  const yFor = (v: number) => innerH - ((v - minY) / (maxY - minY || 1)) * innerH;

  const paths = useMemo(
    () =>
      series.map((s) => ({
        ...s,
        d: s.values.map((v, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(2)},${yFor(v).toFixed(2)}`).join(" "),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, minY, maxY, xLabels.length]
  );

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => minY + ((maxY - minY) * i) / yTicks);

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const idx = Math.round((relX / innerW) * (xLabels.length - 1));
    setHoverIdx(Math.min(xLabels.length - 1, Math.max(0, idx)));
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Wykres trendu w czasie">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {tickValues.map((t, i) => (
            <g key={i}>
              <line x1={0} x2={innerW} y1={yFor(t)} y2={yFor(t)} stroke="var(--gridline)" strokeWidth={1} />
              <text x={-8} y={yFor(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--text-muted)">
                {yFormat(t)}
              </text>
            </g>
          ))}
          <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="var(--baseline)" strokeWidth={1} />

          {xLabels.map(
            (label, i) =>
              (i === 0 || i === xLabels.length - 1 || xLabels.length <= 6) && (
                <text key={i} x={xFor(i)} y={innerH + 16} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
                  {label}
                </text>
              )
          )}

          {hoverIdx !== null && (
            <line x1={xFor(hoverIdx)} x2={xFor(hoverIdx)} y1={0} y2={innerH} stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="3 3" />
          )}

          {paths.map((s) => (
            <path key={s.key} d={s.d} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {paths.map((s) =>
            s.values.map((v, i) =>
              hoverIdx === i ? (
                <circle key={i} cx={xFor(i)} cy={yFor(v)} r={4} fill={s.color} stroke="var(--surface-1)" strokeWidth={2} />
              ) : null
            )
          )}

          <rect
            x={0}
            y={0}
            width={innerW}
            height={innerH}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIdx(null)}
          />
        </g>
      </svg>

      {hoverIdx !== null && (
        <div
          className="absolute pointer-events-none rounded-lg px-3 py-2 text-xs shadow-lg z-10"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            left: `${(MARGIN.left + xFor(hoverIdx)) / width * 100}%`,
            top: 4,
            transform: "translateX(-50%)",
            minWidth: 140,
          }}
        >
          <div className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            {xLabels[hoverIdx]}
          </div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <span className="h-2 w-2 rounded-full inline-block" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
                {(s.formatValue ?? yFormat)(s.values[hoverIdx])}
              </span>
            </div>
          ))}
        </div>
      )}

      {series.length > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full inline-block" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
