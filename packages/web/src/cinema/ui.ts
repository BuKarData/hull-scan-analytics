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
    <div class="sec-inner reveal">
      <span class="eyebrow">${p.kicker}</span>
      <h2 class="sec-title">${p.title}</h2>
      <p class="sec-sub">${p.subtitle}</p>
      <div class="split">
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
    .map((r) => {
      const cells = [r.who, r.cost, r.speed, r.access, r.depth, r.verdict]
        .map((c, j) => `<div class="b-cell${j === 0 ? " b-who" : ""}${j === 5 ? " b-verdict" : ""}"><span class="mobile-label">${b.head[j]}</span>${c}</div>`)
        .join("");
      return `<div class="b-row${r.accent ? " b-accent" : ""}">${cells}</div>`;
    })
    .join("");
  return `
  <section id="gap" class="sec">
    <div class="sec-inner reveal">
      <span class="eyebrow">${b.kicker}</span>
      <h2 class="sec-title">${b.title}</h2>
      <p class="sec-sub">${b.subtitle}</p>
      <div class="b-table">
        <div class="b-head">${head}</div>
        ${rows}
      </div>
    </div>
  </section>`;
}

function secHow(lang: Lang): string {
  const h = DICTS[lang].how;
  const steps = h.steps
    .map(
      (s) => `
      <div class="step">
        <div class="step-num">${s.n}</div>
        <h3 class="step-title">${s.t}</h3>
        <p class="dim step-d">${s.d}</p>
      </div>`
    )
    .join("");
  const tech = h.tech.map((x) => `<span class="hud-tag"><span class="accent">/</span> ${x}</span>`).join("");
  return `
  <section id="how" class="sec">
    <div class="sec-inner reveal">
      <span class="eyebrow">${h.kicker}</span>
      <h2 class="sec-title">${h.title}</h2>
      <p class="sec-sub">${h.subtitle}</p>
      <div class="steps">${steps}</div>
      <div class="tech-row">${tech}</div>
    </div>
  </section>`;
}

function heatCells(): string {
  let out = "";
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 20; c++) {
      const x = c / 20;
      const y = r / 10;
      let v = Math.sin(x * 9 + y * 4) * 0.12;
      if ((x > 0.55 && x < 0.72 && y > 0.5 && y < 0.75) || (x > 0.1 && x < 0.22 && y > 0.15 && y < 0.4)) v = -0.85;
      if (x > 0.3 && x < 0.45 && y > 0.6 && y < 0.95) v = -0.55;
      if (x > 0.74 && x < 0.9 && y < 0.32) v = 0.75;
      out += `<i style="background:${v < 0 ? `rgba(255,92,108,${0.15 + -v * 0.85})` : v > 0 ? `rgba(55,242,255,${0.5 + v * 0.5})` : "rgba(140,160,185,0.16)"}"></i>`;
    }
  }
  return out;
}

function secDetect(lang: Lang): string {
  const d = DICTS[lang].detect;
  const rows = d.defects
    .map(
      (df) => `
      <div class="d-row">
        <div class="d-main">
          <div class="d-name">${lang === "pl" ? df.name : df.en}</div>
          <div class="dim d-desc">${df.d}</div>
        </div>
        <div class="d-side">
          <span class="d-sev">${df.sev}</span>
          <span class="d-mm">${df.mm}</span>
        </div>
      </div>`
    )
    .join("");
  const legend = d.gridLegend
    .map((l, i) => `<span class="lg"><i class="lg-dot" style="background:${["#ff5c6c", "#8ca0b9", "#37f2ff"][i]}"></i>${l}</span>`)
    .join("");
  return `
  <section id="detect" class="sec">
    <div class="sec-inner reveal">
      <span class="eyebrow">${d.kicker}</span>
      <h2 class="sec-title">${d.title}</h2>
      <p class="sec-sub">${d.subtitle}</p>
      <div class="grid-2">
        <div class="d-list">${rows}</div>
        <div class="card heat-card">
          <div class="card-head">
            <span class="hud dim">${d.gridCaption}</span>
            <span class="pulse-dot"></span>
          </div>
          <div class="heat-grid">${heatCells()}</div>
          <div class="heat-legend">${legend}</div>
        </div>
      </div>
    </div>
  </section>`;
}

function secDual(lang: Lang): string {
  const d = DICTS[lang].dualuse;
  const cards = (k: "civilian" | "defense") =>
    `<div class="card dcard" style="border-top:2px solid ${k === "civilian" ? "#3b9dff" : "#8b6cff"}">
      <div class="label-accent" style="color:${k === "civilian" ? "#3b9dff" : "#8b6cff"}">${d[k].head}</div>
      <h3 class="dcard-title">${d[k].title}</h3>
      <ul class="dcard-list">
        ${d[k].items.map((it) => `<li><i class="dot" style="background:${k === "civilian" ? "#3b9dff" : "#8b6cff"}"></i>${it}</li>`).join("")}
      </ul>
    </div>`;
  return `
  <section id="dual" class="sec">
    <div class="sec-inner reveal">
      <span class="eyebrow">${d.kicker}</span>
      <h2 class="sec-title">${d.title}</h2>
      <p class="sec-sub">${d.subtitle}</p>
      <div class="grid-2">${cards("civilian")}${cards("defense")}</div>
      <blockquote class="quote">${d.line}</blockquote>
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
        <stop offset="0" stop-color="rgba(59,157,255,0.35)"></stop>
        <stop offset="1" stop-color="rgba(59,157,255,0.02)"></stop>
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#sg)"></path>
    <path d="${peak}" fill="none" stroke="#8fa3bd" stroke-width="2" vector-effect="non-scaling-stroke"></path>
    <path d="${avg}" fill="none" stroke="#3b9dff" stroke-width="2" vector-effect="non-scaling-stroke"></path>
    <line x1="0" y1="${h}" x2="${w}" y2="${h}" stroke="rgba(226,232,240,0.1)" stroke-width="1" vector-effect="non-scaling-stroke"></line>
    <line x1="0" y1="${h * 0.25}" x2="${w}" y2="${h * 0.25}" stroke="rgba(226,232,240,0.06)" stroke-width="1" vector-effect="non-scaling-stroke"></line>
    <g fill="#3b9dff">
      <circle cx="${TREND_AVG.length - 1}" cy="${h - 4}" r="0"></circle>
    </g>
    ${ticks
      .split(" ")
      .map((x, i) => `<text x="${x}" y="${h + 18}" text-anchor="middle" fill="rgba(226,232,240,0.45)" font-family="ui-monospace,monospace" font-size="10">SC${i + 1}</text>`)
      .join("")}
  </svg>`;
}

function secProof(lang: Lang): string {
  const p = DICTS[lang].proof;
  const stats = p.stats
    .map(
      (s) => `
      <div class="stat">
        <div class="stat-big">${s.big}${s.unit && `<span class="stat-unit">${s.unit}</span>`}</div>
        <div class="stat-label">${s.label}</div>
        <div class="hud dim stat-note">${s.note}</div>
      </div>`
    )
    .join("");
  const fleet = FLEET.map(
    (f) => `
    <a class="card fleet" href="#cta">
      <div class="fhead"><span class="hud dim">${f.type}</span><span class="num dim">${f.len} m</span></div>
      <div class="fname">${f.name}</div>
      <div class="fmeta">${f.scans} scans · ${f.defects} open</div>
    </a>`
  ).join("");
  return `
  <section id="proof" class="sec">
    <div class="sec-inner reveal">
      <span class="eyebrow">${p.kicker}</span>
      <h2 class="sec-title">${p.title}</h2>
      <p class="sec-sub">${p.subtitle}</p>
      <div class="stats">${stats}</div>
      <div class="card trend-card">
        <div class="card-head">
          <span class="t-title">${p.trendTitle}</span>
          <span class="t-legend"><i class="lg-dot" style="background:#3b9dff"></i>${p.trendLegend1}<i class="lg-dot" style="background:#8fa3bd"></i>${p.trendLegend2}</span>
        </div>
        <div class="spark-wrap">${sparkline()}</div>
        <div class="card-foot">${p.trendCaption}</div>
      </div>
      <div class="fleet-label">${p.fleet}</div>
      <div class="fleet-grid">${fleet}</div>
      <div class="card tooling">
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
      <details class="obj" ${i === 0 ? "open" : ""}>
        <summary class="obj-q">${it.q}<span class="obj-x"></span></summary>
        <p class="obj-a">${it.a}</p>
      </details>`
    )
    .join("");
  return `
  <section id="obj" class="sec narrow">
    <div class="reveal">
      <span class="eyebrow">${o.kicker}</span>
      <h2 class="sec-title">${o.title}</h2>
      <div class="obj-list">${items}</div>
    </div>
  </section>`;
}

function secCta(lang: Lang): string {
  const c = DICTS[lang].cta;
  return `
  <section id="cta" class="sec cta">
    <div class="cta-inner reveal">
      <span class="eyebrow center">${c.kicker}</span>
      <h2 class="cta-title">${c.title}</h2>
      <p class="cta-sub">${c.subtitle}</p>
      <div class="cta-btns">
        <a class="btn btn-solid" id="ctaPrimary" href="#waitList">${c.primary}</a>
        <a class="btn btn-hair" href="/">${c.secondary}</a>
      </div>
      <form class="wait" id="waitList" novalidate>
        <div class="wait-head">${c.formLabel}</div>
        <div class="wait-rel">
          <input class="wait-input" id="waitEmail" type="email" required placeholder="${c.formPlaceholder}">
          <button class="btn btn-solid sm wait-btn" type="submit">&rarr;</button>
        </div>
        <p class="wait-note dim slim">${c.formNote}</p>
        <p class="wait-ok hid" id="waitOk">${c.formOk}</p>
      </form>
      <div class="hud dim cta-note">${c.note}</div>
    </div>
  </section>`;
}

function secFooter(lang: Lang): string {
  const f = DICTS[lang].footer;
  return `
  <footer class="footer">
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
  <section id="hero" class="hero">
    <div class="hero-bg"></div>
    <div class="hero-grid"></div>
    <div class="grain"></div>
    <div class="vig"></div>

    <div class="hero-inner">
      <div class="hero-left reveal in">
        <div class="hero-chips">
          <span class="chip" id="heroChip"></span>
          <span class="chip" id="liveChip"></span>
        </div>
        <h1 class="h1"><span id="h1a"></span><span class="accent" id="h1b"></span></h1>
        <p class="hero-sub" id="heroSub"></p>
        <div class="hero-ctas">
          <a class="btn btn-solid" id="ctaOpen" href="/"></a>
          <a class="btn btn-hair" id="ctaFilm" href="#video"></a>
          <a class="btn btn-link" id="ctaWhy" href="#why"></a>
        </div>
        <div class="hero-tags" id="heroTags"></div>
      </div>

      <div class="hero-right reveal in">
        <div class="video-stage" id="video">
          <video class="demo-video" id="demoVideo" muted playsinline loop preload="none"></video>
          <div class="video-ph" id="videoPh">
            <div class="film-strip film-top"></div>
            <div class="film-strip film-bot"></div>
            <div class="v-grid"></div>
            <div class="v-scan"></div>
            <div class="v-hud"><span class="rec-dot"></span><span id="vHud"></span></div>
            <div class="v-center">
              <button class="v-play" id="playDemo" aria-label="play">
                <svg viewBox="0 0 20 20" width="22" height="22"><path d="M7 4.5v11l9-5.5z"/></svg>
              </button>
              <div class="v-title" id="vTitle"></div>
              <div class="v-meta">
                <span class="chip" id="vTimer"></span>
                <span class="v-sub" id="vSub"></span>
              </div>
            </div>
            <div class="v-toast" id="vToast"></div>
          </div>
          <div class="v-progress"><i id="vProg"></i></div>
        </div>
        <div class="v-cap"><span id="vCap"></span><span class="v-cap-r hud dim">16:9 · H.264 · <span class="warn-soft">PLACEHOLDER</span></span></div>
      </div>
    </div>
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

  renderNav();
  renderHeroText();
  renderSections();
  wireVideo();
  wireScroll();
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
    wireAnchors();
    revealInit();
  }

  function renderHeroText() {
    const c = DICTS[lang].hero;
    setText("heroChip", c.chipTop);
    setText("liveChip", c.liveBadge);
    setText("h1a", c.h1Line1);
    setText("h1b", c.h1Line2);
    setText("heroSub", c.sub);
    setText("ctaOpen", c.ctaPrimary);
    setText("ctaFilm", c.ctaSecondary);
    setText("ctaWhy", c.ctaTertiary);
    setText("vHud", c.videoKicker);
    setText("vTitle", c.videoTitle);
    setText("vTimer", c.videoTimer);
    setText("vSub", c.videoSub);
    setText("vCap", c.videoCap);
    document.getElementById("heroTags")!.innerHTML = c.tags.map((t) => `<span class="chip">${t}</span>`).join("");
  }

  function renderSections() {
    const wrap = document.getElementById("secWrap");
    if (wrap)
      wrap.innerHTML = [
        secProblem(lang),
        secBridge(lang),
        secHow(lang),
        secDetect(lang),
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
      </nav>
      <div class="nav-right">
        <button id="langbtn" class="btn btn-hair sm">${lang === "pl" ? "EN" : "PL"}</button>
        <a class="btn btn-hair sm" href="/">${c.openApp}</a>
        <a class="btn btn-solid sm" href="#cta">${c.book}</a>
      </div>`;
    document.getElementById("langbtn")?.addEventListener("click", () => toggleLang());
  }

  function wireVideo() {
    const stage = document.getElementById("video");
    const video = document.getElementById("demoVideo") as HTMLVideoElement | null;
    const playBtn = document.getElementById("playDemo");
    const prog = document.getElementById("vProg");
    let toastTimer: ReturnType<typeof setTimeout> | null = null;

    const toggle = () => {
      if (!stage || !video) return;
      if (video.currentSrc) {
        if (video.paused) {
          video.play();
          stage.classList.add("playing");
        } else {
          video.pause();
          stage.classList.remove("playing");
        }
      } else {
        stage.classList.remove("wants-play");
        void stage.offsetWidth;
        stage.classList.add("wants-play");
        setText("vToast", DICTS[lang].hero.toast);
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => stage.classList.remove("wants-play"), 3600);
      }
    };

    playBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });
    stage?.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("#playDemo")) return;
      toggle();
    });

    if (video) {
      video.addEventListener("timeupdate", () => {
        if (prog && video.duration) prog.style.width = `${(video.currentTime / video.duration) * 100}%`;
      });
      video.addEventListener("ended", () => {
        stage?.classList.remove("playing");
      });
    }
  }

  function wireScroll() {
    const html = document.documentElement;
    const check = () => html.classList.toggle("scrolled", window.scrollY > 10);
    check();
    window.addEventListener("scroll", check, { passive: true });
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
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach((e) => e.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (ents) => {
      for (const en of ents)
        if (en.isIntersecting) {
          (en.target as HTMLElement).classList.add("in");
          io.unobserve(en.target);
        }
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
  );
  els.forEach((e) => io.observe(e));
}
