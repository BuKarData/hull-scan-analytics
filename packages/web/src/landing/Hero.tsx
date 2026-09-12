import { useEffect, useMemo, useRef, useState } from "react";
import { HeroScene, type HeroTick, type Phase } from "./HeroScene";
import { fetchHeroData, type HeatData } from "./data";
import { useL } from "./i18n";

const fmtPts = (n: number) => n.toLocaleString("pl-PL");

export function Hero() {
  const { t } = useL();
  const [data, setData] = useState<HeatData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading");
  const [tick, setTick] = useState<HeroTick>({ p: 0, phase: "film", revealU: 0, maxDevMm: 0 });
  const [playing, setPlaying] = useState(true);

  const progressRef = useRef(0);
  const draggingRef = useRef(false);
  const playingRef = useRef(true);

  useEffect(() => {
    let alive = true;
    fetchHeroData().then((d) => {
      if (!alive) return;
      if (d) {
        setData(d);
        setStatus("ready");
      } else {
        setStatus("offline");
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const onTick = (tk: HeroTick) => setTick(tk);

  const phase: Phase = tick.phase;

  const scrub = (clientX: number, el: HTMLDivElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const padPx = 48;
    const usable = Math.max(1, rect.width - padPx * 2);
    const v = Math.max(0, Math.min(1, (clientX - rect.left - padPx) / usable));
    progressRef.current = v;
    setTick((prev) => ({ ...prev, p: v }));
  };

  const pointsShown = useMemo(() => {
    if (!data) return 0;
    const e = Math.max(0, Math.min(1, tick.revealU / 1));
    return Math.round(data.pointCount * Math.min(1, e * 2.2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick.revealU, data]);

  const fadeFilm = phase === "film" ? 1 : phase === "transition" ? 1 - tick.revealU * 0.7 : 0;

  return (
    <section className="relative h-[100svh] min-h-[620px] w-full overflow-hidden" style={{ background: "var(--ls-bg)" }}>
      {status === "ready" && data ? (
        <HeroScene data={data} progressRef={progressRef} draggingRef={draggingRef} playingRef={playingRef} onTick={onTick} />
      ) : (
        <FallbackHero />
      )}

      {/* film grain + vignette */}
      <div className="grain pointer-events-none absolute inset-0 z-10 opacity-[0.06] mix-blend-overlay" />
      <div className="hs-vignette pointer-events-none absolute inset-0 z-10" />

      {/* letterbox */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 h-8 border-b" style={{ background: "rgba(2,4,8,0.6)", borderColor: "rgba(148,163,184,0.1)" }} />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-8 border-t" style={{ background: "rgba(2,4,8,0.6)", borderColor: "rgba(148,163,184,0.1)" }} />

      {/* top-left logo */}
      <div className="pointer-events-none absolute left-6 top-6 z-30 flex items-center gap-3 md:left-12">
        <img src="/brand/hullsight-logo.png" alt="" className="h-8 w-8 rounded" style={{ background: "#fcfcfb" }} />
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold tracking-tight"
          >Hull<span className="accent-text">Sight</span></div>
          <div className="font-hud text-[9px] tracking-[0.22em]" style={{ color: "var(--ls-dim)" }}>
            DUAL USE · SHIP ANALYSIS
          </div>
        </div>
      </div>

      {/* top-right hud */}
      <div className="pointer-events-none absolute right-6 top-6 z-30 flex items-center gap-3 font-hud text-[10px] md:right-12" style={{ color: "var(--ls-muted)" }}>
        <span className="chip" style={{ opacity: fadeFilm * 0.6 + 0.4 }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full anim-blink" style={{ background: "var(--ls-bad)" }} />
          {t.hero.rec}&nbsp;·&nbsp;{t.hero.dateStamp}
        </span>
        <span className="chip hidden sm:inline-flex">{t.hero.liveBadge}</span>
      </div>

      {/* headline block */}
      <div className="pointer-events-none absolute left-6 right-6 top-[15%] z-30 max-w-2xl md:left-12 md:top-[17%] md:right-auto">
        <div className="anim-fade-in mb-4">
          <span className="chip">{t.hero.chipTop}</span>
        </div>
        <h1 className="font-display text-[2.9rem] font-medium leading-[1.04] tracking-tight sm:text-6xl md:text-[4.4rem]">
          <span key={phase + "a"} className="anim-fade-up block text-white" style={{ textShadow: "0 2px 32px rgba(0,0,0,0.65)" }}>
            {t.hero.h1Line1}
          </span>
          <span key={phase + "b"} className="anim-fade-up accent-text block" style={{ animationDelay: "0.12s", textShadow: "0 2px 32px rgba(0,0,0,0.65)" }}>
            {t.hero.h1Line2}
          </span>
        </h1>
        <p
          key={phase + "p"}
          className="anim-fade-up mt-6 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: "var(--ls-text)", animationDelay: "0.24s", textShadow: "0 2px 18px rgba(0,0,0,0.7)" }}
        >
          {t.hero.sub}
        </p>
        <div className="anim-fade-up pointer-events-auto mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.4s" }}>
          <a className="btn btn-solid" href="/">{t.hero.ctaPrimary}</a>
          <a className="btn btn-hair" href="#why">{t.hero.ctaSecondary}</a>
        </div>
      </div>

      {/* phase caption — lower left */}
      <div className="pointer-events-none absolute bottom-24 left-6 z-30 md:bottom-28 md:left-12">
        <p key={phase + "c"} className="anim-fade-up font-display text-base italic sm:text-lg">
          <span className="accent-text not-italic">{phase === "film" ? "01" : phase === "transition" ? "02" : "03"}</span>{" "}
          {phase === "film" ? t.hero.phaseFilm : phase === "transition" ? t.hero.phaseScan : t.hero.phaseInspect}
        </p>
      </div>

      {/* bottom HUD + timeline */}
      <div className="absolute bottom-12 left-0 right-0 z-30 px-6 md:px-12">
        {/* counters bar */}
        <div className="pointer-events-none mb-5 hidden items-center justify-between font-hud text-[10px] sm:flex" style={{ color: "var(--ls-dim)" }}>
          <span>
            {t.hero.pointCounter.toUpperCase()}&nbsp;
            <span className="num text-white">{fmtPts(pointsShown)}</span>
            <span style={{ color: "var(--ls-dim)" }}> / {data ? fmtPts(data.pointCount) : "—"}</span>
          </span>
          <span>
            {t.hero.devCounter.toUpperCase()}&nbsp;
            <span className="num text-white">{data ? data.maxAbsDeviationMm.toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "0,0"}&nbsp;mm</span>
          </span>
          <span>
            {t.hero.noiseCounter.toUpperCase()}&nbsp;<span className="num text-white">1,2&nbsp;mm</span>
          </span>
        </div>

        {/* timeline */}
        <div className="relative">
          <div
            className="relative h-11 w-full cursor-ew-resize touch-none select-none"
            onPointerDown={(e) => {
              draggingRef.current = true;
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              scrub(e.clientX, e.currentTarget);
            }}
            onPointerMove={(e) => {
              if (draggingRef.current) scrub(e.clientX, e.currentTarget);
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
            onPointerCancel={() => {
              draggingRef.current = false;
            }}
          >
            <div className="pointer-events-none absolute left-12 right-12 top-1/2 -translate-y-1/2">
              <div className="h-px w-full" style={{ background: "var(--ls-line)" }} />
              <div
                className="h-[2px] -translate-y-1/2"
                style={{
                  background: "var(--ls-accent)",
                  width: `calc(${Math.min(1, tick.p * 1.12) * 100}%)`,
                  boxShadow: "0 0 10px rgba(59,157,255,0.5)",
                }}
              />
              <button
                className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `calc(${Math.min(1, tick.p) * 100}%)`,
                  background: "var(--ls-text)",
                  boxShadow: "0 0 14px rgba(59,157,255,0.8)",
                }}
                aria-label="timeline"
              />
            </div>
          </div>
          {/* step ticks under the bar */}
          <div className="pointer-events-none mt-1.5 flex items-center justify-between pl-12 pr-10 font-hud text-[9px] tracking-[0.2em]" style={{ color: "var(--ls-dim)" }}>
            <span className={tick.p < 0.1 ? "text-white" : ""}>{t.hero.step1}</span>
            <span className={tick.p >= 0.36 && tick.p < 0.8 ? "text-white" : ""}>{t.hero.step2}</span>
            <span className={tick.p >= 0.85 ? "text-white" : ""}>{t.hero.step3}</span>
            <span className="hidden sm:inline" style={{ opacity: playing ? 1 : 0.5 }}>{playing ? t.hero.timingSweep : t.hero.timingPause}</span>
          </div>
        </div>
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 hidden -translate-x-1/2 font-hud text-[9px] tracking-widest sm:block" style={{ color: "rgba(148,163,184,0.5)" }}>
        {t.hero.filmHint} · {t.hero.chipBottom}
      </div>

      {/* play/pause */}
      <button
        className="absolute bottom-[86px] right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full md:right-12"
        style={{ background: "rgba(4,7,12,0.5)", border: "1px solid var(--ls-line-3)", color: "var(--ls-text)" }}
        onClick={() => setPlaying((v) => !v)}
        aria-label="play"
      >
        {playing ? (
          <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><rect x="1.5" y="1" width="4" height="12" rx="1" /><rect x="8.5" y="1" width="4" height="12" rx="1" /></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5v11l9-5.5z" /></svg>
        )}
      </button>
    </section>
  );
}

function FallbackHero() {
  const { t } = useL();
  return (
    <div className="absolute inset-0 grid min-h-[620px] place-items-center">
      <div className="relative z-10 max-w-xl px-6 text-center">
        <div className="mx-auto mb-7 flex items-center justify-center">
          <img src="/brand/hullsight-logo.png" alt="" className="h-10 w-10 rounded-lg" style={{ background: "#fcfcfb" }} />
        </div>
        <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
          <span className="block text-white">{t.hero.h1Line1}</span>
          <span className="accent-text block">{t.hero.h1Line2}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed" style={{ color: "var(--ls-muted)" }}>
          {t.hero.sub}
        </p>
        <p className="mx-auto mt-6 rounded border p-3 font-hud text-[11px]" style={{ borderColor: "var(--ls-line)", color: "var(--ls-warn)" }}>
          SERWER DEMO OFFLINE — uruchom <span className="text-white">npm run dev</span>, żeby odblokować sekwencję 3D.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a className="btn btn-solid" href="/">{t.hero.ctaPrimary}</a>
          <a className="btn btn-hair" href="#why">{t.hero.ctaSecondary}</a>
        </div>
      </div>
    </div>
  );
}