import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { api } from "../lib/api";
import { formatDate, formatMm, formatPct } from "../lib/format";
import { TrendLineChart } from "../components/TrendLineChart";
import { Sparkline } from "../components/Sparkline";
import { SeverityBadge } from "../components/SeverityBadge";
import { StatTile } from "../components/StatTile";
import { HullTimelineExplorer } from "../components/HullTimelineExplorer";
import { PrintButton } from "../components/PrintButton";
import { useLang } from "../lib/i18n";
import { DEFAULT_ASSUMPTIONS, estimateFuelImpact, estimateSurveyImpact } from "../lib/economics";
import { formatPln } from "../lib/format";

export function VesselDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { data, loading, error } = useAsync(() => api.vessel(id), [id]);

  const [scanA, setScanA] = useState<string>("");
  const [scanB, setScanB] = useState<string>("");

  const sortedScans = useMemo(() => (data ? [...data.scans].sort((a, b) => a.timestamp.localeCompare(b.timestamp)) : []), [data]);

  if (loading) return <div style={{ color: "var(--text-muted)" }}>{t.common.loadingVessel}</div>;
  if (error) return <div style={{ color: "var(--status-critical)" }}>{t.common.error}: {error}</div>;
  if (!data) return null;

  const { vessel, defects } = data;
  const effA = scanA || sortedScans[0]?.id;
  const effB = scanB || sortedScans[sortedScans.length - 1]?.id;

  const xLabels = sortedScans.map((s) => formatDate(s.timestamp, lang));
  const fuel = estimateFuelImpact(vessel, defects, DEFAULT_ASSUMPTIONS);
  const survey = estimateSurveyImpact(sortedScans.length, DEFAULT_ASSUMPTIONS);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/" className="text-xs" style={{ color: "var(--text-muted)" }}>
            &larr; {t.vessel.back}
          </Link>
          <h1 className="text-xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
            {vessel.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {t.vesselType[vessel.type]} &middot; IMO {vessel.imo} &middot; {vessel.shipyard} &middot; {vessel.homePort}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {t.vessel.length} {vessel.lengthM} m &middot; {t.vessel.beam} {vessel.beamM} m &middot; {t.vessel.inServiceSince}{" "}
            {formatDate(vessel.commissioned, lang)}
          </p>
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          <PrintButton />
          <PrintButton mode="combined" label={t.common.printFullReport} />
          <div className="no-print flex items-end gap-2 rounded-xl p-3" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <label className="text-xs flex flex-col gap-1">
            <span style={{ color: "var(--text-muted)" }}>{t.vessel.scanA}</span>
            <select
              className="rounded-md px-2 py-1.5 text-sm"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              value={effA}
              onChange={(e) => setScanA(e.target.value)}
            >
              {sortedScans.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDate(s.timestamp, lang)} - {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs flex flex-col gap-1">
            <span style={{ color: "var(--text-muted)" }}>{t.vessel.scanB}</span>
            <select
              className="rounded-md px-2 py-1.5 text-sm"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              value={effB}
              onChange={(e) => setScanB(e.target.value)}
            >
              {sortedScans.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDate(s.timestamp, lang)} - {s.label}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={effA === effB}
            onClick={() => navigate(`/vessels/${vessel.id}/compare?a=${effA}&b=${effB}`)}
            className="text-sm font-medium rounded-md px-3 py-1.5 text-white disabled:opacity-40"
            style={{ background: "var(--brand)" }}
          >
            {t.vessel.compare}
          </button>
          <Link
            to={`/vessels/${vessel.id}/economics`}
            className="text-sm font-medium rounded-md px-3 py-1.5"
            style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            {t.vessel.economicsLink}
          </Link>
          <Link
            to={`/vessels/${vessel.id}/sections`}
            className="text-sm font-medium rounded-md px-3 py-1.5"
            style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            {t.vessel.sectionsLink}
          </Link>
          </div>
        </div>
      </div>

      <div className="no-print">
        <HullTimelineExplorer vessel={data} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={t.vessel.statScanCount} value={String(sortedScans.length)} />
        <StatTile label={t.vessel.statOpenDefects} value={String(defects.filter((d) => d.status !== "naprawiona").length)} />
        <StatTile
          label={t.vessel.statLastPeak}
          value={formatMm(sortedScans[sortedScans.length - 1]?.maxDeviationMm ?? 0, 1)}
        />
        <StatTile
          label={t.vessel.statSurfaceChanged}
          value={formatPct(sortedScans[sortedScans.length - 1]?.surfaceChangedPct ?? 0)}
          hint={t.vessel.statSurfaceChangedHint}
        />
      </div>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {t.vessel.deviationChartTitle}
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {t.vessel.deviationChartSubtitle}
          </p>
          <TrendLineChart
            xLabels={xLabels}
            yFormat={(v) => `${v.toFixed(0)}mm`}
            series={[
              {
                key: "avg",
                label: t.vessel.avgDeviation,
                color: getComputedColor("--series-blue"),
                values: sortedScans.map((s) => s.avgDeviationMm),
                formatValue: (v) => formatMm(v, 2),
              },
              {
                key: "max",
                label: t.vessel.peakDeviation,
                color: getComputedColor("--series-orange"),
                values: sortedScans.map((s) => s.maxDeviationMm),
                formatValue: (v) => formatMm(v, 2),
              },
            ]}
          />
        </div>

        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {t.vessel.surfaceChartTitle}
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {t.vessel.surfaceChartSubtitle}
          </p>
          <TrendLineChart
            xLabels={xLabels}
            yFormat={(v) => `${v.toFixed(0)}%`}
            series={[
              {
                key: "pct",
                label: t.vessel.surfacePct,
                color: getComputedColor("--series-aqua"),
                values: sortedScans.map((s) => s.surfaceChangedPct),
                formatValue: (v) => formatPct(v, 2),
              },
            ]}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          {t.vessel.defectRegistry(defects.length)}
        </h2>
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-1)" }}>
                {[t.vessel.colType, t.vessel.colRegion, t.vessel.colStatus, t.vessel.colSeverity, t.vessel.colHistory, t.vessel.colDetected].map(
                  (h) => (
                    <th key={h} className="text-left p-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {defects.map((d) => {
                const last = d.history[d.history.length - 1];
                return (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/vessels/${vessel.id}/defects/${d.id}`)}
                    className="cursor-pointer"
                    style={{ borderTop: "1px solid var(--gridline)" }}
                  >
                    <td className="p-3" style={{ color: "var(--brand)" }}>
                      {t.defectType[d.type]}
                    </td>
                    <td className="p-3" style={{ color: "var(--text-secondary)" }}>
                      {d.region}
                    </td>
                    <td className="p-3" style={{ color: "var(--text-secondary)" }}>
                      {t.defectStatus[d.status]}
                    </td>
                    <td className="p-3">
                      <SeverityBadge severity={last.severity} />
                    </td>
                    <td className="p-3">
                      <Sparkline values={d.history.map((h) => h.magnitudeMm)} color={getComputedColor("--series-violet")} />
                    </td>
                    <td className="p-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(d.history.find((h) => Math.abs(h.magnitudeMm) > 0.05)?.timestamp ?? d.history[0].timestamp, lang)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          {t.vessel.scanHistory}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...sortedScans].reverse().map((s) => (
            <div key={s.id} className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {formatDate(s.timestamp, lang)}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {s.pointCount.toLocaleString(lang === "pl" ? "pl-PL" : "en-GB")} {t.vessel.points}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                {s.label}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t.vessel.technician}: {s.technician}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                <span>{t.vessel.peak} {formatMm(s.maxDeviationMm, 1)}</span>
                <span>{s.openDefectCount} {t.vessel.defectsWord}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="print-only-economics">
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          {t.economics.title}
        </h2>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          {t.economics.disclaimer}
        </p>
        {fuel.penaltyPct === 0 ? (
          <p className="text-sm mb-3" style={{ color: "var(--success-text)" }}>
            {t.economics.noFoulingSignal}
          </p>
        ) : null}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label={t.economics.statFoulingPenalty} value={`${fuel.penaltyPct.toFixed(1)}%`} hint={t.economics.statFoulingPenaltyHint} />
          <StatTile label={t.economics.statExtraFuelCost} value={formatPln(fuel.extraCostPerYearPln, lang)} hint={t.economics.statExtraFuelCostHint} />
          <StatTile
            label={t.economics.statRecoverable}
            value={formatPln(fuel.recoverableCostPerYearPln, lang)}
            deltaTone="good"
            hint={t.economics.statRecoverableHint}
          />
          <StatTile
            label={t.economics.statSurveyAvoided}
            value={formatPln(survey.avoidedCostPln, lang)}
            hint={t.economics.statSurveyAvoidedHint(survey.inspectionsPerformed)}
          />
        </div>
      </section>
    </div>
  );
}

function getComputedColor(varName: string): string {
  if (typeof window === "undefined") return "#2a78d6";
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || "#2a78d6";
}
