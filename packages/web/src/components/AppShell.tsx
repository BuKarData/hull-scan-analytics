import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../lib/i18n";

type ThemeChoice = "system" | "light" | "dark";

function applyTheme(choice: ThemeChoice) {
  if (choice === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", choice);
}

function ThemeToggle() {
  const { t } = useLang();
  const [choice, setChoice] = useState<ThemeChoice>(() => {
    const stored = localStorage.getItem("hull-scan-theme") as ThemeChoice | null;
    return stored ?? "system";
  });

  useEffect(() => {
    applyTheme(choice);
    localStorage.setItem("hull-scan-theme", choice);
  }, [choice]);

  const next: Record<ThemeChoice, ThemeChoice> = { system: "light", light: "dark", dark: "system" };
  const iconLabel: Record<ThemeChoice, string> = { system: t.common.themeAuto, light: t.common.themeLight, dark: t.common.themeDark };

  return (
    <button
      onClick={() => setChoice(next[choice])}
      className="text-xs font-medium rounded-full px-3 py-1.5 transition-colors"
      style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
      title={t.common.themeToggleTitle}
    >
      {iconLabel[choice]}
    </button>
  );
}

function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "pl" ? "en" : "pl")}
      className="text-xs font-semibold rounded-full px-3 py-1.5 transition-colors tabular-nums"
      style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
      title={t.common.langToggleTitle}
    >
      {lang === "pl" ? "PL" : "EN"}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { t } = useLang();
  const NAV = [{ to: "/", label: t.common.fleet }];

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--page-plane)" }}>
      <header
        className="no-print sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-3 backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--page-plane) 85%, transparent)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold" style={{ color: "var(--text-primary)" }}>
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-md overflow-hidden shrink-0"
              style={{ background: "#fcfcfb" }}
            >
              <img src="/brand/hullsight-logo.png" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="text-sm">
              Hull<span style={{ color: "var(--brand)" }}>Sight</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  color: location.pathname === item.to ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: location.pathname === item.to ? 600 : 500,
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden sm:inline text-xs rounded-full px-2.5 py-1"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            {t.common.demoData}
          </span>
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 px-6 py-6 w-full max-w-[1400px] mx-auto">{children}</main>
      <footer className="no-print px-6 py-4 text-xs text-center" style={{ color: "var(--text-muted)" }}>
        {t.common.footer}
      </footer>
    </div>
  );
}
