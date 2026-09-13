import { DICTS, type Lang } from "./copy";
import "./cinema.css";

const R = "hs-";

function setText(id: string, txt: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

/* ------------------------------------------------------------------ copy helpers */

const TREND_AVG = [2.1, 2.4, 2.8, 3.3, 3.9];
const TREND_PEAK = [4.2, 5.1, 6.0, 7.4, 9.1];
const FLEET: { name: string; type: string; len: string; scans: number; defects: number }[] = [
  { name: "M/S Neptun Bałtycki", type: "cargo", len: "118", scans: 5, defects: 6 },
  { name: "KG Ems Slot", type: "cargo", len: "132", scans: 4, defects: 4 },
  { name: "Koral", type: "coastal", len: "64", scans: 3, defects: 2 },
  { name: "Halny", type: "patrol", len: "41", scans: 3, defects: 3 },
  { name: "Tug Baltia", type: "tug", len: "28", scans: 2, defects: 1 },
];

function polylinePath(pts: number[], w: number, h: number): string {
  const min = Math.min(...pts) * 0.85;
  const max = Math.max(...pts) * 1.12;
  const rng = Math.max(1, max - min);
  return pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((v - min) / rng) * (h - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/* ------------------------------------------------------------------ section builders */

function secProblem(lang: Lang): string {
  const p = DICTS[lang].problem;
  return `
  <section id="why" class="sec">
    <div class="sec-inner stagger stagger--slow">
      <span class="sec-num" aria-hidden="true">01</span>
      <span class="eyebrow" style="--i:1">${p.kicker}</span>
      <h2 class="sec-title" style="--i:2">${p.title}</h2>
      <p class="sec-sub" style="--i:3">${p.subtitle}</p>
      <div class="split" style="--i:4">
        <div class="split-num">${p.costValue}</div>
        <div>
          <div class="label-bad">${p.costLabel}</div>
          <p class="dim slim">${p.costHint}</p>
        </div>
      </div>
    </div>
  </section>`;
}

function secBridge(lang: Lang): string {
  const b = DICTS[lang].bridge;
  const head = b.head.map((h) => `<span>${h}</span>`).join("");
  const rows = b.rows
    .map((r, i) => {
      const cells = [r.who, r.cost, r.speed, r.access, r.depth, r.verdict]
        .map((c, j) => `<div class="b-cell${j === 0 ? " b-who" : ""}${j === 5 ? " b-verdict" : ""}"><span class="mobile-label">${b.head[j]}</span>${c}</div>`)
        .join("");
      return `<div class="b-row${r.accent ? " b-accent" : ""}" style="--i:${i + 1}">${cells}</div>`;
    })
    .join("");
  return `
  <section id="gap" class="sec">
    <div class="sec-inner stagger">
      <span class="sec-num" aria-hidden="true">02</span>
      <span class="eyebrow" style="--i:1">${b.kicker}</span>
      <h2 class="sec-title" style="--i:2">${b.title}</h2>
      <p class="sec-sub" style="--i:3">${b.subtitle}</p>
      <div class="b-table stagger" style="--i:4">
        <div class="b-head" style="--i:0">${head}</div>
        ${rows}
      </div>
      <div class="b-summary stagger" style="--i:5">
        <span class="hud dim" style="--i:1">${b.summaryLabel}</span>
        <div class="b-sgrid" style="--i:2">
          <div class="b-s"><b>CZAS</b><span>${b.summaryTime}</span></div>
          <div class="b-s"><b>KOSZT</b><span>${b.summaryCost}</span></div>
        </div>
        <p class="dim slim" style="--i:3">${b.summaryNote}</p>
      </div>
    </div>
  </section>`;
}

function secHow(lang: Lang): string {
  const h = DICTS[lang].how;
  const steps = h.steps
    .map(
      (s, i) => `
      <div class="step" style="--i:${i + 1}">
        <div class="step-num">${s.n}</div>
        <h3 class="step-title">${s.t}</h3>
        <p class="dim step-d">${s.d}</p>
      </div>`
    )
    .join("");
  const tech = h.tech.map((x, i) => `<span class="hud-tag" style="--i:${i + 1}"><span class="accent">/</span> ${x}</span>`).join("");
  return `
  <section id="how" class="sec">
    <div class="sec-inner stagger">
      <span class="sec-num" aria-hidden="true">03</span>
      <span class="eyebrow" style="--i:1">${h.kicker}</span>
      <h2 class="sec-title" style="--i:2">${h.title}</h2>
      <p class="sec-sub" style="--i:3">${h.subtitle}</p>
      <div class="steps stagger stagger--fast" style="--i:4">${steps}</div>
      <div class="tech-row stagger" style="--i:5">${tech}</div>
    </div>
  </section>`;
}

function secStatus(lang: Lang): string {
  const s = DICTS[lang].status;
  const li = (xs: string[]) => xs.map((x, i) => `<li style="--i:${i + 1}"><i class="dot"></i>${x}</li>`).join("");
  return `
  <section id="status" class="sec">
    <div class="sec-inner stagger">
      <span class="sec-num" aria-hidden="true">04</span>
      <span class="eyebrow" style="--i:1">${s.kicker}</span>
      <h2 class="sec-title" style="--i:2">${s.title}</h2>
      <p class="sec-sub" style="--i:3">${s.subtitle}</p>
      <div class="st-phase" style="--i:4">
        <div class="hud dim">${s.phaseLabel}</div>
        <div class="st-phases stagger">
          <div class="card st-card" style="--i:1">
            <span class="st-tag">${s.hatTag}</span>
            <span class="st-flag">${s.hatFlag}</span>
            <h3 class="st-title">${s.hatTitle}</h3>
            <ul class="st-list">${li(s.hatItems)}</ul>
          </div>
          <div class="st-arrow" aria-hidden="true">&rarr;</div>
          <div class="card st-card st-mid" style="--i:2">
            <span class="st-tag">${s.midTag}</span>
            <span class="st-flag st-flag-hot">${s.midFlag}</span>
            <h3 class="st-title">${s.midTitle}</h3>
            <ul class="st-list">${li(s.midItems)}</ul>
          </div>
          <div class="st-arrow" aria-hidden="true">&rarr;</div>
          <div class="card st-card" style="--i:3">
            <span class="st-tag">${s.fatTag}</span>
            <span class="st-flag">${s.fatFlag}</span>
            <h3 class="st-title">${s.fatTitle}</h3>
            <ul class="st-list">${li(s.fatItems)}</ul>
          </div>
        </div>
        <p class="hud dim st-ace"><span class="accent">⚑</span> ${s.aceNote}</p>
      </div>
      <div class="grid-3 stagger" style="--i:5">
        <div class="card st-card" style="--i:1">
          <span class="st-tag">${s.enamorTag}</span>
          <h3 class="st-title">${s.enamorTitle}</h3>
          <p class="dim slim">${s.enamorBody}</p>
        </div>
        <div class="card st-card" style="--i:2">
          <span class="st-tag">${s.sunreefTag}</span>
          <h3 class="st-title">${s.sunreefTitle}</h3>
          <p class="dim slim">${s.sunreefBody}</p>
        </div>
        <div class="card st-card" style="--i:3">
          <span class="st-tag">${s.modelTag}</span>
          <h3 class="st-title">${s.modelTitle}</h3>
          <p class="dim slim">${s.modelBody}</p>
        </div>
      </div>
      <div class="card cra-box" style="--i:6">
        <div class="cra-badge" aria-hidden="true">
          <svg class="cra-shield" viewBox="0 0 48 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><path d="M24 2 L44 8 V28 C44 41 35 49 24 54 C13 49 4 41 4 28 V8 Z"></path><path d="M16 27 l6 6 l11 -13"></path></svg>
          <span class="cra-letters">CRA</span>
        </div>
        <div class="cra-in">
          <span class="hud dim" style="--i:1">${s.craTag}</span>
          <h3 class="st-title" style="--i:2">${s.craTitle}</h3>
          <p class="dim slim" style="--i:3">${s.craBody}</p>
          <ul class="st-list cra-list stagger" style="--i:4">${li(s.craItems)}</ul>
        </div>
      </div>
      <blockquote class="quote" style="--i:7">${s.quote}</blockquote>
    </div>
  </section>`;
}

function secMarket(lang: Lang): string {
  const m = DICTS[lang].market;
  const players = m.players
    .map(
      (p, i) => `
      <div class="m-row" style="--i:${i + 1}">
        <div>
          <div class="m-name">${p.name}</div>
          <div class="dim slim m-what">${p.what}</div>
        </div>
        <div class="m-lens"><span class="label-accent" style="color:var(--b-bad)">${lang === "pl" ? "patrzy:" : "lens:"}</span> ${p.lens}</div>
      </div>`
    )
    .join("");
  const diffHead = m.diffHead.map((h) => `<span>${h}</span>`).join("");
  const diffRows = m.diffRows
    .map(
      (r, i) => `
      <div class="m-diff-row" style="--i:${i + 1}">
        <b class="m-cat">${r[0]}</b>
        <span class="m-them">${r[1]}</span>
        <span class="m-us">${r[2]}</span>
      </div>`
    )
    .join("");
  const gsdHead = m.gsdHead.map((h) => `<span>${h}</span>`).join("");
  const gsdRows = m.gsd
    .map(
      (r, i) => `
      <div class="gsd-row${i === 0 ? " gsd-top" : ""}" style="--i:${i + 1}">
        ${r.map((c, j) => `<span class="gsd-cell${j === 3 ? " gsd-mm" : ""}">${c}</span>`).join("")}
      </div>`
    )
    .join("");
  return `
  <section id="market" class="sec">
    <div class="sec-inner stagger">
      <span class="sec-num" aria-hidden="true">05</span>
      <span class="eyebrow" style="--i:1">${m.kicker}</span>
      <h2 class="sec-title" style="--i:2">${m.title}</h2>
      <p class="sec-sub" style="--i:3">${m.subtitle}</p>
      <blockquote class="quote" style="--i:4">${m.claim}</blockquote>
      <div class="m-play" style="--i:5">
        <div class="hud dim">${m.playersTitle}</div>
        <div class="m-rows stagger">${players}</div>
      </div>
      <div class="m-diff stagger" style="--i:6">
        <div class="m-diff-head" style="--i:0">${diffHead}</div>
        ${diffRows}
      </div>
      <div class="card gsd" style="--i:7">
        <div class="card-head" style="--i:1">
          <span class="hud dim">${m.gsdKicker}</span>
          <span class="pulse-dot"></span>
        </div>
        <h3 class="gsd-title" style="--i:2">${m.gsdTitle}</h3>
        <p class="dim slim" style="--i:3">${m.gsdLead}</p>
        <div class="gsd-head" style="--i:0">${gsdHead}</div>
        ${gsdRows}
        <p class="hud dim gsd-formula" style="--i:8">${m.gsdFormula}</p>
      </div>
    </div>
  </section>`;
}

function secDual(lang: Lang): string {
  const d = DICTS[lang].dualuse;
  const color: Record<string, string> = { civilian: "#2a78d6", defense: "#4a3aa7", yard: "#c07d26", consumer: "#0e7a6a" };
  const cards = (k: "civilian" | "defense" | "yard" | "consumer", i: number) =>
    `<div class="card dcard stagger stagger--${i % 2 ? "inL" : "inR"}" style="--i:${i};border-top:2px solid ${color[k]}">
      <div class="label-accent" style="color:${color[k]}">${d[k].head}</div>
      <h3 class="dcard-title">${d[k].title}</h3>
      <ul class="dcard-list">
        ${d[k].items.map((it) => `<li><i class="dot" style="background:${color[k]}"></i>${it}</li>`).join("")}
      </ul>
    </div>`;
  const money = d.money
    .map(
      (mo, i) => `
      <div class="mcard" style="--i:${i + 1}">
        <div class="mcard-big">${mo.big}</div>
        <div class="mcard-label">${mo.label}</div>
        <div class="hud dim mcard-note">${mo.note}</div>
      </div>`
    )
    .join("");
  return `
  <section id="dual" class="sec">
    <div class="sec-inner stagger">
      <span class="sec-num" aria-hidden="true">06</span>
      <span class="eyebrow" style="--i:1">${d.kicker}</span>
      <h2 class="sec-title" style="--i:2">${d.title}</h2>
      <p class="sec-sub" style="--i:3">${d.subtitle}</p>
      <div class="dcards stagger" style="--i:4">
        ${cards("civilian", 1)}${cards("defense", 2)}${cards("yard", 3)}${cards("consumer", 4)}
      </div>
      <div class="money stagger" style="--i:5">
        <div class="card-head" style="--i:1">
          <span class="hud dim">${d.moneyCaption}</span>
          <span class="pulse-dot"></span>
        </div>
        <h3 class="dcard-title" style="--i:2">${d.moneyTitle}</h3>
        <div class="money-grid stagger" style="--i:3">${money}</div>
      </div>
      <blockquote class="quote" style="--i:6">${d.line}</blockquote>
    </div>
  </section>`;
}

function sparkline(): string {
  const w = 560;
  const h = 200;
  const avg = polylinePath(TREND_AVG, w, h);
  const peak = polylinePath(TREND_PEAK, w, h);
  const area = `${peak} L${w},${h} L0,${h} Z`;
  const ticks = TREND_AVG.map((_, i) => (i / (TREND_AVG.length - 1)) * w).join(" ");
  return `
  <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="spark">
    <defs>
      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(42,120,214,0.3)"></stop>
        <stop offset="1" stop-color="rgba(42,120,214,0.02)"></stop>
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#sg)"></path>
    <path d="${peak}" fill="none" stroke="#9aa0a6" stroke-width="2" vector-effect="non-scaling-stroke"></path>
    <path d="${avg}" fill="none" stroke="#2a78d6" stroke-width="2" vector-effect="non-scaling-stroke"></path>
    <line x1="0" y1="${h}" x2="${w}" y2="${h}" stroke="rgba(11,11,11,0.1)" stroke-width="1" vector-effect="non-scaling-stroke"></line>
    <line x1="0" y1="${h * 0.25}" x2="${w}" y2="${h * 0.25}" stroke="rgba(11,11,11,0.05)" stroke-width="1" vector-effect="non-scaling-stroke"></line>
    <g fill="#2a78d6">
      <circle cx="${TREND_AVG.length - 1}" cy="${h - 4}" r="0"></circle>
    </g>
    ${ticks
      .split(" ")
      .map((x, i) => `<text x="${x}" y="${h + 18}" text-anchor="middle" fill="rgba(11,11,11,0.45)" font-family="ui-monospace,monospace" font-size="10">SC${i + 1}</text>`)
      .join("")}
  </svg>`;
}

function secProof(lang: Lang): string {
  const p = DICTS[lang].proof;
  const stats = p.stats
    .map(
      (s, i) => `
      <div class="stat" style="--i:${i + 1}">
        <div class="stat-big" data-cnt="${s.big}${s.unit}">0${s.unit && `<span class="stat-unit">${s.unit}</span>`}</div>
        <div class="stat-label">${s.label}</div>
        <div class="hud dim stat-note">${s.note}</div>
      </div>`
    )
    .join("");
  const fleet = FLEET.map(
    (f, i) => `
    <a class="card fleet" href="#cta" style="--i:${i + 1}">
      <div class="fhead"><span class="hud dim">${f.type}</span><span class="num dim">${f.len} m</span></div>
      <div class="fname">${f.name}</div>
      <div class="fmeta">${f.scans} scans · ${f.defects} open</div>
    </a>`
  ).join("");
  return `
  <section id="proof" class="sec">
    <div class="sec-inner stagger">
      <span class="sec-num" aria-hidden="true">07</span>
      <span class="eyebrow" style="--i:1">${p.kicker}</span>
      <h2 class="sec-title" style="--i:2">${p.title}</h2>
      <p class="sec-sub" style="--i:3">${p.subtitle}</p>
      <div class="stats stagger count-group" style="--i:4">${stats}</div>
      <div class="card trend-card stagger" style="--i:5">
        <div class="card-head" style="--i:1">
          <span class="t-title">${p.trendTitle}</span>
          <span class="t-legend"><i class="lg-dot" style="background:#2a78d6"></i>${p.trendLegend1}<i class="lg-dot" style="background:#9aa0a6"></i>${p.trendLegend2}</span>
        </div>
        <div class="spark-wrap" style="--i:2">${sparkline()}</div>
        <div class="card-foot" style="--i:3">${p.trendCaption}</div>
      </div>
      <div class="fleet-label" style="--i:6">${p.fleet}</div>
      <div class="fleet-grid stagger" style="--i:7">${fleet}</div>
      <div class="card tooling" style="--i:8">
        <div class="t-title">${p.toolingTitle}</div>
        <p class="dim slim">${p.toolingText}</p>
        <p class="warn slim">${p.note}</p>
      </div>
    </div>
  </section>`;
}

function secObjects(lang: Lang): string {
  const o = DICTS[lang].objections;
  const items = o.items
    .map(
      (it, i) => `
      <details class="obj" ${i === 0 ? "open" : ""} style="--i:${i + 1}">
        <summary class="obj-q">${it.q}<span class="obj-x"></span></summary>
        <p class="obj-a">${it.a}</p>
      </details>`
    )
    .join("");
  return `
  <section id="obj" class="sec narrow">
    <div class="stagger stagger--slow">
      <span class="sec-num" aria-hidden="true">08</span>
      <span class="eyebrow" style="--i:1">${o.kicker}</span>
      <h2 class="sec-title" style="--i:2">${o.title}</h2>
      <div class="obj-list stagger" style="--i:3">${items}</div>
    </div>
  </section>`;
}

function secCta(lang: Lang): string {
  const c = DICTS[lang].cta;
  return `
  <section id="cta" class="sec cta">
    <video class="cta-video" autoplay muted loop playsinline preload="auto" aria-hidden="true"><source src="/render_poprawka.mp4" type="video/mp4"></video>
    <div class="cta-scrim" aria-hidden="true"></div>
    <span class="sec-num light" aria-hidden="true">09</span>
    <div class="cta-inner stagger" style="--step:0.16s">
      <p class="cta-vision" style="--i:1">${c.vision}</p>
      <span class="eyebrow center" style="--i:2">${c.kicker}</span>
      <h2 class="cta-title" style="--i:3">${c.title}</h2>
      <p class="cta-sub" style="--i:4">${c.subtitle}</p>
      <div class="cta-btns" style="--i:5">
        <a class="btn btn-solid" id="ctaPrimary" href="#waitList">${c.primary}</a>
        <a class="btn btn-hair" href="/">${c.secondary}</a>
      </div>
      <form class="wait" id="waitList" novalidate style="--i:6">
        <div class="wait-head">${c.formLabel}</div>
        <div class="wait-rel">
          <input class="wait-input" id="waitEmail" type="email" required placeholder="${c.formPlaceholder}">
          <button class="btn btn-solid sm wait-btn" type="submit">&rarr;</button>
        </div>
        <p class="wait-note dim slim">${c.formNote}</p>
        <p class="wait-ok hid" id="waitOk">${c.formOk}</p>
      </form>
      <div class="hud dim cta-note" style="--i:7">${c.note}</div>
    </div>
  </section>`;
}

function secFooter(lang: Lang): string {
  const f = DICTS[lang].footer;
  return `
  <footer class="footer reveal">
    <div class="footer-grid">
      <div>
        <div class="brand-row">
          <img class="logo" src="/brand/hullsight-logo.png" alt="">
          <span class="brand-name">Hull<span class="accent">Sight</span></span>
        </div>
        <div class="hud dim sub">${f.sub}</div>
        <p class="dim slim fdesc">${f.desc}</p>
      </div>
      <div>
        <div class="hud label-col">${f.colTech}</div>
        <ul class="flist"><li>${f.tech1}</li><li>${f.tech2}</li><li>${f.tech3}</li><li>${f.tech4}</li></ul>
      </div>
      <div>
        <div class="hud label-col">${f.colCtx}</div>
        <ul class="flist"><li>${f.ctx1}</li><li>${f.ctx2}</li><li>${f.ctx3}</li></ul>
        <div class="lang-row"><span class="hud dim">${f.lang}</span><button id="langbtn2" class="btn btn-hair sm">${lang === "pl" ? "EN" : "PL"}</button></div>
      </div>
    </div>
    <div class="foot-copy hud dim">HULLSIGHT © 2026 · BALTIC DUAL USE HACKATHON · GDAŃSK</div>
  </footer>`;
}

/* ------------------------------------------------------------------ hero */

function heroMarkup(): string {
  return `
  <div class="scr-bar" id="scrBar"></div>
  <section id="hero" class="hero">
    <video
      class="demo-video"
      id="demoVideo"
      src="/render_poprawka.mp4"
      muted
      loop
      playsinline
      preload="auto"
      aria-label="HullSight demo film"
    ></video>
    <div class="hero-scrim"></div>
    <div class="grain"></div>

    <div class="hero-inner">
      <div class="hero-left" id="heroLeft">
        <h1 class="h1"><span id="h1a"></span><span class="accent" id="h1b"></span></h1>
        <p class="hero-sub" id="heroSub"></p>
        <div class="hero-ctas">
          <a class="btn btn-solid" id="ctaOpen" href="/"></a>
          <a class="btn btn-hair" id="ctaFilm" href="#how"></a>
          <a class="btn btn-link" id="ctaWhy" href="#why"></a>
        </div>
      </div>
    </div>

    <div class="hero-scroll" id="scrollHint">
      <span class="hero-scroll-label" id="scrollHintLabel"></span>
      <svg class="hero-scroll-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </div>

    <div class="v-progress"><i id="vProg"></i></div>
  </section>`;
}

/* ------------------------------------------------------------------ wiring */

export function boot() {
  const langStored = (localStorage.getItem("hs-landing-lang") as Lang) ?? "pl";
  let lang: Lang = langStored === "en" ? "en" : "pl";

  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <div class="${R}b">
      ${heroMarkup()}
      <main id="secWrap"></main>
      <div id="footWrap"></div>
    </div>`;

  const navBar = document.createElement("header");
  navBar.className = `${R}nav`;
  navBar.id = "nav";
  document.body.prepend(navBar);

  const rail = document.createElement("nav");
  rail.className = "ch-rail";
  rail.id = "chRail";
  rail.setAttribute("aria-label", "Chapters");
  document.body.appendChild(rail);

  const RAIL_IDS = ["why", "gap", "how", "status", "market", "dual", "proof", "obj", "cta"];
  const RAIL_NUM: Record<string, string> = { why: "01", gap: "02", how: "03", status: "04", market: "05", dual: "06", proof: "07", obj: "08", cta: "09" };
  function railLabels(): Record<string, string> {
    return {
      why: DICTS[lang].problem.kicker,
      gap: DICTS[lang].bridge.kicker,
      how: DICTS[lang].how.kicker,
      status: DICTS[lang].status.kicker,
      market: DICTS[lang].market.kicker,
      dual: DICTS[lang].dualuse.kicker,
      proof: DICTS[lang].proof.kicker,
      obj: DICTS[lang].objections.kicker,
      cta: DICTS[lang].cta.kicker,
    };
  }
  function renderRail() {
    const r = document.getElementById("chRail");
    if (!r) return;
    const labels = railLabels();
    r.innerHTML = RAIL_IDS.map(
      (id) => `
    <a class="ch" href="#${id}" data-sec="${id}">
      <i class="ch-dot"></i>
      <b class="ch-num">${RAIL_NUM[id]}</b>
      <span class="ch-lab">${labels[id]}</span>
    </a>`
    ).join("");
  }

  renderRail();
  renderNav();
  renderHeroText();
  renderSections();
  wireVideo();
  wireScroll();
  wireScrollHint();
  wireWaitlist();
  wireAnchors();
  revealInit();

  function toggleLang() {
    lang = lang === "pl" ? "en" : "pl";
    localStorage.setItem("hs-landing-lang", lang);
    renderNav();
    renderHeroText();
    renderSections();
    wireWaitlist();
    renderRail();
    wireAnchors();
    revealInit();
  }

  function renderHeroText() {
    const c = DICTS[lang].hero;
    setText("h1a", c.h1Line1);
    setText("h1b", c.h1Line2);
    setText("heroSub", c.sub);
    setText("ctaOpen", c.ctaPrimary);
    setText("ctaFilm", c.ctaSecondary);
    setText("ctaWhy", c.ctaTertiary);
    setText("scrollHintLabel", c.scrollHint);
  }

  function renderSections() {
    const wrap = document.getElementById("secWrap");
    if (wrap)
      wrap.innerHTML = [
        secProblem(lang),
        secBridge(lang),
        secHow(lang),
        secStatus(lang),
        secMarket(lang),
        secDual(lang),
        secProof(lang),
        secObjects(lang),
        secCta(lang),
      ].join("");
    const foot = document.getElementById("footWrap");
    if (foot) foot.innerHTML = secFooter(lang);
    const lbtns = document.querySelectorAll("#langbtn, #langbtn2");
    lbtns.forEach((b) => {
      (b as HTMLElement).textContent = lang === "pl" ? "EN" : "PL";
      b.addEventListener("click", () => toggleLang());
    });
  }

  function renderNav() {
    const c = DICTS[lang].nav;
    const nav = document.getElementById("nav");
    if (!nav) return;
    nav.innerHTML = `
      <a href="#" class="brand-row">
        <img class="logo" src="/brand/hullsight-logo.png" alt="">
        <span class="brand-name">Hull<span class="accent">Sight</span></span>
      </a>
      <nav class="links hide-m">
        <a href="#why">${c.platform}</a>
        <a href="#dual">${c.dualUse}</a>
        <a href="#how">${c.how}</a>
        <a href="#proof">${c.live}</a>
        <a href="/demo">${c.demo}</a>
      </nav>
      <div class="nav-right">
        <button id="langbtn" class="btn btn-hair sm lang-sm">${lang === "pl" ? "EN" : "PL"}</button>
        <a class="btn btn-hair sm" href="/">${c.openApp}</a>
        <a class="btn btn-solid sm book-sm" href="#cta">${c.book}</a>
      </div>`;
    document.getElementById("langbtn")?.addEventListener("click", () => toggleLang());
  }

  function wireVideo() {
    const hero = document.getElementById("hero");
    const video = document.getElementById("demoVideo") as HTMLVideoElement | null;
    const prog = document.getElementById("vProg");

    const start = () => {
      if (!video) return;
      const p = video.play();
      if (p) p.catch(() => undefined);
    };

    video?.addEventListener("loadedmetadata", () => {
      if (video) video.currentTime = 0;
    });
    video?.addEventListener("timeupdate", () => {
      if (!video || !video.duration) return;
      if (prog) prog.style.width = `${(video.currentTime / video.duration) * 100}%`;
    });
    video?.addEventListener("ended", start);

    hero?.addEventListener("click", () => {
      if (video && video.paused) start();
    });

    if (video) {
      video.addEventListener("loadeddata", start, { once: true });
      video.addEventListener("canplaythrough", start, { once: true });
    }
  }

  function wireScroll() {
    const html = document.documentElement;
    const threshold = () => Math.max(1, window.innerHeight - 100);
    const check = () => {
      const past = window.scrollY > threshold();
      html.classList.toggle("nav-show", past);
      const atBottom = window.scrollY > html.scrollHeight - window.innerHeight - 180;
      document.getElementById("scrollHint")?.classList.toggle("hide", atBottom);
      const bar = document.getElementById("scrBar");
      if (bar) {
        const max = html.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      }
      const hl = document.getElementById("heroLeft");
      if (hl) hl.style.transform = `translate3d(0, ${window.scrollY * 0.35}px, 0)`;
      const rail = document.getElementById("chRail");
      if (rail) {
        const heroH = threshold();
        const shown = window.scrollY > heroH * 0.6 && !atBottom;
        rail.classList.toggle("rail-hid", !shown);
        if (shown) {
          const cen = window.scrollY + window.innerHeight * 0.5;
          let cur = 0;
          RAIL_IDS.forEach((id, i) => {
            const s = document.getElementById(id);
            if (s && s.getBoundingClientRect().top + window.scrollY <= cen) cur = i;
          });
          rail.querySelectorAll(".ch").forEach((a, i) => a.classList.toggle("on", i === cur));
          const max = html.scrollHeight - window.innerHeight;
          rail.style.setProperty("--pct", `${max > 0 ? Math.max(0, Math.min(1, (window.scrollY - heroH) / Math.max(1, max - heroH))) : 0}`);
        }
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
  }

  function wireScrollHint() {
    const hint = document.getElementById("scrollHint");
    if (!hint) return;
    window.setTimeout(() => hint.classList.add("show"), 8000);
    hint.addEventListener("click", () => {
      const target = document.getElementById("gap");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  }

  function wireWaitlist() {
    const form = document.getElementById("waitList") as HTMLFormElement | null;
    const ok = document.getElementById("waitOk");
    const input = document.getElementById("waitEmail") as HTMLInputElement | null;
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (input?.value ?? "").trim();
      if (!val || !val.includes("@")) {
        form.classList.remove("shake");
        void form.offsetWidth;
        form.classList.add("shake");
        return;
      }
      form.classList.add("ok");
      ok?.classList.remove("hid");
      try {
        const list = JSON.parse(localStorage.getItem("hs-waitlist") ?? "[]");
        list.push({ email: val, ts: Date.now() });
        localStorage.setItem("hs-waitlist", JSON.stringify(list));
      } catch {
        /* noop */
      }
    });
    document.getElementById("ctaPrimary")?.addEventListener("click", (e) => {
      e.preventDefault();
      const list = document.getElementById("waitList");
      list?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => (document.getElementById("waitEmail") as HTMLInputElement)?.focus(), 520);
    });
  }

  function wireAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = (a as HTMLAnchorElement).getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector<HTMLElement>(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }
}

function revealInit() {
  const els = document.querySelectorAll<HTMLElement>(".reveal, .stagger");
  if (!("IntersectionObserver" in window)) {
    els.forEach((e) => e.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (ents) => {
      for (const en of ents) {
        const el = en.target as HTMLElement;
        if (en.isIntersecting) {
          el.classList.add("in");
          if (el.classList.contains("count-group")) {
            el.querySelectorAll<HTMLElement>(".stat-big").forEach(countUp);
          }
        } else {
          el.classList.remove("in");
        }
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -7% 0px" }
  );
  els.forEach((e) => io.observe(e));
}

const counted = new WeakSet<HTMLElement>();
function countUp(el: HTMLElement) {
  const src = el.dataset.cnt;
  if (!src) return;
  const m = src.match(/^([\d]+(?:[.,]\d+)?)(.*)$/);
  if (!m) return;
  counted.add(el);
  const target = parseFloat(m[1].replace(",", "."));
  const suffix = m[2];
  const dec = m[1].includes(".") || m[1].includes(",") ? (m[1].split(/[.,]/)[1]?.length ?? 1) : 0;
  const fmt = (v: number) => (dec ? v.toFixed(dec).replace(".", ",") : Math.round(v).toString());
  const dur = 1300;
  el.classList.remove("done");
  el.innerHTML = "";
  const t0 = performance.now();
  const tick = (t: number) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    const txt = fmt(target * eased);
    el.innerHTML = txt + (suffix ? `<span class="stat-unit">${suffix}</span>` : "");
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      el.classList.add("done");
    }
  };
  requestAnimationFrame(tick);
}
