import type { Severity } from "../lib/types";
import { useLang } from "../lib/i18n";

const DOT_VAR: Record<Severity, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  serious: "var(--status-serious)",
  critical: "var(--status-critical)",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { t } = useLang();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        color: "var(--text-primary)",
        background: "color-mix(in srgb, currentColor 8%, var(--surface-2))",
        border: "1px solid var(--border)",
      }}
    >
      <span
        aria-hidden
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: DOT_VAR[severity] }}
      />
      {t.severity[severity]}
    </span>
  );
}
