import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { api } from "../lib/api";
import { DEFECT_STATUS_LABELS, DEFECT_TYPE_LABELS, VESSEL_TYPE_LABELS } from "../lib/types";
import { formatDate, formatMm, formatPct } from "../lib/format";
import { TrendLineChart } from "../components/TrendLineChart";
import { Sparkline } from "../components/Sparkline";
import { SeverityBadge } from "../components/SeverityBadge";
import { StatTile } from "../components/StatTile";

export function VesselDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(() => api.vessel(id), [id]);

  const [scanA, setScanA] = useState<string>("");
  const [scanB, setScanB] = useState<string>("");

  const sortedScans = useMemo(() => (data ? [...data.scans].sort((a, b) => a.timestamp.localeCompare(b.timestamp)) : []), [data]);

  if (loading) return <div style={{ color: "var(--text-muted)" }}>Wczytywanie danych jednostki...</div>;
  if (error) return <div style={{ color: "var(--status-critical)" }}>Blad: {error}</div>;
  if (!data) return null;

  const { vessel, defects } = data;
  const effA = scanA || sortedScans[0]?.id;
  const effB = scanB || sortedScans[sortedScans.length - 1]?.id;

  const xLabels = sortedScans.map((s) => formatDate(s.timestamp));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/" className="text-xs" style={{ color: "var(--text-muted)" }}>
            &larr; Flota
          </Link>
          <h1 className="text-xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
            {vessel.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {VESSEL_TYPE_LABELS[vessel.type]} &middot; IMO {vessel.imo} &middot; {vessel.shipyard} &middot; port macierzysty:{" "}
            {vessel.homePort}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Dlugosc {vessel.lengthM} m &middot; szerokosc {vessel.beamM} m &middot; w sluzbie od {formatDate(vessel.commissioned)}
          </p>
        </div>

        <div className="flex items-end gap-2 rounded-xl p-3" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <label className="text-xs flex flex-col gap-1">
            <span style={{ color: "var(--text-muted)" }}>Skan A (wczesniejszy)</span>
            <select
              className="rounded-md px-2 py-1.5 text-sm"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              value={effA}
              onChange={(e) => setScanA(e.target.value)}
            >
              {sortedScans.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDate(s.timestamp)} - {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs flex flex-col gap-1">
            <span style={{ color: "var(--text-muted)" }}>Skan B (pozniejszy)</span>
            <select
              className="rounded-md px-2 py-1.5 text-sm"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              value={effB}
              onChange={(e) => setScanB(e.target.value)}
            >
              {sortedScans.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDate(s.timestamp)} - {s.label}
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
            Porownaj
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Liczba skanow" value={String(sortedScans.length)} />
        <StatTile label="Otwarte usterki" value={String(defects.filter((d) => d.status !== "naprawiona").length)} />
        <StatTile
          label="Ostatnie odchylenie szczytowe"
          value={formatMm(sortedScans[sortedScans.length - 1]?.maxDeviationMm ?? 0, 1)}
        />
        <StatTile
          label="Powierzchnia zmieniona (ost. skan)"
          value={formatPct(sortedScans[sortedScans.length - 1]?.surfaceChangedPct ?? 0)}
          hint="wzgledem geometrii projektowej"
        />
      </div>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            Odchylenie od geometrii projektowej
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Srednie i szczytowe odchylenie kadluba wzgledem stanu odniesienia, w kolejnych przegladach.
          </p>
          <TrendLineChart
            xLabels={xLabels}
            yFormat={(v) => `${v.toFixed(0)}mm`}
            series={[
              {
                key: "avg",
                label: "Srednie |odchylenie|",
                color: getComputedColor("--series-blue"),
                values: sortedScans.map((s) => s.avgDeviationMm),
                formatValue: (v) => formatMm(v, 2),
              },
              {
                key: "max",
                label: "Szczytowe |odchylenie|",
                color: getComputedColor("--series-orange"),
                values: sortedScans.map((s) => s.maxDeviationMm),
                formatValue: (v) => formatMm(v, 2),
              },
            ]}
          />
        </div>

        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            Powierzchnia kadluba objeta zmiana
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Odsetek powierzchni ze zmiana wieksza niz prog szumu skanu (1.2&nbsp;mm).
          </p>
          <TrendLineChart
            xLabels={xLabels}
            yFormat={(v) => `${v.toFixed(0)}%`}
            series={[
              {
                key: "pct",
                label: "% powierzchni zmienionej",
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
          Rejestr usterek ({defects.length})
        </h2>
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-1)" }}>
                {["Typ", "Rejon kadluba", "Status", "Aktualne nasilenie", "Historia (mm)", "Wykryto"].map((h) => (
                  <th key={h} className="text-left p-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {defects.map((d) => {
                const last = d.history[d.history.length - 1];
                return (
                  <tr key={d.id} style={{ borderTop: "1px solid var(--gridline)" }}>
                    <td className="p-3" style={{ color: "var(--text-primary)" }}>
                      {DEFECT_TYPE_LABELS[d.type]}
                    </td>
                    <td className="p-3" style={{ color: "var(--text-secondary)" }}>
                      {d.region}
                    </td>
                    <td className="p-3" style={{ color: "var(--text-secondary)" }}>
                      {DEFECT_STATUS_LABELS[d.status]}
                    </td>
                    <td className="p-3">
                      <SeverityBadge severity={last.severity} />
                    </td>
                    <td className="p-3">
                      <Sparkline values={d.history.map((h) => h.magnitudeMm)} color={getComputedColor("--series-violet")} />
                    </td>
                    <td className="p-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(d.history.find((h) => Math.abs(h.magnitudeMm) > 0.05)?.timestamp ?? d.history[0].timestamp)}
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
          Historia skanow
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...sortedScans].reverse().map((s) => (
            <div key={s.id} className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {formatDate(s.timestamp)}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {s.pointCount.toLocaleString("pl-PL")} pkt
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                {s.label}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Technik: {s.technician}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                <span>szczyt {formatMm(s.maxDeviationMm, 1)}</span>
                <span>{s.openDefectCount} usterek</span>
              </div>
            </div>
          ))}
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
