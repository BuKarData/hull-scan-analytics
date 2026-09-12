import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { api } from "../lib/api";
import { formatDate, formatMm, formatPct } from "../lib/format";
import { StatTile } from "../components/StatTile";
import { HullViewer, type PointLayer, type RenderMode } from "../components/HullViewer";
import { RegionHeatmap } from "../components/RegionHeatmap";
import { divergingRgb01, useResolvedPalette } from "../lib/theme";
import { useLang } from "../lib/i18n";

type ViewMode = "heatmap" | "overlay" | "raw-a" | "raw-b";

export function Compare() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const a = params.get("a") ?? "";
  const b = params.get("b") ?? "";
  const { lang, t } = useLang();

  const vesselQ = useAsync(() => api.vessel(id), [id]);
  const scanAQ = useAsync(() => api.scan(a), [a]);
  const scanBQ = useAsync(() => api.scan(b), [b]);
  const cmpQ = useAsync(() => api.compare(a, b), [a, b]);

  const [mode, setMode] = useState<ViewMode>("heatmap");
  const [renderMode, setRenderMode] = useState<RenderMode>("mesh");
  const [sizeScale, setSizeScale] = useState(1);
  const palette = useResolvedPalette();

  const loading = vesselQ.loading || scanAQ.loading || scanBQ.loading || cmpQ.loading;
  const error = vesselQ.error || scanAQ.error || scanBQ.error || cmpQ.error;

  const heatmapColors = useMemo(() => {
    if (!cmpQ.data) return null;
    const domain = Math.max(2, cmpQ.data.stats.maxAbsDeviationMm);
    const arr = new Float32Array(cmpQ.data.deviationMm.length * 3);
    cmpQ.data.deviationMm.forEach((dev, i) => {
      const [r, g, bch] = divergingRgb01(dev, domain, palette);
      arr[i * 3] = r;
      arr[i * 3 + 1] = g;
      arr[i * 3 + 2] = bch;
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmpQ.data, palette.mode]);

  const layers: PointLayer[] = useMemo(() => {
    if (!cmpQ.data || !scanAQ.data || !scanBQ.data) return [];
    const indicesA = scanAQ.data.pointCloud.indices;
    const indicesB = scanBQ.data.pointCloud.indices;
    if (mode === "raw-a") {
      return [
        {
          key: "a",
          positions: scanAQ.data.pointCloud.positions,
          colors: scanAQ.data.pointCloud.baseColor,
          normals: scanAQ.data.pointCloud.normals,
          indices: indicesA,
          size: 1,
          opacity: 1,
        },
      ];
    }
    if (mode === "raw-b") {
      return [
        {
          key: "b",
          positions: scanBQ.data.pointCloud.positions,
          colors: scanBQ.data.pointCloud.baseColor,
          normals: scanBQ.data.pointCloud.normals,
          indices: indicesB,
          size: 1,
          opacity: 1,
        },
      ];
    }
    if (mode === "heatmap") {
      return [
        {
          key: "b-heat",
          positions: cmpQ.data.positions,
          colors: heatmapColors ?? [],
          normals: scanBQ.data.pointCloud.normals,
          indices: indicesB,
          size: 1,
          opacity: 1,
        },
      ];
    }
    // overlay: skan A jako "duch" w tle, skan B kolorowany heatmapa na wierzchu
    const ghost = new Float32Array(scanAQ.data.pointCloud.positions.length);
    for (let i = 0; i < ghost.length; i++) ghost[i] = 0.55;
    return [
      {
        key: "a-ghost",
        positions: scanAQ.data.pointCloud.positions,
        colors: ghost,
        normals: scanAQ.data.pointCloud.normals,
        indices: indicesA,
        size: 0.7,
        opacity: 0.25,
      },
      {
        key: "b-heat",
        positions: cmpQ.data.positions,
        colors: heatmapColors ?? [],
        normals: scanBQ.data.pointCloud.normals,
        indices: indicesB,
        size: 1,
        opacity: 0.95,
      },
    ];
  }, [mode, cmpQ.data, scanAQ.data, scanBQ.data, heatmapColors]);

  if (loading) return <div style={{ color: "var(--text-muted)" }}>{t.common.loadingCompare}</div>;
  if (error) return <div style={{ color: "var(--status-critical)" }}>{t.common.error}: {error}</div>;
  if (!cmpQ.data || !vesselQ.data) return null;

  const { stats, clusters, regionGrid, scanA, scanB } = cmpQ.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={`/vessels/${id}`} className="text-xs" style={{ color: "var(--text-muted)" }}>
          &larr; {vesselQ.data.vessel.name}
        </Link>
        <h1 className="text-xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
          {t.compare.title}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>{formatDate(scanA.timestamp, lang)}</strong> ({scanA.label}) vs{" "}
          <strong style={{ color: "var(--text-primary)" }}>{formatDate(scanB.timestamp, lang)}</strong> ({scanB.label})
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={t.compare.statAvgAbs} value={formatMm(stats.avgAbsDeviationMm, 2)} />
        <StatTile label={t.compare.statPeakAbs} value={formatMm(stats.maxAbsDeviationMm, 2)} deltaTone={stats.maxAbsDeviationMm > 4 ? "bad" : "neutral"} />
        <StatTile label={t.compare.statSurfaceChanged} value={formatPct(stats.surfaceChangedPct, 2)} hint={t.compare.statSurfaceChangedHint(stats.noiseThresholdMm)} />
        <StatTile label={t.compare.statClusters} value={String(clusters.length)} />
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {t.compare.model3d}
            </h2>
            <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              {(
                [
                  ["heatmap", t.compare.modeHeatmap],
                  ["overlay", t.compare.modeOverlay],
                  ["raw-a", t.compare.modeRawA],
                  ["raw-b", t.compare.modeRawB],
                ] as [ViewMode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="text-xs font-medium rounded-full px-2.5 py-1"
                  style={{
                    background: mode === m ? "var(--brand)" : "transparent",
                    color: mode === m ? "white" : "var(--text-secondary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t.vessel.viewMode}:
            </span>
            <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              {(
                [
                  ["points", t.vessel.viewModePoints],
                  ["mesh", t.vessel.viewModeMesh],
                ] as [RenderMode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setRenderMode(m)}
                  className="text-xs font-medium rounded-full px-2.5 py-1"
                  style={{
                    background: renderMode === m ? "var(--brand)" : "transparent",
                    color: renderMode === m ? "white" : "var(--text-secondary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <HullViewer layers={layers} sizeScale={sizeScale} renderMode={renderMode} />

          <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            {renderMode === "points" && (
              <label className="flex items-center gap-2">
                {t.vessel.pointSize}
                <input
                  type="range"
                  className="slim-range"
                  min={0.3}
                  max={3}
                  step={0.02}
                  value={sizeScale}
                  onChange={(e) => setSizeScale(Number(e.target.value))}
                />
              </label>
            )}
            <span style={{ color: "var(--text-muted)" }}>{t.vessel.controlsHint}</span>
          </div>

          {mode === "heatmap" || mode === "overlay" ? (
            <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span
                className="inline-block h-2 w-24 rounded"
                style={{
                  background: `linear-gradient(90deg, ${palette.divRed[3]}, ${palette.divNeutral}, ${palette.seqBlue[3]})`,
                }}
              />
              <span>{formatMm(-stats.maxAbsDeviationMm)} {t.compare.dentLoss}</span>
              <span>&middot;</span>
              <span>{t.compare.noChange}</span>
              <span>&middot;</span>
              <span>{formatMm(stats.maxAbsDeviationMm)} {t.compare.bulge}</span>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {t.compare.regionHeatmapTitle}
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {t.compare.regionHeatmapSubtitle}
          </p>
          <RegionHeatmap
            rows={regionGrid.rows}
            cols={regionGrid.cols}
            cells={regionGrid.cells}
            domainMaxMm={stats.maxAbsDeviationMm}
            rowLabels={t.region.lengthBands as unknown as string[]}
            colLabels={t.region.girthSectors as unknown as string[]}
          />
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          {t.compare.clustersTitle(clusters.length)}
        </h2>
        {clusters.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t.compare.clustersEmpty(stats.noiseThresholdMm)}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {[t.compare.colSuggestedType, t.compare.colNature, t.compare.colPeak, t.compare.colMean, t.compare.colArea, t.compare.colMatchedDefect].map(
                    (h) => (
                      <th key={h} className="text-left p-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {clusters.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--gridline)" }}>
                    <td className="p-3" style={{ color: "var(--text-primary)" }}>
                      {t.defectType[c.suggestedType]}
                    </td>
                    <td className="p-3" style={{ color: "var(--text-secondary)" }}>
                      {c.sign === "dent" ? t.compare.natureDent : t.compare.natureBulge}
                    </td>
                    <td className="p-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {formatMm(c.peakDeviationMm, 2)}
                    </td>
                    <td className="p-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {formatMm(c.meanDeviationMm, 2)}
                    </td>
                    <td className="p-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {c.areaPointCount}
                    </td>
                    <td className="p-3" style={{ color: c.matchedDefectId ? "var(--text-secondary)" : "var(--status-warning)" }}>
                      {c.matchedDefectId ?? t.compare.noMatch}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
