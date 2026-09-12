import { Link, useLocation } from "react-router-dom";
import { useLang } from "../lib/i18n";

interface VesselModeNavProps {
  vesselId: string;
  baselineId?: string;
  latestScanId?: string;
}

/**
 * Spojny pasek przelaczania trybow podgladu/analizy dla danej jednostki -
 * widoczny na WSZYSTKICH podstronach jednostki (nie tylko na glownej), zeby
 * przejscie miedzy "Historia w 3D", "Porownaj", "Wplyw ekonomiczny" i "Sekcje
 * kadluba" nie wymagalo za kazdym razem wracania do strony glownej jednostki.
 */
export function VesselModeNav({ vesselId, baselineId, latestScanId }: VesselModeNavProps) {
  const { t } = useLang();
  const { pathname } = useLocation();

  const compareHref =
    baselineId && latestScanId && baselineId !== latestScanId
      ? `/vessels/${vesselId}/compare?a=${baselineId}&b=${latestScanId}`
      : undefined;

  const items: { to: string; label: string; match: (p: string) => boolean }[] = [
    { to: `/vessels/${vesselId}`, label: t.vessel.timelineTitle, match: (p) => p === `/vessels/${vesselId}` },
    ...(compareHref
      ? [{ to: compareHref, label: t.vessel.compare, match: (p: string) => p === `/vessels/${vesselId}/compare` }]
      : []),
    { to: `/vessels/${vesselId}/economics`, label: t.vessel.economicsLink, match: (p) => p === `/vessels/${vesselId}/economics` },
    { to: `/vessels/${vesselId}/sections`, label: t.vessel.sectionsLink, match: (p) => p === `/vessels/${vesselId}/sections` },
  ];

  return (
    <nav className="no-print flex items-center gap-1 rounded-full p-1 flex-wrap" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", width: "fit-content" }}>
      {items.map((item) => {
        const isActive = item.match(pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            className="text-xs font-medium rounded-full px-3 py-1.5"
            style={{
              background: isActive ? "var(--brand)" : "transparent",
              color: isActive ? "white" : "var(--text-secondary)",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
