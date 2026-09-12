import { useState } from "react";
import type { RegionCell } from "../lib/types";
import { divergingColor, useResolvedPalette } from "../lib/theme";
import { formatMm } from "../lib/format";
import { useLang } from "../lib/i18n";

interface RegionHeatmapProps {
  rows: number;
  cols: number;
  cells: RegionCell[];
  domainMaxMm: number;
  rowLabels: string[];
  colLabels: string[];
  onCellClick?: (cell: RegionCell) => void;
  selectedCell?: RegionCell | null;
}

export function RegionHeatmap({ rows, cols, cells, domainMaxMm, rowLabels, colLabels, onCellClick, selectedCell }: RegionHeatmapProps) {
  const { t } = useLang();
  const palette = useResolvedPalette();
  const [hovered, setHovered] = useState<RegionCell | null>(null);
  const [tableView, setTableView] = useState(false);

  const grid: (RegionCell | undefined)[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => cells.find((cell) => cell.row === r && cell.col === c))
  );
  const cellLabel = (cell: RegionCell) => `${rowLabels[cell.row]} - ${colLabels[cell.col]}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-8 rounded" style={{ background: `linear-gradient(90deg, ${palette.divRed[3]}, ${palette.divNeutral}, ${palette.seqBlue[3]})` }} />
          </span>
          <span>{formatMm(-domainMaxMm)}</span>
          <span style={{ color: "var(--text-muted)" }}>{t.compare.dentLoss}</span>
          <span>&middot;</span>
          <span style={{ color: "var(--text-muted)" }}>{t.compare.bulge}</span>
          <span>{formatMm(domainMaxMm)}</span>
        </div>
        <button
          onClick={() => setTableView((v) => !v)}
          className="text-xs rounded-full px-2.5 py-1"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          {tableView ? t.heatmapTable.showHeatmap : t.heatmapTable.showTable}
        </button>
      </div>

      {tableView ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular-nums" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="text-left p-2" style={{ color: "var(--text-muted)" }}>
                  {t.heatmapTable.colSection}
                </th>
                <th className="text-right p-2" style={{ color: "var(--text-muted)" }}>
                  {t.heatmapTable.colAvg}
                </th>
                <th className="text-right p-2" style={{ color: "var(--text-muted)" }}>
                  {t.heatmapTable.colPeak}
                </th>
              </tr>
            </thead>
            <tbody>
              {cells.map((cell) => (
                <tr key={`${cell.row}-${cell.col}`} style={{ borderTop: "1px solid var(--gridline)" }}>
                  <td className="p-2" style={{ color: "var(--text-primary)" }}>
                    {cellLabel(cell)}
                  </td>
                  <td className="p-2 text-right" style={{ color: "var(--text-secondary)" }}>
                    {formatMm(cell.avgDeviationMm, 2)}
                  </td>
                  <td className="p-2 text-right" style={{ color: "var(--text-secondary)" }}>
                    {formatMm(cell.maxAbsDeviationMm, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex flex-col justify-around text-[10px] py-1" style={{ color: "var(--text-muted)" }}>
            {rowLabels.map((l) => (
              <span key={l} className="h-8 flex items-center">
                {l}
              </span>
            ))}
          </div>
          <div className="flex-1">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {grid.map((row, r) =>
                row.map((cell, c) => (
                  <button
                    key={`${r}-${c}`}
                    className="h-8 rounded-[3px] transition-transform outline-none focus-visible:ring-2"
                    style={{
                      background: cell ? divergingColor(cell.avgDeviationMm, domainMaxMm, palette) : palette.divNeutral,
                      border:
                        selectedCell === cell
                          ? "2px solid var(--brand)"
                          : hovered === cell
                            ? "2px solid var(--text-primary)"
                            : "2px solid transparent",
                      cursor: cell && onCellClick ? "pointer" : undefined,
                    }}
                    onMouseEnter={() => cell && setHovered(cell)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => cell && setHovered(cell)}
                    onClick={() => cell && onCellClick?.(cell)}
                    aria-label={cell ? `${cellLabel(cell)}: ${formatMm(cell.avgDeviationMm, 2)}` : undefined}
                  />
                ))
              )}
            </div>
            <div className="grid gap-0.5 mt-1 text-[10px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, color: "var(--text-muted)" }}>
              {colLabels.map((l) => (
                <span key={l} className="text-center leading-tight">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {hovered && !tableView && (
        <div className="mt-2 text-xs rounded-lg px-3 py-2 inline-block" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="font-medium" style={{ color: "var(--text-primary)" }}>
            {cellLabel(hovered)}
          </div>
          <div style={{ color: "var(--text-secondary)" }}>
            {t.heatmapTable.colAvg}: <span className="tabular-nums">{formatMm(hovered.avgDeviationMm, 2)}</span> &middot;{" "}
            {t.heatmapTable.colPeak}: <span className="tabular-nums">{formatMm(hovered.maxAbsDeviationMm, 2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
