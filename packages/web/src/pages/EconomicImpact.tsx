import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { api } from "../lib/api";
import { formatPln } from "../lib/format";
import { useLang } from "../lib/i18n";
import { StatTile } from "../components/StatTile";
import { PrintButton } from "../components/PrintButton";
import { VesselModeNav } from "../components/VesselModeNav";
import { DEFAULT_ASSUMPTIONS, estimateFuelImpact, estimateSurveyImpact, type EconomicAssumptions } from "../lib/economics";

function AssumptionField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <input
        type="number"
        className="rounded-md px-2 py-1.5 text-sm tabular-nums"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        value={value}
        step={step}
        min={0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  );
}

export function EconomicImpact() {
  const { id = "" } = useParams();
  const { lang, t } = useLang();
  const { data, loading, error } = useAsync(() => api.vessel(id), [id]);
  const [assumptions, setAssumptions] = useState<EconomicAssumptions>(DEFAULT_ASSUMPTIONS);

  const fuel = useMemo(
    () => (data ? estimateFuelImpact(data.vessel, data.defects, assumptions) : null),
    [data, assumptions]
  );
  const survey = useMemo(() => (data ? estimateSurveyImpact(data.scans.length, assumptions) : null), [data, assumptions]);

  if (loading) return <div style={{ color: "var(--text-muted)" }}>{t.common.loadingVessel}</div>;
  if (error) return <div style={{ color: "var(--status-critical)" }}>{t.common.error}: {error}</div>;
  if (!data || !fuel || !survey) return null;

  const { vessel } = data;
  const sortedScans = [...data.scans].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const latestScanId = sortedScans[sortedScans.length - 1]?.id;
  const withoutTotal = fuel.annualFuelTonnes + fuel.extraTonnesPerYear;
  const withTotal = fuel.annualFuelTonnes + (fuel.extraTonnesPerYear - fuel.recoverableTonnesPerYear);
  const maxTotal = Math.max(withoutTotal, withTotal, 1);
  const hasFouling = fuel.penaltyPct > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link to={`/vessels/${vessel.id}`} className="text-xs" style={{ color: "var(--text-muted)" }}>
            &larr; {t.economics.back}
          </Link>
          <h1 className="text-xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
            {vessel.name} &middot; {t.economics.title}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {t.economics.subtitle}
          </p>
        </div>
        <PrintButton />
      </div>

      <VesselModeNav vesselId={vessel.id} baselineId={data.baseline.id} latestScanId={latestScanId} />

      <div className="rounded-xl p-4 text-xs" style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
        {t.economics.disclaimer}
      </div>

      <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          {t.economics.assumptionsTitle}
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <AssumptionField
            label={t.economics.assumptionFuelPrice}
            value={assumptions.fuelPricePlnPerTonne}
            step={50}
            onChange={(v) => setAssumptions((a) => ({ ...a, fuelPricePlnPerTonne: v }))}
          />
          <AssumptionField
            label={t.economics.assumptionOperatingDays}
            value={assumptions.operatingDaysPerYear}
            step={5}
            onChange={(v) => setAssumptions((a) => ({ ...a, operatingDaysPerYear: v }))}
          />
          <AssumptionField
            label={t.economics.assumptionSurveyCost}
            value={assumptions.traditionalSurveyCostPln}
            step={1000}
            onChange={(v) => setAssumptions((a) => ({ ...a, traditionalSurveyCostPln: v }))}
          />
        </div>
      </div>

      {!hasFouling && (
        <div className="rounded-xl p-4 text-sm" style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--success-text)" }}>
          {t.economics.noFoulingSignal}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label={t.economics.statFoulingPenalty}
          value={`${fuel.penaltyPct.toFixed(1)}%`}
          hint={t.economics.statFoulingPenaltyHint}
        />
        <StatTile
          label={t.economics.statExtraFuelCost}
          value={formatPln(fuel.extraCostPerYearPln, lang)}
          hint={t.economics.statExtraFuelCostHint}
        />
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

      {hasFouling && (
        <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {t.economics.chartTitle}
          </h2>
          <div className="flex flex-col gap-4">
            {[
              { label: t.economics.chartWithout, base: fuel.annualFuelTonnes, penalty: fuel.extraTonnesPerYear, total: withoutTotal },
              { label: t.economics.chartWith, base: fuel.annualFuelTonnes, penalty: withTotal - fuel.annualFuelTonnes, total: withTotal },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="text-xs w-40 shrink-0" style={{ color: "var(--text-secondary)" }}>
                  {row.label}
                </div>
                <div className="flex-1 h-6 rounded-md overflow-hidden flex" style={{ background: "var(--div-neutral)" }}>
                  <div style={{ width: `${(row.base / maxTotal) * 100}%`, background: "var(--series-blue)" }} />
                  <div style={{ width: `${(row.penalty / maxTotal) * 100}%`, background: "var(--status-serious)" }} />
                </div>
                <div className="text-xs w-28 shrink-0 tabular-nums text-right" style={{ color: "var(--text-primary)" }}>
                  {row.total.toFixed(0)} {t.economics.chartUnit}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--series-blue)" }} />
              {t.economics.chartBaseLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--status-serious)" }} />
              {t.economics.statFoulingPenalty}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
