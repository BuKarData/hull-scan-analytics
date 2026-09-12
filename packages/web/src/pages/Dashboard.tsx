import { useAsync } from "../hooks/useAsync";
import { api } from "../lib/api";
import { VesselCard } from "../components/VesselCard";
import { StatTile } from "../components/StatTile";

export function Dashboard() {
  const { data, loading, error } = useAsync(() => api.vessels(), []);

  if (loading) return <div style={{ color: "var(--text-muted)" }}>Wczytywanie floty...</div>;
  if (error) return <div style={{ color: "var(--status-critical)" }}>Blad: {error}</div>;
  if (!data) return null;

  const totalOpen = data.reduce((sum, v) => sum + v.openDefectCount, 0);
  const critical = data.filter((v) => v.worstSeverity === "critical").length;
  const serious = data.filter((v) => v.worstSeverity === "serious").length;
  const avgMax = data.reduce((sum, v) => sum + v.latestScan.maxDeviationMm, 0) / (data.length || 1);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Przeglad floty
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Stan kadlubow na podstawie ostatnich skanow 3D (Gaussian Splatting). Wybierz jednostke, aby zobaczyc
          historie przegladow, rejestr usterek i porownanie skanow.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Jednostki we flocie" value={String(data.length)} />
        <StatTile label="Otwarte usterki (laczne)" value={String(totalOpen)} />
        <StatTile
          label="Jednostki: stan powazny/krytyczny"
          value={`${serious + critical}`}
          deltaTone={critical > 0 ? "bad" : serious > 0 ? "neutral" : "good"}
          delta={critical > 0 ? `w tym ${critical} krytyczne` : undefined}
        />
        <StatTile label="Srednie odchylenie szczytowe" value={`${avgMax.toFixed(1)} mm`} hint="wzgledem geometrii projektowej" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => (
          <VesselCard key={item.vessel.id} item={item} />
        ))}
      </div>
    </div>
  );
}
