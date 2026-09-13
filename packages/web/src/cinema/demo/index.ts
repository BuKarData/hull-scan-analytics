import { DICTS, type Lang } from "./copy";
import "./../cinema.css";
import "./demo.css";

const VIDS = DICTS.pl.films.list.map((f) => f.id);

/* ------------------------------------------------------------------ YT iframe API (minimal, display-only player) */

interface YtPlayer {
  playVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  destroy(): void;
}

interface YtNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YtPlayer;
}

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYtApi(): Promise<void> {
  return new Promise((resolve) => {
    const w = window as Window;
    if (w.YT && w.YT.Player) {
      resolve();
      return;
    }
    let done = false;
    w.onYouTubeIframeAPIReady = () => {
      if (done) return;
      done = true;
      resolve();
    };
    if (!document.getElementById("yt-api")) {
      const s = document.createElement("script");
      s.id = "yt-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

function ytPlayerVars(id: string): Record<string, string | number> {
  return {
    autoplay: 1,
    mute: 1,
    loop: 1,
    playlist: id,
    playsinline: 1,
    rel: 0,
    controls: 0,
    disablekb: 1,
    fs: 0,
    modestbranding: 1,
    iv_load_policy: 3,
    cc_load_policy: 0,
  };
}

/* ------------------------------------------------------------------ copy helpers */

function setText(id: string, txt: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function posterHtml(title: string, hint: string): string {
  return `
    <div class="vposter">
      <div class="vring"></div>
      <div class="vplay"></div>
      <div class="vposter-name">${title}</div>
      <div class="vposter-hint">${hint}</div>
    </div>`;
}

function soundChip(label: string): string {
  return `<button type="button" class="v-sound" tabindex="-1"><i class="sd"></i>${label}</button>`;
}

/* ------------------------------------------------------------------ sections */

function secTicker(lang: Lang): string {
  const items = DICTS[lang].ticker.map((t) => `<span>${t}</span>`).join("");
  const loop = items + items;
  return `
  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">${loop}</div>
  </div>`;
}

function secWatch(lang: Lang): string {
  const w = DICTS[lang].watch;
  const steps = w.items.map((s, i) => `<div class="wstep"><div class="wnum hud">0${i + 1}</div><div class="wtxt">${s}</div></div>`).join("");
  return `
  <section class="demo-sec" id="watch">
    <div class="demo-inner reveal">
      <span class="eyebrow">${w.kicker}</span>
      <h2 class="sec-title">${w.title}</h2>
      <div class="watch-grid">${steps}</div>
    </div>
  </section>`;
}

function secFilmIntro(lang: Lang): string {
  const f = DICTS[lang].films;
  return `
  <section class="demo-sec" id="films">
    <div class="demo-inner reveal">
      <span class="eyebrow">${f.kicker}</span>
      <h2 class="sec-title">${f.title}</h2>
      <p class="sec-sub">${f.subtitle}</p>
    </div>
  </section>`;
}

function secFilm(fb: { id: string; n: string; tag: string; step: string; title: string; pull: string; desc: string }, sound: string, plays: string, i: number): string {
  return `
  <section class="video-sec" id="v${i + 1}">
    <div class="demo-inner reveal">
      <div class="v-top">
        <div class="v-bignum hud">${fb.n}</div>
        <div class="v-top-txt">
          <span class="eyebrow">${fb.tag} · ${fb.step}</span>
          <h3 class="v-pull">${fb.pull}</h3>
        </div>
      </div>
      <div class="vframe" data-idx="${i}">
        ${posterHtml(fb.title, sound)}
        ${soundChip(sound)}
      </div>
      <div class="v-under">
        <div class="vmeta">
          <span class="vdot"></span><span>${fb.step}</span><span class="vdot"></span><span>${plays}</span><span class="vdot"></span><span>${sound}</span>
        </div>
        <h4 class="vtitle">${fb.title}</h4>
        <p class="dim slim vdesc">${fb.desc}</p>
      </div>
    </div>
  </section>`;
}

function secUses(lang: Lang): string {
  const u = DICTS[lang].uses;
  const cards = u.cases
    .map(
      (c) => `
      <div class="u-card">
        <div class="u-name">${c.name}</div>
        <div class="u-what">${c.what}</div>
        <div class="u-why"><b>${u.whyLabel}</b><br>${c.why}</div>
      </div>`
    )
    .join("");
  return `
  <section class="demo-sec" id="uses" style="background:var(--b-bg1)">
    <div class="demo-inner reveal">
      <span class="eyebrow">${u.kicker}</span>
      <h2 class="sec-title">${u.title}</h2>
      <p class="sec-sub">${u.subtitle}</p>
      <div class="use-grid">${cards}</div>
      <blockquote class="quote">${u.line}</blockquote>
    </div>
  </section>`;
}

function secQuiz(lang: Lang): string {
  const q = DICTS[lang].quiz;
  const items = q.items.map((it, i) => `<button type="button" class="q-chip" data-i="${i}"><span class="box"></span><span>${it}</span></button>`).join("");
  return `
  <section class="demo-sec" id="quiz">
    <div class="demo-inner reveal">
      <span class="eyebrow">${q.kicker}</span>
      <h2 class="sec-title">${q.title}</h2>
      <p class="sec-sub">${q.hint}</p>
      <div class="quiz-wrap">
        <div class="q-chips">${items}</div>
        <div class="q-result">
          <div class="q-score">
            <div class="q-score-n" id="qNum">0</div>
            <div class="q-score-l">/ ${q.items.length}</div>
          </div>
          <div class="q-result-txt" id="qTxt">${q.empty}</div>
        </div>
      </div>
    </div>
  </section>`;
}

function secFaq(lang: Lang): string {
  const o = DICTS[lang].faq;
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
  <section class="demo-sec" id="faq">
    <div class="demo-inner narrow reveal">
      <span class="eyebrow">${o.kicker}</span>
      <h2 class="sec-title">${o.title}</h2>
      <div class="obj-list">${items}</div>
    </div>
  </section>`;
}

function secOffer(lang: Lang): string {
  const c = DICTS[lang].offer;
  return `
  <section class="demo-sec offer" id="offer">
    <div class="demo-inner cta-inner reveal">
      <span class="eyebrow center">${c.kicker}</span>
      <h2 class="cta-title">${c.title}</h2>
      <p class="cta-sub">${c.subtitle}</p>
      <div class="cta-btns">
        <a class="btn btn-solid" href="/">${c.primary}</a>
        <a class="btn btn-hair" href="#v1">${c.secondary}</a>
      </div>
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
      </div>
    </div>
    <div class="foot-copy hud dim">HULLSIGHT © 2026 · BALTIC DUAL USE HACKATHON · GDAŃSK</div>
  </footer>`;
}

function heroMarkup(): string {
  return `
  <section class="d-hero" id="top">
    <div class="hero-orb hero-orb-a"></div>
    <div class="hero-orb hero-orb-b"></div>
    <div class="d-hero-inner">
      <span class="eyebrow" id="heroKicker"></span>
      <h1 class="d-h1"><span id="h1a"></span><span class="accent" id="h1b"></span></h1>
      <p class="d-hero-sub" id="heroSub"></p>
      <div class="d-hero-ctas">
        <a class="btn btn-solid" id="ctaPlay" href="#films"></a>
        <a class="btn btn-hair" id="ctaLive" href="/"></a>
        <a class="btn btn-link" id="ctaCase" href="#uses"></a>
      </div>
      <p class="d-hero-note" id="heroNote"></p>
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
    <div class="hs-b hs-demo">
      ${heroMarkup()}
      <main id="secWrap"></main>
      <div id="footWrap"></div>
    </div>`;

  const progress = document.createElement("div");
  progress.className = "page-progress";
  progress.id = "pageProg";
  progress.innerHTML = "<i></i>";
  document.body.prepend(progress);

  const nav = document.createElement("header");
  nav.className = "demo-nav";
  nav.id = "demoNav";
  document.body.prepend(nav);

  renderNav();
  renderHero();
  renderSections();
  wireVideos();
  wireQuiz();
  wireAnchors();
  wireProgress();
  revealInit();
  renderLang();

  function renderLang() {
    nav.querySelectorAll(".demo-lang").forEach((b) => {
      (b as HTMLElement).textContent = lang === "pl" ? "EN" : "PL";
    });
  }

  function toggleLang() {
    lang = lang === "pl" ? "en" : "pl";
    localStorage.setItem("hs-landing-lang", lang);
    renderNav();
    renderHero();
    renderSections();
    renderLang();
    wireQuiz();
    wireAnchors();
    revealInit();
  }

  function renderHero() {
    const c = DICTS[lang].hero;
    setText("heroKicker", c.kicker);
    setText("h1a", c.h1Line1);
    setText("h1b", c.h1Line2);
    setText("heroSub", c.sub);
    setText("heroNote", c.note);
    setText("ctaPlay", c.ctaPrimary);
    setText("ctaLive", c.ctaSecondary);
    setText("ctaCase", c.ctaTertiary);
  }

  function renderSections() {
    const wrap = document.getElementById("secWrap");
    if (wrap) {
      const f = DICTS[lang].films;
      const films = f.list.map((fb, i) => secFilm(fb, f.sound, f.plays, i)).join("");
      wrap.innerHTML = [secTicker(lang), secWatch(lang), secFilmIntro(lang), films, secUses(lang), secQuiz(lang), secFaq(lang), secOffer(lang)].join("");
    }
    const foot = document.getElementById("footWrap");
    if (foot) foot.innerHTML = secFooter(lang);
  }

  function renderNav() {
    const c = DICTS[lang].nav;
    nav.innerHTML = `
      <a href="/landing" class="brand-row">
        <img class="logo" src="/brand/hullsight-logo.png" alt="">
        <span class="brand-name">Hull<span class="accent">Sight</span></span>
      </a>
      <nav class="demo-links hide-m">
        <a href="/landing">${c.landing}</a>
        <a href="#films" class="on">${c.films}</a>
        <a href="/">${c.app}</a>
      </nav>
      <div class="demo-nav-right">
        <button id="langbtn" class="btn btn-hair sm lang-sm demo-lang">${lang === "pl" ? "EN" : "PL"}</button>
        <a class="btn btn-solid sm book-sm" href="/">${c.app}</a>
      </div>`;
    document.getElementById("langbtn")?.addEventListener("click", () => toggleLang());
  }

  const players: (YtPlayer | null)[] = VIDS.map(() => null);
  const mounted: boolean[] = VIDS.map(() => false);

  async function mountPlayer(idx: number) {
    const frame = document.querySelector<HTMLElement>(`.vframe[data-idx="${idx}"]`);
    if (!frame || mounted[idx]) return;
    mounted[idx] = true;
    await loadYtApi();
    if (!mounted[idx] || !frame.isConnected) return;
    frame.querySelector(".vposter")?.remove();
    const host = document.createElement("div");
    host.className = "vhost";
    frame.appendChild(host);
    const player = new window.YT!.Player(host, {
      videoId: VIDS[idx],
      host: "https://www.youtube-nocookie.com",
      width: "100%",
      height: "100%",
      playerVars: ytPlayerVars(VIDS[idx]),
      events: {
        onReady: (e: { target: YtPlayer }) => {
          e.target.mute();
          e.target.playVideo();
        },
      },
    });
    players[idx] = player;
  }

  function unmountPlayer(idx: number) {
    mounted[idx] = false;
    const p = players[idx];
    players[idx] = null;
    try {
      p?.destroy();
    } catch {
      /* noop */
    }
    const frame = document.querySelector<HTMLElement>(`.vframe[data-idx="${idx}"]`);
    if (frame) {
      frame.querySelectorAll(".vhost, iframe").forEach((n) => n.remove());
      const chip = frame.querySelector<HTMLElement>(".v-sound");
      if (!frame.querySelector(".vposter")) {
        const fb = DICTS[lang].films.list[idx];
        frame.insertAdjacentHTML("afterbegin", posterHtml(fb?.title ?? "", DICTS[lang].films.sound));
      }
      if (chip) chip.classList.remove("on");
    }
  }

  function toggleSound(idx: number) {
    const p = players[idx];
    if (!p) return;
    const muted = p.isMuted();
    if (muted) p.unMute();
    else p.mute();
    const frame = document.querySelector<HTMLElement>(`.vframe[data-idx="${idx}"]`);
    frame?.querySelector(".v-sound")?.classList.toggle("on", muted);
  }

  function wireVideos() {
    const frames = Array.from(document.querySelectorAll<HTMLElement>(".vframe"));
    const io = new IntersectionObserver(
      (ents) => {
        for (const en of ents) {
          const idx = Number((en.target as HTMLElement).dataset.idx ?? -1);
          if (en.isIntersecting) mountPlayer(idx);
          else unmountPlayer(idx);
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -6% 0px" }
    );
    frames.forEach((fr) => {
      io.observe(fr);
      fr.addEventListener("click", () => {
        const idx = Number(fr.dataset.idx ?? -1);
        if (idx < 0) return;
        if (!mounted[idx]) mountPlayer(idx);
        else toggleSound(idx);
      });
    });
  }

  function wireQuiz() {
    const chips = Array.from(document.querySelectorAll<HTMLElement>(".q-chip"));
    const num = document.getElementById("qNum");
    const txt = document.getElementById("qTxt");
    const q = DICTS[lang].quiz;
    let count = 0;
    const on = new Array(chips.length).fill(false);
    const update = () => {
      count = on.filter(Boolean).length;
      if (num) num.textContent = String(count);
      if (txt) {
        if (count === 0) txt.textContent = q.empty;
        else if (count <= 3) txt.textContent = q.lo;
        else txt.textContent = q.hi;
      }
    };
    chips.forEach((ch) => {
      ch.addEventListener("click", () => {
        const i = Number(ch.dataset.i ?? -1);
        if (i < 0 || i >= on.length) return;
        on[i] = !on[i];
        ch.classList.toggle("on", on[i]);
        update();
      });
    });
    update();
  }

  function wireProgress() {
    const bar = document.getElementById("pageProg")?.querySelector("i");
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (bar) bar.style.width = `${p.toFixed(2)}%`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  }

  function wireAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = (a as HTMLAnchorElement).getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector<HTMLElement>(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }
}

boot();

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
    { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
  );
  els.forEach((e) => io.observe(e));
}