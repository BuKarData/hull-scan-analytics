import { Link } from "react-router-dom";
import type { VesselListItem } from "../lib/types";
import { SeverityBadge } from "./SeverityBadge";
import { formatDate, formatMm } from "../lib/format";
import { useLang } from "../lib/i18n";

export function VesselCard({ item }: { item: VesselListItem }) {
  const { lang, t } = useLang();
  const { vessel, latestScan, scanCount, openDefectCount, worstSeverity, avgDeviationTrendMm } = item;
  const trendTone = avgDeviationTrendMm > 0.02 ? "bad" : avgDeviationTrendMm < -0.02 ? "good" : "neutral";
  const trendVar = trendTone === "bad" ? "var(--status-critical)" : trendTone === "good" ? "var(--success-text)" : "var(--text-muted)";

  return (
    <Link
      to={`/vessels/${vessel.id}`}
      className="block rounded-xl p-5 transition-shadow hover:shadow-md"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
            {vessel.name}
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.vesselType[vessel.type]} &middot; {vessel.homePort} &middot; {vessel.shipyard}
          </p>
        </div>
        <SeverityBadge severity={worstSeverity} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
        <div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.dashboard.openDefects}
          </div>
          <div className="tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
            {openDefectCount}
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.dashboard.peakDeviation}
          </div>
          <div className="tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
            {formatMm(latestScan.maxDeviationMm, 1)}
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.dashboard.trendSinceLast}
          </div>
          <div className="tabular-nums font-medium" style={{ color: trendVar }}>
            {avgDeviationTrendMm >= 0 ? "+" : ""}
            {avgDeviationTrendMm.toFixed(2)} mm
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>
          {t.dashboard.scansCount(scanCount)} &middot; {t.dashboard.lastScan}: {formatDate(latestScan.timestamp, lang)}
        </span>
        <span style={{ color: "var(--brand)" }}>{t.dashboard.viewHistory} &rarr;</span>
      </div>
    </Link>
  );
}
