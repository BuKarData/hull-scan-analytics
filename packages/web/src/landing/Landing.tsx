import { Component, useEffect, useState, type ReactNode } from "react";
import { Hero } from "./Hero";
import { useL, type Lang } from "./i18n";
import { fetchFleet, fetchRegionGrid, fetchTrendData, type FleetItem, type RegionGridData, type TrendPoint } from "./data";
import { RegionGrid3D, TrendChart3D } from "./Charts";

class HeroBoundary extends Component<{ children: ReactNode }, { broken: boolean }> {
  state = { broken: false };
  static getDerivedStateFromError() {
    return { broken: true };
  }
  render() {
    return this.state.broken ? <HeroOffline /> : this.props.children;
  }
}

function HeroOffline() {
  const { t } = useL();
  return (
    <section className="relative flex h-[100svh] min-h-[620px] w-full items-center justify-center" style={{ background: "var(--ls-bg)" }}>
      <div className="max-w-xl px-6 text-center">
        <div className="font-display text-4xl leading-tight sm:text-5xl">{t.hero.h1Line1}</div>
        <p className="mt-4 font-hud text-xs" style={{ color: "var(--ls-warn)" }}>
          {t.cta.note}
        </p>
        <a className="btn btn-solid mt-8" href="/">{t.hero.ctaPrimary}</a>
      </div>
    </section>
  );
}

function useAsync<T>(fn: () => Promise<T>): T | null {
  const [d, setD] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    fn()
      .then((v) => alive && setD(v))
      .catch(() => alive && setD(null));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return d;
}

export function Landing() {
  const { lang, setLang } = useL();
  const fleet = useAsync(fetchFleet);
  const trend = useAsync(fetchTrendData);
  const grid = useAsync(fetchRegionGrid);

  return (
    <div className="hs-landing">
      <Nav lang={lang} setLang={setLang} />
      <main>
        <HeroBoundary>
          <Hero />
        </HeroBoundary>

        <ProblemSection />
        <BridgeSection />
        <HowSection />
        <DetectSection grid={grid} />
        <DualUseSection />
        <ProofSection fleet={fleet} trend={trend} />
        <ObjectionsSection />
        <CtaSection />
      </main>
      <Footer lang={lang} setLang={setLang} />
    </div>
  );
}

/* ---------------- NAV ---------------- */

function Nav({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const { t } = useL();
  return (
    <header
      className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 px-6 md:px-12"
      style={{ background: "rgba(7,11,18,0.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--ls-line)" }}
    >
      <a href="#" className="flex items-center gap-2.5">
        <img src="/brand/hullsight-logo.png" alt="" className="h-7 w-7 rounded" style={{ background: "#fcfcfb" }} />
        <span className="font-display text-xl font-semibold tracking-tight">
          Hull<span className="accent-text">Sight</span>
        </span>
      </a>
      <nav className="hidden items-center gap-8 text-sm md:flex" style={{ color: "var(--ls-muted)" }}>
        <a href="#why" className="transition-colors hover:text-white">{t.nav.platform}</a>
        <a href="#dual" className="transition-colors hover:text-white">{t.nav.dualUse}</a>
        <a href="#how" className="transition-colors hover:text-white">{t.nav.how}</a>
        <a href="#proof" className="transition-colors hover:text-white">{t.nav.live}</a>
      </nav>
      <div className="flex items-center gap-2 md:gap-3">
        <button
          className="rounded px-2.5 py-1 font-hud text-[11px] tracking-widest transition-colors hover:text-white"
          style={{ color: "var(--ls-dim)" }}
          onClick={() => setLang(lang === "pl" ? "en" : "pl")}
        >
          {lang === "pl" ? "EN" : "PL"}
        </button>
        <a className="btn btn-solid !px-4 !py-2 text-sm" href="/">{t.nav.openApp}</a>
      </div>
    </header>
  );
}

/* ---------------- PROBLEM ---------------- */

function ProblemSection() {
  const { t } = useL();
  return (
    <section id="why" className="section">
      <div className="section-inner">
        <span className="eyebrow">{t.problem.kicker}</span>
        <h2 className="font-display mt-5 max-w-3xl text-[2.1rem] font-medium leading-[1.08] tracking-tight sm:text-[2.7rem] md:text-[3.1rem]">
          {t.problem.title}
        </h2>
        <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed sm:text-base" style={{ color: "var(--ls-muted)" }}>
          {t.problem.subtitle}
        </p>

        <div className="mt-16">
          {t.problem.rows.map((r, i) => (
            <div key={i} className="hairline-row grid gap-x-10 gap-y-3 py-8 md:grid-cols-[4.5rem_minmax(0,1fr)]">
              <div className="num text-sm" style={{ color: "var(--ls-accent)" }}>{r.n}</div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{r.t}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: "var(--ls-muted)" }}>{r.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-8 border-t pt-10 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--ls-line-2)" }}>
          <div>
            <div className="font-hud text-[11px] uppercase tracking-[0.25em]" style={{ color: "var(--ls-bad)" }}>{t.problem.costLabel}</div>
            <div className="font-display mt-2 text-5xl font-medium tracking-tight" style={{ color: "var(--ls-text)" }}>{t.problem.costValue}</div>
          </div>
          <p className="max-w-sm text-sm leading-relaxed" style={{ color: "var(--ls-dim)" }}>{t.problem.costHint}</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- BRIDGE ---------------- */

function BridgeSection() {
  const { t } = useL();
  const cols = "md:grid-cols-[1.6fr_1.1fr_1fr_1.2fr_1.4fr_1.8fr]";
  return (
    <section className="section">
      <div className="section-inner">
        <span className="eyebrow">{t.bridge.kicker}</span>
        <h2 className="font-display mt-5 max-w-3xl text-[2.1rem] font-medium leading-[1.08] tracking-tight sm:text-[2.7rem] md:text-[3.1rem]">
          {t.bridge.title}
        </h2>
        <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed sm:text-base" style={{ color: "var(--ls-muted)" }}>
          {t.bridge.subtitle}
        </p>

        <div className="mt-14">
          <div className={`hidden gap-x-5 border-b py-2.5 font-hud text-[10px] uppercase tracking-[0.2em] md:grid ${cols}`} style={{ color: "var(--ls-dim)", borderColor: "var(--ls-line)" }}>
            {t.bridge.head.map((h, i) => <span key={i}>{h}</span>)}
          </div>
          {t.bridge.rows.map((r, i) => (
            <div
              key={i}
              className="hairline-row grid grid-cols-2 gap-x-5 gap-y-1 py-5 text-sm md:grid-cols-[1.6fr_1.1fr_1fr_1.2fr_1.4fr_1.8fr] md:items-center"
              style={r.accent ? { background: "rgba(59,157,255,0.045)" } : { borderColor: "var(--ls-line)" }}
            >
              <div className={`col-span-2 mb-1 font-semibold md:col-span-1 md:mb-0 ${r.accent ? "accent-text" : ""}`} style={r.accent ? { borderBottom: "0" } : {}}>{r.who}</div>
              {[r.cost, r.speed, r.access, r.depth, r.verdict].map((cell, j) => (
                <div key={j} className={`${j === 4 ? "col-span-2 md:col-span-1" : ""} ${r.accent && j === 4 ? "accent-text" : ""}`}>
                  <span className="mb-0.5 block font-hud text-[9px] uppercase tracking-widest md:hidden" style={{ color: "var(--ls-dim)" }}>
                    {j < 5 ? t.bridge.head[j] : ""}
                  </span>
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- HOW ---------------- */

function HowSection() {
  const { t } = useL();
  return (
    <section id="how" className="section">
      <div className="section-inner">
        <span className="eyebrow">{t.how.kicker}</span>
        <h2 className="font-display mt-5 max-w-3xl text-[2.1rem] font-medium leading-[1.08] tracking-tight sm:text-[2.7rem] md:text-[3.1rem]">
          {t.how.title}
        </h2>
        <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed sm:text-base" style={{ color: "var(--ls-muted)" }}>
          {t.how.subtitle}
        </p>

        <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-0">
          {t.how.steps.map((s, i) => (
            <div key={i} className={i > 0 ? "md:border-l md:pl-10" : ""} style={{ borderColor: "var(--ls-line)" }}>
              <div className={`font-display text-3xl font-medium ${i > 0 ? "md:pl-10" : ""}`} style={{ color: "var(--ls-accent)" }}>
                <span className={i > 0 ? "-ml-10" : ""}>{s.n}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.t}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "var(--ls-muted)" }}>{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t pt-8" style={{ borderColor: "var(--ls-line)" }}>
          {t.how.tech.map((x, i) => (
            <span key={i} className="font-hud text-[11px] tracking-wider" style={{ color: "var(--ls-dim)" }}>
              <span className="accent-text">/</span> {x}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- DETECT + region grid (three.js) ---------------- */

function DetectSection({ grid }: { grid: RegionGridData | null }) {
  const { t, lang } = useL();
  return (
    <section className="section">
      <div className="section-inner">
        <span className="eyebrow">{t.detect.kicker}</span>
        <h2 className="font-display mt-5 max-w-3xl text-[2.1rem] font-medium leading-[1.08] tracking-tight sm:text-[2.7rem] md:text-[3.1rem]">
          {t.detect.title}
        </h2>
        <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed sm:text-base" style={{ color: "var(--ls-muted)" }}>
          {t.detect.subtitle}
        </p>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div>
            {t.detect.defects.map((d, i) => (
              <div key={i} className="hairline-row flex items-start justify-between gap-6 py-5">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{lang === "pl" ? d.name : d.en}</h3>
                  <p className="mt-1 max-w-md text-sm leading-relaxed" style={{ color: "var(--ls-muted)" }}>{d.d}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="chip">{d.sev}</span>
                  <span className="num text-sm font-semibold" style={{ color: d.mm.startsWith("+") ? "var(--ls-accent)" : "var(--ls-bad)" }}>
                    {d.mm}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="card rounded-lg p-5 lg:sticky lg:top-24">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="font-hud text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--ls-dim)" }}>
                {t.detect.gridCaption}
              </span>
              <span className="inline-block h-1.5 w-1.5 rounded-full anim-blink" style={{ background: "var(--ls-accent)" }} />
            </div>
            <div className="h-60 w-full">
              {grid ? (
                <RegionGrid3D data={grid} />
              ) : (
                <div className="grid h-full w-full place-items-center font-hud text-[11px]" style={{ color: "var(--ls-dim)" }}>
                  {t.detect.gridMissing}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--ls-line)" }}>
              {t.detect.gridLegend.map((l, i) => {
                const dot = ["#ff5c6b", "#c7d6eb", "#3373ff"][i];
                return (
                  <span key={i} className="flex items-center gap-2 font-hud text-[10px] uppercase tracking-widest" style={{ color: "var(--ls-dim)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
                    {l}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- DUAL USE ---------------- */

function DualUseSection() {
  const { t } = useL();
  const col = (head: string, title: string, items: string[], accentCss: Record<string, string>) => (
    <div className="card rounded-lg p-7 md:p-9" style={{ borderTop: `2px solid ${accentCss.line}` }}>
      <span className="font-hud text-[10px] uppercase tracking-[0.28em]" style={{ color: accentCss.line }}>
        {head}
      </span>
      <h3 className="mt-4 text-xl font-semibold tracking-tight">{title}</h3>
      <ul className="mt-6 flex flex-col">
        {items.map((it, i) => (
          <li key={i} className="flex items-baseline gap-3 border-b py-2.5 text-sm" style={{ borderColor: "var(--ls-line)", color: "var(--ls-muted)" }}>
            <span className="h-1 w-1 shrink-0 self-center rounded-full" style={{ background: accentCss.line }} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section id="dual" className="section">
      <div className="section-inner">
        <span className="eyebrow">{t.dualuse.kicker}</span>
        <h2 className="font-display mt-5 max-w-3xl text-[2.1rem] font-medium leading-[1.08] tracking-tight sm:text-[2.7rem] md:text-[3.1rem]">
          {t.dualuse.title}
        </h2>
        <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed sm:text-base" style={{ color: "var(--ls-muted)" }}>
          {t.dualuse.subtitle}
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {col(t.dualuse.civilian.head, t.dualuse.civilian.title, t.dualuse.civilian.items, { line: "#3b9dff" })}
          {col(t.dualuse.defense.head, t.dualuse.defense.title, t.dualuse.defense.items, { line: "#8b6cff" })}
        </div>

        <blockquote className="font-display mt-14 max-w-2xl border-l pl-6 text-xl font-medium italic leading-relaxed sm:text-2xl" style={{ borderColor: "var(--ls-accent)" }}>
          {t.dualuse.line}
        </blockquote>
      </div>
    </section>
  );
}

/* ---------------- PROOF + trend chart (three.js) ---------------- */

function ProofSection({ fleet, trend }: { fleet: FleetItem[] | null; trend: TrendPoint[] | null }) {
  const { t, lang } = useL();
  const hasTrend = trend && trend.length > 1;
  return (
    <section id="proof" className="section">
      <div className="section-inner">
        <span className="eyebrow">{t.proof.kicker}</span>
        <h2 className="font-display mt-5 max-w-3xl text-[2.1rem] font-medium leading-[1.08] tracking-tight sm:text-[2.7rem] md:text-[3.1rem]">
          {t.proof.title}
        </h2>
        <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed sm:text-base" style={{ color: "var(--ls-muted)" }}>
          {t.proof.subtitle}
        </p>

        <div className="mt-14 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: "var(--ls-line)", background: "var(--ls-line)" }}>
          {t.proof.stats.map((s, i) => (
            <div key={i} className="p-7" style={{ background: "var(--ls-bg)" }}>
              <div className="font-display text-4xl font-medium tracking-tight">
                {s.big}
                {s.unit && <span className="ml-1 text-xl" style={{ color: "var(--ls-dim)" }}>{s.unit}</span>}
              </div>
              <div className="mt-2 text-sm leading-snug text-white/90">{s.label}</div>
              {s.note && <div className="mt-1 font-hud text-[10px] uppercase tracking-widest" style={{ color: "var(--ls-dim)" }}>{s.note}</div>}
            </div>
          ))}
        </div>

        <div className="card mt-12 rounded-lg p-6 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="text-base font-semibold tracking-tight">{t.proof.trendTitle}</span>
            <span className="flex items-center gap-4 font-hud text-[10px] uppercase tracking-widest" style={{ color: "var(--ls-dim)" }}>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ls-accent)" }} />{t.proof.trendLegend1}</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "#8fa3bd" }} />{t.proof.trendLegend2}</span>
            </span>
          </div>
          <div className="mt-4 h-56 w-full md:h-64">
            {hasTrend ? (
              <TrendChart3D points={trend} />
            ) : (
              <div className="grid h-full w-full place-items-center font-hud text-[11px]" style={{ color: "var(--ls-dim)" }}>
                {t.proof.trendMissing}
              </div>
            )}
          </div>
          {hasTrend && (
            <div className="mt-3 flex items-center justify-between font-hud text-[9px] uppercase tracking-widest" style={{ color: "var(--ls-dim)" }}>
              <span>{t.proof.trendX}</span>
              <span>{trend[trend.length - 1].label}</span>
            </div>
          )}
          <div className="mt-2 border-t pt-3 font-hud text-[10px] tracking-wider" style={{ borderColor: "var(--ls-line)", color: "var(--ls-dim)" }}>
            {t.proof.trendCaption}
          </div>
        </div>

        {fleet && fleet.length > 0 && (
          <div className="mt-14">
            <div className="mb-4 font-hud text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--ls-dim)" }}>
              {t.proof.fleet}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fleet.map((f) => (
                <a
                  key={f.vessel.id}
                  href={`/vessels/${f.vessel.id}`}
                  className="card group block p-5 transition-colors hover:border-white/25"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-hud text-[9px] uppercase tracking-widest" style={{ color: "var(--ls-dim)" }}>
                      {f.vessel.type.toLowerCase().replaceAll("-", " ")}
                    </span>
                    <span className="num text-xs" style={{ color: "var(--ls-dim)" }}>{f.vessel.lengthM} m</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-base font-semibold tracking-tight">{f.vessel.name}</span>
                    <span className="accent-text text-sm opacity-0 transition-opacity group-hover:opacity-100">→</span>
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "var(--ls-muted)" }}>
                    {lang === "pl" ? `${f.scanCount} skanów · ${f.openDefectCount} usterek otwartych` : `${f.scanCount} scans · ${f.openDefectCount} open defects`}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 rounded-lg border p-6" style={{ borderColor: "var(--ls-line)" }}>
          <div className="mb-2 text-sm font-semibold">{t.proof.toolingTitle}</div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ls-muted)" }}>{t.proof.toolingText}</p>
          <p className="mt-3 font-hud text-[11px] leading-relaxed" style={{ color: "var(--ls-warn)" }}>{t.proof.note}</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- OBJECTIONS ---------------- */

function ObjectionsSection() {
  const { t } = useL();
  return (
    <section className="section">
      <div className="section-inner max-w-3xl">
        <span className="eyebrow">{t.objections.kicker}</span>
        <h2 className="font-display mt-5 max-w-3xl text-[2.1rem] font-medium leading-[1.08] tracking-tight sm:text-[2.7rem] md:text-[3.1rem]">
          {t.objections.title}
        </h2>
        <div className="mt-12">
          {t.objections.items.map((o, i) => (
            <details key={i} className="group border-b py-6" style={{ borderColor: "var(--ls-line)" }} open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-semibold tracking-tight">
                {o.q}
                <span className="accent-text shrink-0 transition-transform group-open:rotate-45">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </summary>
              <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: "var(--ls-muted)" }}>{o.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */

function CtaSection() {
  const { t } = useL();
  return (
    <section className="border-t py-28 px-6" style={{ borderColor: "var(--ls-line)" }}>
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">{t.cta.kicker}</span>
        <h2 className="font-display mt-6 text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">{t.cta.title}</h2>
        <p className="mx-auto mt-6 max-w-xl text-[0.95rem] leading-relaxed sm:text-base" style={{ color: "var(--ls-muted)" }}>
          {t.cta.subtitle}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a className="btn btn-solid !px-7 !py-3.5 text-base" href="/">{t.cta.primary}</a>
          <a className="btn btn-hair !px-6 !py-3.5" href="/vessels/ms-neptun-baltic">{t.cta.secondary}</a>
        </div>
        <div className="mt-8 font-hud text-[10px] tracking-wider" style={{ color: "var(--ls-dim)" }}>{t.cta.note}</div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */

function Footer({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const { t } = useL();
  return (
    <footer className="border-t px-6 py-12 md:px-12" style={{ borderColor: "var(--ls-line)", background: "var(--ls-bg-1)" }}>
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/brand/hullsight-logo.png" alt="" className="h-7 w-7 rounded" style={{ background: "#fcfcfb" }} />
            <span className="font-display text-lg font-semibold tracking-tight">
              Hull<span className="accent-text">Sight</span>
            </span>
          </div>
          <div className="mt-2 font-hud text-[9px] tracking-[0.22em]" style={{ color: "var(--ls-dim)" }}>{t.footer.sub}</div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed" style={{ color: "var(--ls-muted)" }}>{t.footer.desc}</p>
        </div>
        <div>
          <div className="mb-4 font-hud text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--ls-dim)" }}>{t.footer.colTech}</div>
          <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--ls-muted)" }}>
            <li>{t.footer.tech1}</li>
            <li>{t.footer.tech2}</li>
            <li>{t.footer.tech3}</li>
            <li>{t.footer.tech4}</li>
          </ul>
        </div>
        <div>
          <div className="mb-4 font-hud text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--ls-dim)" }}>{t.footer.colCtx}</div>
          <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--ls-muted)" }}>
            <li>{t.footer.ctx1}</li>
            <li>{t.footer.ctx2}</li>
            <li>{t.footer.ctx3}</li>
          </ul>
          <div className="mt-5 flex items-center gap-3">
            <span className="font-hud text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--ls-dim)" }}>{t.footer.lang}</span>
            <button className="btn btn-hair !px-3 !py-1 font-hud !text-[11px]" onClick={() => setLang(lang === "pl" ? "en" : "pl")}>
              {lang === "pl" ? "EN" : "PL"}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-10 text-center font-hud text-[10px] tracking-wider" style={{ color: "var(--ls-dim)" }}>
        HULLSIGHT © 2026 · BALTIC DUAL USE HACKATHON · GDAŃSK
      </div>
    </footer>
  );
}