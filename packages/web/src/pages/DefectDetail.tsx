import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { api } from "../lib/api";
import { formatDate, formatMm } from "../lib/format";
import { useLang } from "../lib/i18n";
import { SeverityBadge } from "../components/SeverityBadge";
import { TrendLineChart } from "../components/TrendLineChart";
import { HullViewer } from "../components/HullViewer";
import { PrintButton } from "../components/PrintButton";
import { VesselModeNav } from "../components/VesselModeNav";
import { pointsNearUV, regionLabelFromUV } from "../lib/geometry";
import { sectionIndexForU, sectionLabel } from "../lib/sections";
import { summarizeDefect } from "../lib/defectSummary";

function getComputedColor(varName: string): string {
  if (typeof window === "undefined") return "#2a78d6";
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || "#2a78d6";
}

export function DefectDetail() {
  const { id = "", defectId = "" } = useParams();
  const { lang, t } = useLang();
  const { data, loading, error } = useAsync(() => api.vessel(id), [id]);

  const defect = data?.defects.find((d) => d.id === defectId) ?? null;
  const sortedScans = useMemo(() => (data ? [...data.scans].sort((a, b) => a.timestamp.localeCompare(b.timestamp)) : []), [data]);
  const latestScanId = sortedScans[sortedScans.length - 1]?.id ?? "";
  const scanQ = useAsync(() => (latestScanId ? api.scan(latestScanId) : Promise.resolve(null)), [latestScanId]);

  const highlightPositions = useMemo(() => {
    if (!defect || !scanQ.data) return undefined;
    return pointsNearUV(scanQ.data.pointCloud.positions, scanQ.data.pointCloud.uv, defect.uv.u, defect.uv.v);
  }, [defect, scanQ.data]);

  const layers = useMemo(() => {
    if (!scanQ.data) return [];
    return [
      {
        key: "latest",
        positions: scanQ.data.pointCloud.positions,
        colors: scanQ.data.pointCloud.baseColor,
        normals: scanQ.data.pointCloud.normals,
        indices: scanQ.data.pointCloud.indices,
        size: 1,
        opacity: 1,
        pickable: false,
      },
    ];
  }, [scanQ.data]);

  if (loading) return <div style={{ color: "var(--text-muted)" }}>{t.common.loadingVessel}</div>;
  if (error) return <div style={{ color: "var(--status-critical)" }}>{t.common.error}: {error}</div>;
  if (!data) return null;
  if (!defect) return <div style={{ color: "var(--status-critical)" }}>{t.defectDetail.notFound}</div>;

  const { vessel } = data;
  const summary = summarizeDefect(defect);
  const { history, last, firstNonZero, growthPct } = summary;
  const section = sectionIndexForU(defect.uv.u);
  const regionUvLabel = regionLabelFromUV(defect.uv.u, defect.uv.v, t.region.lengthBands, t.region.girthSectorsLower);

  const narrative = t.defectDetail.narrative({
    typeLabel: t.defectType[defect.type],
    firstDate: formatDate(firstNonZero.timestamp, lang),
    trend: growthPct > 8 ? t.defectDetail.trendGrowing : growthPct < -8 ? t.defectDetail.trendShrinking : t.defectDetail.trendStable,
    growthPct: Math.abs(Math.round(growthPct)),
    statusLabel: t.defectStatus[defect.status].toLowerCase(),
    lastMm: formatMm(last.magnitudeMm, 2),
  });

  return (
    <div className="flex flex-col gap-6 [&>*]:min-w-0">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link to={`/vessels/${vessel.id}`} className="text-xs" style={{ color: "var(--text-muted)" }}>
            &larr; {vessel.name}
          </Link>
          <h1 className="text-xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
            {t.defectType[defect.type]}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {defect.region} &middot; {regionUvLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={last.severity} />
          <PrintButton />
        </div>
      </div>

      <VesselModeNav vesselId={vessel.id} baselineId={data.baseline.id} latestScanId={latestScanId} />

      <div className="rounded-xl p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <span style={{ color: "var(--text-secondary)" }}>
          {t.defectDetail.status}: <strong style={{ color: "var(--text-primary)" }}>{t.defectStatus[defect.status]}</strong>
        </span>
        <span style={{ color: "var(--text-secondary)" }}>
          {t.defectDetail.firstDetected}: <strong style={{ color: "var(--text-primary)" }}>{formatDate(firstNonZero.timestamp, lang)}</strong>
        </span>
        <span style={{ color: "var(--text-secondary)" }}>
          {t.defectDetail.currentMagnitude}: <strong className="tabular-nums" style={{ color: "var(--text-primary)" }}>{formatMm(last.magnitudeMm, 2)}</strong>
        </span>
        <Link to={`/vessels/${vessel.id}/sections?highlight=${section}`} style={{ color: "var(--brand)" }}>
          {t.defectDetail.viewSection(sectionLabel(section, t.hullSections.sectionWord))} &rarr;
        </Link>
      </div>

      <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>
          {narrative}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4">
        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {t.defectDetail.locationTitle}
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {t.defectDetail.locationSubtitle}
          </p>
          {!scanQ.data ? (
            <div className="h-[320px] flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              {t.common.loadingModel}
            </div>
          ) : (
            <HullViewer height={320} renderMode="mesh" layers={layers} highlightPositions={highlightPositions} focusPositions={highlightPositions} resetViewKey={`${vessel.id}-${defect.id}`} />
          )}
        </div>

        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {t.defectDetail.historyTitle}
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {t.defectDetail.historySubtitle}
          </p>
          <TrendLineChart
            height={220}
            xLabels={history.map((h) => formatDate(h.timestamp, lang))}
            yFormat={(v) => `${v.toFixed(0)}mm`}
            series={[
              {
                key: "magnitude",
                label: t.defectDetail.magnitudeSeries,
                color: getComputedColor("--series-violet"),
                values: history.map((h) => h.magnitudeMm),
                formatValue: (v) => formatMm(v, 2),
              },
            ]}
          />
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          {t.defectDetail.observationsTitle(defect.history.length)}
        </h2>
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-1)" }}>
                {[t.defectDetail.colDate, t.defectDetail.colMagnitude, t.defectDetail.colSeverity].map((h) => (
                  <th key={h} className="text-left p-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...defect.history].reverse().map((h) => (
                <tr key={h.scanId} style={{ borderTop: "1px solid var(--gridline)" }}>
                  <td className="p-3" style={{ color: "var(--text-primary)" }}>
                    {formatDate(h.timestamp, lang)}
                  </td>
                  <td className="p-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                    {formatMm(h.magnitudeMm, 2)}
                  </td>
                  <td className="p-3">
                    <SeverityBadge severity={h.severity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
