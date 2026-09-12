import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { api } from "../lib/api";
import { formatMm } from "../lib/format";
import { useLang } from "../lib/i18n";
import { HullViewer } from "../components/HullViewer";
import { SeverityBadge } from "../components/SeverityBadge";
import { VesselModeNav } from "../components/VesselModeNav";
import { divergingColor, useResolvedPalette } from "../lib/theme";
import { vesselDeviationDomain } from "../lib/geometry";
import { buildHullSections, computeSectionStats, positionsInSection, sectionLabel, type SectionStats } from "../lib/sections";

export function HullSections() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const { t } = useLang();
  const palette = useResolvedPalette();
  const { data, loading, error } = useAsync(() => api.vessel(id), [id]);

  const sortedScans = useMemo(() => (data ? [...data.scans].sort((a, b) => a.timestamp.localeCompare(b.timestamp)) : []), [data]);
  const latestScanId = sortedScans[sortedScans.length - 1]?.id ?? "";
  const scanQ = useAsync(() => (latestScanId ? api.scan(latestScanId) : Promise.resolve(null)), [latestScanId]);
  const baselineId = data?.baseline.id ?? "";
  const compareQ = useAsync(
    () => (baselineId && latestScanId ? api.compare(baselineId, latestScanId) : Promise.resolve(null)),
    [baselineId, latestScanId]
  );

  const sections = useMemo(() => buildHullSections(), []);
  const domain = useMemo(() => (data ? vesselDeviationDomain(data.scans) : 2), [data]);

  const stats: SectionStats[] | null = useMemo(() => {
    if (!data || !scanQ.data || !compareQ.data) return null;
    return computeSectionStats(sections, scanQ.data.pointCloud.uv, compareQ.data.deviationMm, data.defects);
  }, [data, scanQ.data, compareQ.data, sections]);

  const highlightParam = Number(params.get("highlight"));
  const [selected, setSelected] = useState<number>(Number.isFinite(highlightParam) ? Math.min(sections.length - 1, Math.max(0, highlightParam)) : 0);

  const highlightPositions = useMemo(() => {
    if (!scanQ.data) return undefined;
    return positionsInSection(scanQ.data.pointCloud.positions, scanQ.data.pointCloud.uv, sections[selected]);
  }, [scanQ.data, sections, selected]);

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

  const { vessel } = data;
  const selectedStats = stats?.[selected];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={`/vessels/${vessel.id}`} className="text-xs" style={{ color: "var(--text-muted)" }}>
          &larr; {vessel.name}
        </Link>
        <h1 className="text-xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
          {t.hullSections.title}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {t.hullSections.subtitle}
        </p>
      </div>

      <VesselModeNav vesselId={vessel.id} baselineId={baselineId} latestScanId={latestScanId} />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {sections.map((section) => {
          const stat = stats?.[section.index];
          const color = stat ? divergingColor(stat.peakDeviationMm, domain, palette) : palette.divNeutral;
          const isSelected = section.index === selected;
          return (
            <button
              key={section.index}
              onClick={() => setSelected(section.index)}
              className="rounded-lg p-3 text-left transition-transform"
              style={{
                background: "var(--surface-1)",
                border: isSelected ? "2px solid var(--brand)" : "1px solid var(--border)",
              }}
            >
              <div className="h-2 rounded-full mb-2" style={{ background: color }} />
              <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {sectionLabel(section.index, t.hullSections.sectionWord)}
              </div>
              <div className="text-[11px] mt-1 tabular-nums" style={{ color: "var(--text-muted)" }}>
                {t.hullSections.cardPeak}: {stat ? formatMm(stat.peakDeviationMm, 1) : "-"}
              </div>
              <div className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                {t.hullSections.cardDefects}: {stat?.defects.length ?? 0}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {t.hullSections.detailTitle(sectionLabel(selected, t.hullSections.sectionWord))}
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {t.hullSections.detailSubtitle}
          </p>
          {!scanQ.data ? (
            <div className="h-[360px] flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              {t.common.loadingModel}
            </div>
          ) : (
            <HullViewer
              height={360}
              renderMode="mesh"
              layers={layers}
              highlightPositions={highlightPositions}
              focusPositions={highlightPositions}
              resetViewKey={`${vessel.id}-${selected}`}
            />
          )}
        </div>

        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {t.hullSections.cardAvg}
              </div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {selectedStats ? formatMm(selectedStats.avgDeviationMm, 2) : "-"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {t.hullSections.cardPeak}
              </div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {selectedStats ? formatMm(selectedStats.peakDeviationMm, 2) : "-"}
              </div>
            </div>
          </div>

          <h3 className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
            {t.hullSections.defectsInSection}
          </h3>
          {!selectedStats || selectedStats.defects.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t.hullSections.noDefects}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedStats.defects.map((d) => (
                <Link
                  key={d.id}
                  to={`/vessels/${vessel.id}/defects/${d.id}`}
                  className="rounded-lg p-2.5 flex items-center justify-between gap-2"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <div>
                    <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {t.defectType[d.type]}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {d.region}
                    </div>
                  </div>
                  <SeverityBadge severity={d.history[d.history.length - 1].severity} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
