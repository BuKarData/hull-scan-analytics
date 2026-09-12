import { useAsync } from "../hooks/useAsync";
import { api } from "../lib/api";
import { VesselCard } from "../components/VesselCard";
import { StatTile } from "../components/StatTile";
import { useLang } from "../lib/i18n";

export function Dashboard() {
  const { t } = useLang();
  const { data, loading, error } = useAsync(() => api.vessels(), []);

  if (loading) return <div style={{ color: "var(--text-muted)" }}>{t.common.loadingFleet}</div>;
  if (error) return <div style={{ color: "var(--status-critical)" }}>{t.common.error}: {error}</div>;
  if (!data) return null;

  const totalOpen = data.reduce((sum, v) => sum + v.openDefectCount, 0);
  const critical = data.filter((v) => v.worstSeverity === "critical").length;
  const serious = data.filter((v) => v.worstSeverity === "serious").length;
  const avgMax = data.reduce((sum, v) => sum + v.latestScan.maxDeviationMm, 0) / (data.length || 1);

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex items-center gap-4 rounded-xl p-4"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
      >
        <img src="/brand/hullsight-logo.png" alt="HullSight" className="h-16 w-16 rounded-lg shrink-0" style={{ background: "#fcfcfb" }} />
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {t.dashboard.heroTitlePrefix}
            <span style={{ color: "var(--brand)" }}>{t.dashboard.heroTitleSuffix}</span>
            {t.dashboard.heroTitleTail}
          </h1>
          <p className="text-xs uppercase tracking-wide font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
            {t.common.tagline}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {t.dashboard.heroSubtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={t.dashboard.statVessels} value={String(data.length)} />
        <StatTile label={t.dashboard.statOpenDefects} value={String(totalOpen)} />
        <StatTile
          label={t.dashboard.statSeriousCritical}
          value={`${serious + critical}`}
          deltaTone={critical > 0 ? "bad" : serious > 0 ? "neutral" : "good"}
          delta={critical > 0 ? t.dashboard.statSeriousCriticalDelta(critical) : undefined}
        />
        <StatTile label={t.dashboard.statAvgPeak} value={`${avgMax.toFixed(1)} mm`} hint={t.dashboard.statAvgPeakHint} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => (
          <VesselCard key={item.vessel.id} item={item} />
        ))}
      </div>
    </div>
  );
}
