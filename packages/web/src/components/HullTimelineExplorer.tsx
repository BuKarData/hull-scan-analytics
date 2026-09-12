import { useMemo, useState } from "react";
import type { VesselDetailResponse } from "../lib/types";
import { useAsync } from "../hooks/useAsync";
import { api } from "../lib/api";
import { HullViewer, type PickInfo, type RenderMode } from "./HullViewer";
import { TimelineSlider, type TimelineItem } from "./TimelineSlider";
import { SeverityBadge } from "./SeverityBadge";
import { Sparkline } from "./Sparkline";
import { findNearestDefect, regionLabelFromUV, uvFromIndex } from "../lib/geometry";
import { formatDate, formatMm } from "../lib/format";
import { useLang } from "../lib/i18n";

const SEVERITY_RANK = { good: 0, warning: 1, serious: 2, critical: 3 } as const;

export function HullTimelineExplorer({ vessel }: { vessel: VesselDetailResponse }) {
  const { lang, t } = useLang();

  const items: TimelineItem[] = useMemo(() => {
    const fromMilestones: TimelineItem[] = vessel.constructionMilestones.map((m) => ({
      id: m.id,
      timestamp: m.timestamp,
      label: m.label,
      phase: m.phase,
    }));
    const baselineItem: TimelineItem = {
      id: vessel.baseline.id,
      timestamp: vessel.baseline.timestamp,
      label: vessel.baseline.label,
      phase: vessel.baseline.phase,
    };
    const fromScans: TimelineItem[] = vessel.scans.map((s) => {
      let worst: keyof typeof SEVERITY_RANK = "good";
      for (const d of vessel.defects) {
        const obs = d.history.find((h) => h.scanId === s.id);
        if (obs && SEVERITY_RANK[obs.severity] > SEVERITY_RANK[worst]) worst = obs.severity;
      }
      return { id: s.id, timestamp: s.timestamp, label: s.label, phase: s.phase, severity: worst };
    });
    return [...fromMilestones, baselineItem, ...fromScans].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [vessel]);

  const [index, setIndex] = useState(items.length - 1);
  const [sizeScale, setSizeScale] = useState(1);
  const [renderMode, setRenderMode] = useState<RenderMode>("points");
  const [pick, setPick] = useState<{ u: number; v: number } | null>(null);

  const current = items[index];
  const scanQ = useAsync(() => api.scan(current.id), [current.id]);
  const milestoneMeta = vessel.constructionMilestones.find((m) => m.id === current.id);

  const grid = scanQ.data?.pointCloud.grid;
  const nearestDefect = useMemo(() => {
    if (!pick || current.phase !== "eksploatacja") return null;
    return findNearestDefect(pick.u, pick.v, vessel.defects);
  }, [pick, current.phase, vessel.defects]);

  function handlePickEvent(info: PickInfo | null) {
    if (!info || !grid) {
      setPick(null);
      return;
    }
    setPick(uvFromIndex(info.index, grid.uSteps, grid.vSteps));
  }

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {t.vessel.timelineTitle}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.vessel.timelineSubtitle}
          </p>
        </div>
      </div>

      <TimelineSlider
        items={items}
        index={index}
        onChange={(i) => {
          setIndex(i);
          setPick(null);
        }}
      />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mt-4">
        <div>
          {scanQ.loading || !scanQ.data ? (
            <div className="h-[380px] flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              {t.common.loadingModel}
            </div>
          ) : (
            <HullViewer
              height={380}
              sizeScale={sizeScale}
              renderMode={renderMode}
              layers={[
                {
                  key: current.id,
                  positions: scanQ.data.pointCloud.positions,
                  colors: scanQ.data.pointCloud.baseColor,
                  normals: scanQ.data.pointCloud.normals,
                  grid: scanQ.data.pointCloud.grid,
                  size: 1,
                  opacity: 1,
                  pickable: true,
                },
              ]}
              onHover={handlePickEvent}
              onPick={handlePickEvent}
            />
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs" style={{ color: "var(--text-secondary)" }}>
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
        </div>

        <div className="rounded-lg p-3 text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="mb-3">
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              {current.phase === "budowa" ? t.vessel.phaseBuild : t.vessel.phaseInspectionOrRef}
            </div>
            <div className="font-medium" style={{ color: "var(--text-primary)" }}>
              {current.label}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {formatDate(current.timestamp, lang)}
              {scanQ.data?.technician && scanQ.data.technician !== "-" ? ` · ${t.vessel.technician.toLowerCase()}: ${scanQ.data.technician}` : ""}
            </div>
            {milestoneMeta?.description && (
              <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                {milestoneMeta.description}
              </p>
            )}
            {scanQ.data && current.phase === "eksploatacja" && current.id !== vessel.baseline.id && (
              <div className="flex gap-3 mt-2 text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                <span>
                  {t.vessel.peakDeviationShort}: {formatMm(scanQ.data.maxDeviationMm, 1)}
                </span>
                <span>
                  {t.vessel.defectsShort}: {scanQ.data.openDefectCount}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-xs uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
              {t.vessel.pointDescriptionTitle}
            </div>
            {!pick && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t.vessel.pointDescriptionHint}
              </p>
            )}
            {pick && (
              <div className="flex flex-col gap-2">
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {t.vessel.section}:{" "}
                  <span style={{ color: "var(--text-primary)" }}>
                    {regionLabelFromUV(pick.u, pick.v, t.region.lengthBands, t.region.girthSectorsLower)}
                  </span>
                </div>
                {current.phase === "budowa" ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t.vessel.underConstructionNoData}
                  </p>
                ) : nearestDefect ? (
                  <div className="rounded-md p-2" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-xs" style={{ color: "var(--text-primary)" }}>
                        {t.defectType[nearestDefect.type]}
                      </span>
                      <SeverityBadge severity={nearestDefect.history[nearestDefect.history.length - 1].severity} />
                    </div>
                    <div className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                      {nearestDefect.region} &middot; {t.vessel.colStatus.toLowerCase()}: {t.defectStatus[nearestDefect.status]}
                    </div>
                    <Sparkline values={nearestDefect.history.map((h) => h.magnitudeMm)} width={140} height={30} />
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t.vessel.noDefectHere}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
