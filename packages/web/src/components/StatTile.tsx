interface StatTileProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "good" | "bad" | "neutral";
  hint?: string;
}

const TONE_VAR: Record<NonNullable<StatTileProps["deltaTone"]>, string> = {
  good: "var(--success-text)",
  bad: "var(--status-critical)",
  neutral: "var(--text-muted)",
};

export function StatTile({ label, value, delta, deltaTone = "neutral", hint }: StatTileProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
    >
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="tabular-nums text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
      {delta && (
        <span className="tabular-nums text-xs font-medium" style={{ color: TONE_VAR[deltaTone] }}>
          {delta}
        </span>
      )}
      {hint && (
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}
