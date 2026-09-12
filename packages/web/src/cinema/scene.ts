import * as THREE from "three";

export type Phase = "film" | "sweep" | "inspect";

export interface SceneTick {
  p: number;
  phase: Phase;
  revealU: number;
  pts: number;
}

export const DURATION = 17;

const FILM_END = 0.32;
const SWEEP_START = 0.34;
const SWEEP_END = 0.68;
const SCAN_START = 0.78;

const WATER_Y = 2.2;
const HALF_LEN = 22;
const TOTAL_POINTS = 2480;

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}
function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function hash3(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

/* ---------------------------------------------------------------- colors */

function heatAt(x: number, y: number, z: number): number {
  let v = 0;
  const blob = (cx: number, cy: number, cz: number, r: number, val: number, soft = 2.2) => {
    const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy) + (z - cz) * (z - cz);
    const d = Math.sqrt(d2);
    v += val * Math.exp(-Math.pow(Math.max(0, d - r * 0.35) / (r * 0.6), soft));
  };
  blob(14.5, 1.3, 1.7, 2.6, -1); // bow dent
  blob(11.0, 3.0, -1.8, 1.4, -0.4); // coating loss
  blob(-13.5, 3.4, 0.2, 2.8, 0.85); // bulge stern
  blob(-8.2, 1.4, 1.9, 0.9, 0.48); // biofouling patch
  blob(-8.6, 1.5, -2.1, 0.8, 0.48);
  blob(-16.4, 1.6, 0.9, 0.8, 0.4);
  const corr =
    x > -3.6 && x < 4.4 && Math.abs(z) < 2.3 && y < 2.4
      ? -0.7 * (0.5 + 0.5 * Math.sin(x * 1.35 + Math.sin(y * 6.2) * 1.6 + Math.cos(z * 1.9)))
      : 0;
  v += Math.max(0, corr);
  return Math.max(-1, Math.min(1, v));
}

export const CLUSTERS = [
  { label: "DENT / IMPACT", mm: "−5.5 mm", pos: [15.4, 1.6, 2.2], sign: "dent" },
  { label: "CORROSION", mm: "−4.0 mm", pos: [0.4, 1.55, -0.4], sign: "dent" },
  { label: "BULGE / FAIRING", mm: "+2.8 mm", pos: [-14.2, 3.7, 0.0], sign: "bulge" },
  { label: "COATING LOSS", mm: "−1.6 mm", pos: [11.6, 3.2, -2.4], sign: "dent" },
  { label: "BIOFOULING", mm: "+3.2 mm", pos: [-8.4, 1.35, 2.3], sign: "bulge" },
] as const;

function heatColor(t: number): [number, number, number] {
  const k = Math.max(-1, Math.min(1, t));
  if (k < 0) {
    const a = -k;
    return [0.35 + 0.6 * a, 0.2 + 0.16 * a, 0.3 + 0.14 * a];
  }
  return [0.24 + 0.42 * k, 0.5 + 0.28 * k, 1.0];
}

/* ---------------------------------------------------------------- shaders */

const GAMMA = "col = pow(col, vec3(1.0/2.2));";

const OCEAN_VERT = /* glsl */ `
uniform float time;
varying vec3 vWorld;
varying float vH;
void main() {
  vec3 p = position;
  float n1 = sin(p.x * 0.05 + time * 1.0) * 0.5 + sin(p.z * 0.043 + time * 0.72) * 0.5;
  float n2 = sin((p.x + p.z * 0.6) * 0.12 + time * 1.4) * 0.42;
  float n3 = sin((p.x * 1.7 - p.z) * 0.06 + time * 0.5) * 0.24;
  float h = (n1 + n2 + n3) * 0.55;
  p.y += h;
  vH = h;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const OCEAN_FRAG = /* glsl */ `
uniform float time;
uniform vec3 deepCol;
uniform vec3 midCol;
uniform vec3 foamCol;
uniform float fade;
uniform vec3 sunDir;
uniform vec3 shipProj;
uniform float shipR;
varying vec3 vWorld;
varying float vH;
void main() {
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.2);
  vec3 col = mix(midCol, deepCol, clamp(vH * 1.6, 0.0, 1.0));
  float crest = smoothstep(0.62, 0.95, vH);
  col = mix(col, foamCol, crest * 0.75);
  vec3 n = vec3(-0.18, 1.0, 0.06);
  vec3 r = reflect(-sunDir, n);
  float spec = pow(max(dot(r, V), 0.0), 60.0);
  col += vec3(1.0, 0.9, 0.74) * spec * smoothstep(0.0, 0.35, V.y);
  col += vec3(0.45, 0.62, 0.78) * fres * 0.5;
  vec2 dp = vWorld.xz - shipProj.xz;
  float dship = length(dp);
  float foam = smoothstep(shipR, shipR * 0.55, dship);
  col = mix(col, foamCol, foam * clamp(1.55 + vH, 0.0, 1.0) * 0.85);
  col *= (1.0 - fade);
  vec3 outcol = mix(col, vec3(0.015, 0.02, 0.035), step(0.02, fade));
  ${GAMMA}
  gl_FragColor = vec4(outcol, 1.0 - fade);
}
`;

const SKY_VERT = /* glsl */ `
varying float vY;
void main() {
  vY = normalize(position).y * 0.5 + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAG = /* glsl */ `
uniform vec3 topCol;
uniform vec3 upperCol;
uniform vec3 horizonCol;
uniform float fade;
varying float vY;
void main() {
  vec3 col = vY > 0.62 ? mix(upperCol, topCol, clamp((vY - 0.62) / 0.38, 0.0, 1.0))
                       : mix(horizonCol, upperCol, clamp(vY / 0.62, 0.0, 1.0));
  float band = smoothstep(0.28, 0.4, vY);
  vec3 col2 = mix(col, horizonCol, band * 0.5);
  col2 = mix(col2, horizonCol, smoothstep(0.05, 0.24, vY) * 0.45);
  col2 *= (1.0 - fade);
  vec3 outcol = mix(col2, vec3(0.012, 0.016, 0.03), step(0.02, fade));
  ${GAMMA}
  gl_FragColor = vec4(outcol, 1.0 - fade);
}
`;

const SHIP_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aU;
attribute float aRust;
varying vec3 vN;
varying vec3 vWorld;
varying vec3 vColorV;
varying float vU;
varying float vRust;
void main() {
  vN = normalMatrix * normal;
  vColorV = aColor;
  vU = aU;
  vRust = aRust;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const SHIP_FRAG = /* glsl */ `
uniform vec3 lightDir;
uniform vec3 rimSky;
uniform float revealU;
uniform float waterY;
uniform float time;
uniform float envGlow;
varying vec3 vN;
varying vec3 vWorld;
varying vec3 vColorV;
varying float vU;
varying float vRust;
void main() {
  if (vU < revealU) discard;
  vec3 N = normalize(vN);
  vec3 L = normalize(lightDir);
  vec3 V = normalize(cameraPosition - vWorld);
  float diff = max(dot(N, L), 0.0);
  vec3 R = reflect(-L, N);
  float spec = pow(max(dot(R, V), 0.0), 40.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 col = vColorV * (0.42 + 0.9 * diff);
  float sunVis = max(dot(N, L), 0.0) * step(dot(N, V), 0.9) * 1.0;
  float glint = pow(max(dot(R, L), 0.0), 90.0) * sunVis;
  col += vec3(1.0, 0.82, 0.55) * (spec * 0.5 + glint * 0.6);
  col += rimSky * fres * (0.55 + 0.45 * clamp(1.0 - vU, 0.0, 1.0));
  col = mix(col, vec3(0.16, 0.06, 0.02), vRust * 0.8);
  float under = smoothstep(waterY + 0.4, waterY - 0.6, vWorld.y);
  col = mix(col, vec3(0.02, 0.03, 0.06) * (0.5 + 0.6 * diff), under);
  float fringe = 1.0 - smoothstep(0.0, 0.055, vU - revealU);
  col += vec3(0.15, 0.9, 1.0) * 0.55 * fringe * (0.8 + 0.2 * sin(time * 8.0)) * envGlow;
  col *= (0.55 + 0.45 * envGlow);
  ${GAMMA}
  gl_FragColor = vec4(col, 1.0);
}
`;

const POINT_VERT = /* glsl */ `
attribute vec3 aHeat;
attribute float aU;
uniform float revealU;
uniform float uScale;
uniform float uHalo;
varying vec3 vCol;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  if (aU > revealU) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vA = 0.0; return; }
  float edge = smoothstep(0.09, 0.0, aU - revealU);
  float pulse = 0.85 + 0.3 * sin(position.x * 7.3 + position.y * 13.1);
  gl_PointSize = uScale * pulse / max(1.0, -mv.z);
  gl_Position = projectionMatrix * mv;
  vCol = mix(aHeat, vec3(0.75, 0.95, 1.0), uHalo * 0.4);
  vA = edge;
}
`;

const POINT_FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.16, d);
  if (a <= 0.004 || vA <= 0.004) discard;
  vec3 col = vCol;
  ${GAMMA}
  gl_FragColor = vec4(col, a * vA * 0.88);
}
`;

const TWIN_FRAG = /* glsl */ `
uniform vec3 lightDir;
uniform float revealU;
uniform float opacityU;
varying vec3 vN;
varying vec3 vWorld;
varying vec3 vColorV;
varying float vU;
void main() {
  if (vU > revealU) discard;
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);
  vec3 col = vColorV;
  col += vec3(0.5, 0.9, 1.0) * fres * 0.65;
  float edge = 1.0 - smoothstep(0.0, 0.08, vU - revealU);
  col += vec3(0.2, 0.95, 1.0) * edge * 0.5;
  ${GAMMA}
  gl_FragColor = vec4(col, opacityU);
}
`;

/* ---------------------------------------------------------------- helpers */

function glowTexture(inner = "rgba(255,230,180,1)", mid = "rgba(255,190,110,0.4)", size = 128): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, mid);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function lambert(hex: string, opts: Partial<THREE.MeshLambertMaterialParameters> = {}) {
  return new THREE.MeshLambertMaterial({ color: new THREE.Color(hex), transparent: true, opacity: 1, ...opts });
}

function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, name?: string) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (name) m.name = name;
  return m;
}

/* ---------------------------------------------------------------- lofted hull */

interface HullGeo {
  geo: THREE.BufferGeometry;
  points: number[]; // compact point cloud x,y,z
}

const PROFILE: [number, number][] = [
  [1.0, 0.0], // 0 deck center
  [0.97, 0.97], // 1 + deck edge
  [0.88, 1.0], // 2 + top side
  [0.7, 1.0], // 3 + upper side
  [0.5, 0.99], // 4 + mid
  [0.34, 0.94], // 5 + bilge turn
  [0.18, 0.72], // 6 + lower
  [0.05, 0.0], // 7 keel
  [0.18, -0.72], // 8 - lower
  [0.34, -0.94], // 9 - bilge turn
  [0.5, -0.99], // 10 - mid
  [0.7, -1.0], // 11 - upper side
  [0.88, -1.0], // 12 - top side
  [0.97, -0.97], // 13 - deck edge
];
const RING = PROFILE.length;

function buildHull(): HullGeo {
  const positions: number[] = [];
  const indices: number[] = [];
  const uAttr: number[] = [];
  const rust: number[] = [];
  const colors: number[] = [];

  const halfBreadth = (s: number) => {
    let hb: number;
    if (s < -0.6) hb = 3.7;
    else if (s < 0.32) hb = 3.7 * (1 - 0.05 * Math.sin(((s + 0.6) / 0.92) * Math.PI));
    else hb = 3.7 * Math.pow(1 - (s - 0.32) / 0.68, 1.35) + 0.14;
    return hb;
  };

  const deckY = (s: number) => 6.2 + 0.28 * smooth(-1, -0.7, s) + 1.3 * smooth(0.26, 1, s);

  const N = 48;
  const ROWS = N + 1;
  const ring: { x: number; y: number; z: number }[][] = [];
  for (let i = 0; i < ROWS; i++) {
    const s = -1 + (i / N) * 2;
    const x = s * HALF_LEN;
    const hb = halfBreadth(s);
    const dy = deckY(s);
    const by = s > 0.66 ? ((s - 0.66) / 0.34) * 3.4 : 0;
    const ys = [
      dy,                 // 0 deck center
      dy,                 // 1 + deck edge
      5.7 + by * 0.85,    // 2
      4.5 + by * 0.6,     // 3
      3.25 + by * 0.55,   // 4
      2.25 + by * 0.5,    // 5
      1.25 + by * 0.4,    // 6
      0.25 + by * 0.3,    // 7 keel
      1.25 + by * 0.4,    // 8
      2.25 + by * 0.5,    // 9
      3.25 + by * 0.55,   // 10
      4.5 + by * 0.6,     // 11
      5.7 + by * 0.85,    // 12
      dy,                 // 13 - deck edge
    ];
    const zs = PROFILE.map(([, g]) => {
      const sideZ = Math.abs(g) > 0.05;
      const local = sideZ ? hb : hb * 0.5;
      return g * local;
    });
    ring.push(PROFILE.map((_, r) => ({ x, y: ys[r], z: zs[r] })));
  }
  void deckY;

  const vertOf = (s: number, r: number) => s * RING + r;
  for (let s = 0; s < ROWS - 1; s++) {
    for (let r = 0; r < RING; r++) {
      const rn = (r + 1) % RING;
      const a = vertOf(s, r);
      const b = vertOf(s, rn);
      const c = vertOf(s + 1, rn);
      const d = vertOf(s + 1, r);
      indices.push(b, a, c, b, c, d);
    }
  }

  // bow cap (fan from a tip)
  const bowCap = positions.length / 3;
  const tipY = deckY(1) - 1.6;
  positions.push(HALF_LEN + 1.4, tipY, 0);
  for (let r = 0; r < RING; r++) {
    indices.push(bowCap, vertOf(ROWS - 1, r), vertOf(ROWS - 1, (r + 1) % RING));
  }

  // stern cap (fan from a centroid)
  const sternCap = positions.length / 3;
  positions.push(-HALF_LEN, 3.6, 0);
  for (let r = 0; r < RING; r++) {
    indices.push(sternCap, vertOf(0, r), vertOf(0, (r + 1) % RING));
  }

  for (let s = 0; s < ROWS; s++) {
    for (let r = 0; r < RING; r++) {
      const p = ring[s][r];
      positions.push(p.x, p.y, p.z);
      let base: [number, number, number];
      if (p.y < 1.9) {
        base = [0.5 + hash3(p.x, p.y, p.z) * 0.08, 0.1 + hash3(p.z, p.x, p.y) * 0.05, 0.11 + hash3(p.y, p.z, p.x) * 0.06];
      } else if (p.y < 2.62) {
        base = [0.04, 0.045, 0.08];
      } else {
        base = [0.26 + hash3(p.x, p.y, p.z) * 0.06, 0.28 + hash3(p.z, p.x, p.y) * 0.06, 0.4 + hash3(p.y, p.z, p.x) * 0.06];
      }
      const rstreak =
        p.y < 4.2 && hash3(Math.floor(p.x * 2.1), Math.floor(p.z * 2.3), 7) < 0.16 ? mix(0.15, 0.85, hash3(p.z, p.x, p.x)) : 0;
      colors.push(base[0], base[1], base[2]);
      uAttr.push(clamp01((HALF_LEN - p.x) / (HALF_LEN * 2)));
      rust.push(rstreak);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("aU", new THREE.Float32BufferAttribute(uAttr, 1));
  geo.setAttribute("aRust", new THREE.Float32BufferAttribute(rust, 1));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  // dense point cloud from the loft profile
  const points: number[] = [];
  const P = 72;
  for (let i = 0; i < P; i++) {
    const s = -1 + (i / (P - 1)) * 2;
    const x = s * HALF_LEN;
    const hb = halfBreadth(s);
    const dy = deckY(s);
    const by = s > 0.66 ? ((s - 0.66) / 0.34) * 3.4 : 0;
    for (let r = 0; r < RING; r++) {
      const [, g] = PROFILE[r];
      let y: number;
      if (r === 0 || r === 1 || r === 13) y = dy;
      else if (r === 2 || r === 12) y = 5.7 + by * 0.85;
      else if (r === 3 || r === 11) y = 4.5 + by * 0.6;
      else if (r === 4 || r === 10) y = 3.25 + by * 0.55;
      else if (r === 5 || r === 9) y = 2.25 + by * 0.5;
      else if (r === 6 || r === 8) y = 1.25 + by * 0.4;
      else y = 0.25 + by * 0.3;
      const sideZ = Math.abs(g) > 0.05;
      const z = g * (sideZ ? hb : hb * 0.5);
      const oy = (hash3(i, r, 11.3) - 0.5) * 0.24;
      const oz = (hash3(i, r, 2.7) - 0.5) * 0.2;
      const ox = (hash3(i, r, 8.8) - 0.5) * 0.26;
      points.push(x + ox, y + oy, z + oz);
      if (r % 2 === 0) {
        points.push(x - ox * 0.6, y + oy * 1.1, -z + oz);
      }
    }
  }
  for (let i = 0; i < 120; i++) {
    const x = mix(-17, 13, hash3(7, i, 1));
    const z = mix(-3.4, 3.4, hash3(i, 9, 3));
    points.push(x, 6.35 + 0.25 * hash3(4, i, 5), z);
  }

  return { geo, points };
}

/* ---------------------------------------------------------------- scene */

interface EngineOpts {
  canvas: HTMLCanvasElement;
  onTick: (t: SceneTick) => void;
}

export function createScene(canvas: HTMLCanvasElement, opts: EngineOpts) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06202f, 0.0045);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 1200);
  camera.position.set(-16, 3.6, -8.4);

  const progress = { v: 0 };
  const playing = { v: true };
  const clock = new THREE.Clock();

  /* ---------- lights ---------- */
  const sunDir = new THREE.Vector3(0.42, 0.32, -0.28).normalize();
  const key = new THREE.DirectionalLight(0xffe0b0, 2.6);
  key.position.copy(sunDir).multiplyScalar(120);
  const fill = new THREE.DirectionalLight(0x8fb8ff, 1.1);
  fill.position.set(-60, 40, -30);
  const amb = new THREE.AmbientLight(0x8ea6c4, 0.55);
  const rim = new THREE.AmbientLight(0x0c1a2a, 0);
  scene.add(key, fill, amb, rim);

  /* ---------- sky + sun ---------- */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 40, 24),
    new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topCol: { value: new THREE.Color(0x18406e) },
        upperCol: { value: new THREE.Color(0x79a5c0) },
        horizonCol: { value: new THREE.Color(0xf7c98f) },
        fade: { value: 0 },
      },
    })
  );
  sky.frustumCulled = false;
  scene.add(sky);

  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }));
  sunGlow.scale.set(240, 240, 1);
  sunGlow.position.set(170, 150, -300);
  scene.add(sunGlow);

  const sunDetail = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,246,224,1)", "rgba(255,215,150,0.7)", 64), transparent: true, opacity: 0.9, depthWrite: false }));
  sunDetail.scale.set(90, 90, 1);
  sunDetail.position.set(170, 150, -300);
  scene.add(sunDetail);

  const clouds: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const spr = new THREE.Mesh(
      new THREE.SphereGeometry(1, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false })
    );
    spr.scale.set(mix(60, 140, hash3(i, 1, 3)), mix(10, 18, hash3(i, 2, 4)), mix(30, 80, hash3(i, 5, 6)));
    spr.position.set(mix(-320, 320, hash3(i, 7, 8)), mix(120, 220, hash3(i, 11, 13)), mix(-420, -260, hash3(i, 17, 19)));
    scene.add(spr);
    clouds.push(spr);
  }

  /* ---------- ocean ---------- */
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400, 110, 110),
    new THREE.ShaderMaterial({
      vertexShader: OCEAN_VERT,
      fragmentShader: OCEAN_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        time: { value: 0 },
        deepCol: { value: new THREE.Color(0x06344a) },
        midCol: { value: new THREE.Color(0x16788f) },
        foamCol: { value: new THREE.Color(0xe8f4fa) },
        fade: { value: 0 },
        sunDir: { value: sunDir.clone() },
        shipProj: { value: new THREE.Vector3(0, 0, 0) },
        shipR: { value: 18 },
      },
    })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = WATER_Y;
  ocean.frustumCulled = false;
  scene.add(ocean);

  /* ---------- ship hull ---------- */
  const hull = buildHull();
  const shipUniforms = {
    lightDir: { value: sunDir.clone() },
    rimSky: { value: new THREE.Color(0x8db2cc) },
    revealU: { value: 1 },
    waterY: { value: WATER_Y },
    time: { value: 0 },
    envGlow: { value: 1 },
  };
  const shipMat = new THREE.ShaderMaterial({
    vertexShader: SHIP_VERT,
    fragmentShader: SHIP_FRAG,
    uniforms: shipUniforms,
  });
  const ship = new THREE.Mesh(hull.geo, shipMat);
  ship.name = "ship";

  /* heat twin surface */
  const heatPos = hull.geo.attributes.position.array as Float32Array;
  const heatColors = new Float32Array(hull.geo.attributes.position.count * 3);
  for (let i = 0; i < hull.geo.attributes.position.count; i++) {
    const h = heatAt(heatPos[i * 3], heatPos[i * 3 + 1], heatPos[i * 3 + 2]);
    const [r, g, b] = heatColor(h);
    heatColors[i * 3] = r;
    heatColors[i * 3 + 1] = g;
    heatColors[i * 3 + 2] = b;
  }
  const twinGeo = hull.geo.clone();
  twinGeo.setAttribute("aColor", new THREE.Float32BufferAttribute(heatColors, 3));
  const twinMat = new THREE.ShaderMaterial({
    vertexShader: SHIP_VERT,
    fragmentShader: TWIN_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      lightDir: { value: sunDir.clone() },
      revealU: { value: 0 },
      opacityU: { value: 0.55 },
    },
  });
  const twin = new THREE.Mesh(twinGeo, twinMat);
  twin.name = "twin";

  /* point cloud */
  const pc = new Float32Array(hull.points.length);
  const pcU = new Float32Array(hull.points.length / 3);
  const pcHeat = new Float32Array(hull.points.length);
  for (let i = 0; i < hull.points.length; i += 3) {
    pc[i] = hull.points[i];
    pc[i + 1] = hull.points[i + 1];
    pc[i + 2] = hull.points[i + 2];
  }
  for (let i = 0; i < pcU.length; i++) {
    pcU[i] = clamp01((HALF_LEN - hull.points[i * 3]) / (HALF_LEN * 2) + (hash3(i, 7, 3) - 0.5) * 0.05);
    const h = heatAt(hull.points[i * 3], hull.points[i * 3 + 1], hull.points[i * 3 + 2]);
    const [r, g, b] = heatColor(h);
    pcHeat[i * 3] = r;
    pcHeat[i * 3 + 1] = g;
    pcHeat[i * 3 + 2] = b;
  }
  const pcGeo = new THREE.BufferGeometry();
  pcGeo.setAttribute("position", new THREE.BufferAttribute(pc, 3));
  pcGeo.setAttribute("aU", new THREE.BufferAttribute(pcU, 1));
  pcGeo.setAttribute("aHeat", new THREE.BufferAttribute(pcHeat, 3));
  const pointUniforms = { revealU: { value: 0 }, uScale: { value: 130 / Math.min(window.devicePixelRatio || 1, 2) }, uHalo: { value: 0 } };
  const pointMat = new THREE.ShaderMaterial({
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: pointUniforms,
  });
  const points = new THREE.Points(pcGeo, pointMat);
  points.name = "points";
  points.frustumCulled = false;

  const twinGroup = new THREE.Group();
  twinGroup.add(twin, points);

  /* wireframe copy */
  const wire = new THREE.Mesh(
    hull.geo.clone(),
    new THREE.MeshBasicMaterial({ color: 0x5cd8ff, wireframe: true, transparent: true, opacity: 0, depthWrite: false })
  );
  wire.name = "wire";

  /* sweep plane */
  const sweepUniforms = { revealU: { value: 0 }, time: { value: 0 } };
  const sweepPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `uniform float revealU; uniform float time;
varying vec2 vUv;
void main(){
  float w = 9.0;
  float band = smoothstep(w*0.5, 0.0, abs(vUv.y-0.5)*w);
  float pulse = 0.6 + 0.4*sin(time*10.0);
  vec3 col = vec3(0.2,0.9,1.0)*band*pulse*0.35;
  ${GAMMA}
  gl_FragColor = vec4(col, band*pulse*0.35);
}`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: sweepUniforms,
    })
  );
  sweepPlane.rotation.y = Math.PI / 2;
  sweepPlane.scale.y = 1.6;
  sweepPlane.visible = false;
  scene.add(sweepPlane);

  /* ---------- twin set dressing ---------- */
  const gridRadius = 30;
  const gridLines: THREE.Vector3[] = [];
  const RINGS = 7;
  for (let i = 1; i <= RINGS; i++) {
    const r = (i / RINGS) * gridRadius;
    let p = new THREE.Vector3(r, 0, 0);
    for (let a = 0; a <= 64; a++) {
      const th = (a / 64) * Math.PI * 2;
      const q = new THREE.Vector3(Math.cos(th) * r, 0.08, Math.sin(th) * r);
      if (a > 0) gridLines.push(p, q);
      p = q;
    }
  }
  for (let a = 0; a < 24; a++) {
    const th = (a / 24) * Math.PI * 2;
    gridLines.push(new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(Math.cos(th) * gridRadius, 0.08, Math.sin(th) * gridRadius));
  }
  const gridGeo = new THREE.BufferGeometry().setFromPoints(gridLines);
  const grid = new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: 0x1d6f8a, transparent: true, opacity: 0 }));
  grid.name = "grid";
  grid.position.y = -0.1;
  scene.add(grid);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(90,170,220,0.55)", "rgba(40,120,180,0.25)", 256), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(140, 90, 1);
  halo.position.set(0, 4.2, 6);
  scene.add(halo);

  /* ---------- markers ---------- */
  const markerGroup = new THREE.Group();
  CLUSTERS.forEach((c, i) => {
    const t = c.sign === "dent";
    const col = t ? 0xff5c6c : 0x37e6ff;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), new THREE.MeshBasicMaterial({ color: col }));
    dot.position.set(c.pos[0], c.pos[1], c.pos[2]);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.36, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.set(c.pos[0], c.pos[1] + 0.05, c.pos[2]);
    markerGroup.add(dot, ring);
    dot.userData = { idx: i, i };
    ring.userData = { idx: i, i, ring: true };
  });
  markerGroup.visible = false;
  scene.add(markerGroup);

  /* ---------- environment: quay, cranes, containers, buildings ---------- */
  const envGroup = new THREE.Group();
  envGroup.name = "env";
  const concrete = lambert("#5c6975");
  const concreteD = lambert("#46515c");
  const steel = lambert("#232b33");
  const stackCols = ["#a34336", "#355f9c", "#3d7a55", "#c9b14a", "#8a99a8", "#6b4a38", "#9c3f52", "#3f7f96"];

  const quay = box(90, 1.25, 8, concreteD, 0, 2.28, -19.5, "quay");
  envGroup.add(quay);
  const quayEdge = box(90, 0.35, 1.1, concrete, 0, 2.85, -15.4, "quayEdge");
  envGroup.add(quayEdge);

  for (let i = -9; i <= 9; i++) {
    const f = box(1.4, 2.6, 0.5, steel, i * 3.4 + (Math.abs(i) % 2) * 1.7, 1.35, -15.2);
    envGroup.add(f);
  }
  for (let i = -8; i <= 8; i += 2) {
    const bollard = box(0.6, 0.5, 0.6, steel, i * 5.2, 3.05, -15.6);
    envGroup.add(bollard);
  }

  for (let i = 0; i < 9; i++) {
    const h = 1 + (i % 2);
    const col = stackCols[i % stackCols.length];
    const c = box(5.9, 2.45 * h, 2.4, lambert(col), -40 + i * 10.5, 2.9 + (2.45 * h) / 2 - 0.05, -30.5 + (i % 3) * 3.2);
    envGroup.add(c);
  }

  const gantry = new THREE.Group();
  const gX = 26;
  const gMat = new THREE.MeshLambertMaterial({ color: 0x2b2f36, transparent: true, opacity: 1 });
  const legGeo = new THREE.BoxGeometry(1.1, 15, 1.1);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, gMat);
    leg.position.set(gX - (s === 1 ? 0 : 8), 2.9 + 7.4, -34 + (s === 1 ? 0 : 0));
    leg.rotation.z = s === 1 ? 0.32 : 0;
    leg.position.x = gX + (s === 1 ? 0 : -8);
    leg.position.y = 2.9 + 7.4;
    leg.position.z = -34;
    gantry.add(leg);
  }
  const beam = box(26, 1.6, 1.6, gMat, gX - 4, 17.2, -34);
  gantry.add(beam);
  const trolley = box(3, 2.6, 2.6, gMat, gX - 6, 15.4, -34);
  gantry.add(trolley);
  envGroup.add(gantry);

  for (const [bx, h] of [[-46, 14], [-34, 20], [-20, 11], [10, 17], [34, 24], [48, 13]] as const) {
    const b = box(10, h, 7, lambert(hash3(bx, 1, 2) < 0.5 ? "#4b5b6b" : "#3c4a58"), bx, 2.9 + h / 2 - 0.05, -64);
    envGroup.add(b);
  }
  const lighthouse = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.1, 22, 12), lambert("#8a8f97"));
  lighthouse.position.set(-42, 2.9 + 10.5, -50);
  envGroup.add(lighthouse);
  const lnmay = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.5, 10), new THREE.MeshBasicMaterial({ color: 0xf7b23c }));
  lnmay.position.set(-42, 2.9 + 21.8, -50);
  envGroup.add(lnmay);

  const lampposts: THREE.Group = new THREE.Group();
  for (let i = -8; i <= 8; i++) {
    const pole = box(0.18, 4.4, 0.18, steel, i * 8.5, 4.6, -14.7);
    lampposts.add(pole);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,205,130,0.9)", "rgba(255,170,90,0.25)"), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.set(3.2, 3.2, 1);
    sp.position.set(i * 8.5, 6.9, -14.4);
    lampposts.add(sp);
  }
  envGroup.add(lampposts);
  scene.add(envGroup);

  /* a small tug on the water */
  const tugCol = lambert("#3a4652");
  const tug = new THREE.Group();
  tug.add(box(5.2, 2.2, 2.6, tugCol, 0, 1.1, 0));
  tug.add(box(2.2, 1.1, 2.0, lambert("#c54f3c"), 1.6, 2.4, 0));
  tug.position.set(-30, WATER_Y - 1.1, -9);
  scene.add(tug);

  /* mooring lines */
  const lineMat = new THREE.MeshLambertMaterial({ color: 0x2a2d31, transparent: true, opacity: 0.95 });
  const addLine = (x0: number, z0: number, x1: number, z1: number, sag = 0.9) => {
    const pts = [new THREE.Vector3(x0, 6.4, z0), new THREE.Vector3((x0 + x1) / 2, 6.4 - sag, (z0 + z1) / 2), new THREE.Vector3(x1, 3.0, z1)];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.05, 6, false), lineMat);
    scene.add(tube);
  };
  addLine(6, 1.5, 3, -15.3, 1.2);
  addLine(-6, -0.5, -4, -15.3, 0.9);
  addLine(14, 0, 10, -15.3, 1.0);
  scene.add(tug);

  /* ---------- birds ---------- */
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x1a222c, transparent: true, opacity: 0.85 });
  const birdGeo = new THREE.BufferGeometry();
  const wingVerts = new Float32Array([0, 0, 0, -0.5, 0.28, -0.5, 0.5, 0.28, -0.5]);
  birdGeo.setAttribute("position", new THREE.BufferAttribute(wingVerts, 3));
  const birds: THREE.InstancedMesh[] = [];
  const birdData: { x: number; y: number; z: number; spd: number; amp: number; ph: number }[][] = [];
  for (let f = 0; f < 2; f++) {
    const n = 11;
    const im = new THREE.InstancedMesh(birdGeo, birdMat, n);
    const data: { x: number; y: number; z: number; spd: number; amp: number; ph: number }[] = [];
    const dummy = new THREE.Object3D();
    const cx = f === 0 ? -60 : 40;
    for (let i = 0; i < n; i++) {
      const bx = cx + i * 7 + hash3(f, i, 1) * 4;
      data.push({ x: bx, y: 15 + hash3(f, i, 2) * 8, z: -40 - i * 3.5 - hash3(f, i, 3) * 5, spd: 3.2 + hash3(f, i, 4), amp: 1.4 + hash3(f, i, 5), ph: hash3(f, i, 6) * 6.28 });
      dummy.position.set(bx, data[i].y, data[i].z);
      dummy.rotation.y = 0.5;
      dummy.scale.set(2.2, 1.1, 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
    scene.add(im);
    birds.push(im);
    birdData.push(data);
  }

  /* ---------- group ship together ---------- */
  const shipGroup = new THREE.Group();
  shipGroup.add(ship, twin, points, wire, sweepPlane);
  scene.add(shipGroup);

  /* superstructure & containers (on deck, following ship) */
  const structMat = lambert("#99a2ad");
  const structMatD = lambert("#7b8490");
  const bridge = new THREE.Group();
  const tier = (w: number, d: number, y0: number, y1: number, xoff: number, col: THREE.Material) => {
    const b = box(w, y1 - y0, d, col, xoff, (y0 + y1) / 2, 0);
    bridge.add(b);
  };
  tier(11, 6.6, 6.2, 9.1, -14, structMatD);
  tier(9.6, 5.8, 9.1, 11.6, -13.7, structMat);
  tier(8.6, 5.4, 11.6, 13.7, -13.4, structMat);
  const bridgeWin = box(8.4, 1.0, 0.08, new THREE.MeshBasicMaterial({ color: 0x0d1b28 }), -13.4, 12.8, 2.7);
  bridge.add(bridgeWin);
  const bridgeWin2 = box(8.4, 0.7, 0.08, new THREE.MeshBasicMaterial({ color: 0x141f2c }), -13.4, 11.35, 2.7);
  bridge.add(bridgeWin2);
  const funnel = box(3.4, 3.4, 3.4, lambert("#c23a3a"), -11.5, 15.6, 0);
  bridge.add(funnel);
  const funnelTop = box(2.2, 0.8, 2.2, lambert("#d8dee4"), -11.5, 17.2, 0);
  bridge.add(funnelTop);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.2, 8), lambert("#666d76"));
  mast.position.set(-13.5, 15.9, 0);
  bridge.add(mast);
  shipGroup.add(bridge);

  const forecastle = box(6.0, 1.15, 5.0, structMat, 13.5, 7.0, 0);
  shipGroup.add(forecastle);
  const breakwater = box(0.4, 0.7, 4.4, steel, 10.6, 7.05, 0);
  shipGroup.add(breakwater);
  const bowMast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.6, 8), steel);
  bowMast.position.set(17, 7.8, 0);
  shipGroup.add(bowMast);
  const anchor = box(1.05, 1.05, 0.7, lambert("#39424b"), 18.2, 4.9, 1.8);
  shipGroup.add(anchor);

  const containerMat = (col: string) => new THREE.MeshLambertMaterial({ color: new THREE.Color(col) });
  const bays: [number, number, number, boolean][] = [];
  for (let i = 0; i < 3; i++) bays.push([-4 + i * 6.8, 2 + (i === 0 ? 1 : i === 1 ? 1 : 0), 0, true]);
  for (let i = 0; i < 2; i++) bays.push([16.4, 1, 0, false]);
  bays.forEach((b, k) => {
    const [bx, h, , ] = b;
    const cs = 2.15;
    for (let r = 0; r < h; r++) {
      for (let c = -1; c <= 1; c++) {
        const mat = containerMat(stackCols[(k * 3 + c + 3 * r) % stackCols.length]);
        const cm = new THREE.Mesh(new THREE.BoxGeometry(3.15, 2.45, cs), mat);
        cm.position.set(bx, 6.4 + r * 2.55 + 1.18, c * 2.35);
        shipGroup.add(cm);
      }
    }
  });

  /* ---------- camera ---------- */
  function camPose(p: number, time: number) {
    const sway = Math.sin(time * 0.35) * 0.6;
    const sway2 = Math.cos(time * 0.27) * 0.4;
    let pos: THREE.Vector3;
    let target: THREE.Vector3;
    let fov = 46;

    if (p < 0.3) {
      const k = smooth(0, 0.3, p);
      const a = new THREE.Vector3(-16, 3.4, -8.4);
      const b = new THREE.Vector3(-5.5, 4.0, -11.4);
      pos = a.clone().lerp(b, easeInOut(k));
      pos.x += sway;
      pos.y += sway2 * 0.5;
      target = new THREE.Vector3(0, 3.8, 0);
    } else if (p < 0.38) {
      const k = smooth(0.3, 0.38, p);
      pos = new THREE.Vector3(-5.5, 4.0, -11.4).lerp(new THREE.Vector3(4.5, 7.2, -15.2), easeInOut(k));
      target = new THREE.Vector3(1.5, 4.2, 0);
    } else if (p < 0.74) {
      const k = smooth(0.38, 0.74, p);
      pos = new THREE.Vector3(4.5, 7.2, -15.2).lerp(new THREE.Vector3(1.8, 9.4, -17.6), easeInOut(k));
      pos.y += sway2;
      target = new THREE.Vector3(0, 4.0, 0);
    } else {
      const k = smooth(0.74, 1, p);
      const ang = -0.4 + k * Math.PI * 1.55;
      const R = 24;
      pos = new THREE.Vector3(Math.sin(ang) * R * 0.62, 8.8 + Math.sin(k * Math.PI * 2.2) * 1.2, Math.cos(ang) * R * -0.72);
      pos.x += sway * 0.4;
      target = new THREE.Vector3(0.6, 3.8, 0);
      fov = 44;
    }
    return { pos, target, fov };
  }

  /* ---------- resize ---------- */
  let w = 1;
  let h = 1;
  function resize() {
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- tick / controls ---------- */
  const st = { lastEmit: 0, lastPhase: "film" as Phase };

  function tick() {
    const dt = Math.min(0.05, clock.getDelta());
    const time = clock.elapsedTime;
    if (playing.v) progress.v = (progress.v + dt / DURATION) % 1;
    const p = progress.v;

    const revealU = easeInOut(smooth(SWEEP_START, SWEEP_END, p));
    const phase: Phase = p < FILM_END ? "film" : p > SCAN_START ? "inspect" : "sweep";

    const envFade = 1 - smooth(0.3, 0.55, p);
    const bgBlack = smooth(0.42, 0.6, p);

    /* uniforms */
    shipUniforms.revealU.value = revealU;
    shipUniforms.time.value = time;
    const envGlow = 1 - bgBlack * 0.55;
    shipUniforms.envGlow.value = envGlow;
    pointUniforms.revealU.value = revealU;
    pointUniforms.uHalo.value = smooth(0.5, 0.7, p);
    (twinMat.uniforms.revealU.value as number) = revealU;
    (twinMat.uniforms.opacityU.value as number) = 0.32 + revealU * 0.4;
    (ocean.material as THREE.ShaderMaterial).uniforms.fade.value = bgBlack;
    (sky.material as THREE.ShaderMaterial).uniforms.fade.value = bgBlack;
    (sweepPlane.material as THREE.ShaderMaterial).uniforms.revealU.value = revealU;
    (sweepPlane.material as THREE.ShaderMaterial).uniforms.time.value = time;
    sweepPlane.visible = revealU > 0.01 && revealU < 0.99;
    const revealX = HALF_LEN - revealU * HALF_LEN * 2;
    sweepPlane.position.set(revealX, WATER_Y + 1.2, 0);

    sunGlow.material.opacity = 0.85 * (1 - smooth(0.2, 0.32, p));
    sunDetail.material.opacity = 0.9 * (1 - smooth(0.2, 0.32, p));

    /* env fade */
    envGroup.visible = envFade > 0.01;
    envGroup.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && (m.material as THREE.Material[]).length === undefined) {
        const mat = m.material as THREE.MeshLambertMaterial;
        if (mat && "transparent" in mat) mat.opacity = envFade;
      }
    });
    tug.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) (m.material as THREE.MeshLambertMaterial).opacity = envFade;
    });

    const fog = (scene.fog as THREE.FogExp2);
    const fogD = 0.0045 + bgBlack * 0.05;
    fog.density = fogD;
    fog.color.setRGB(0.035 - 0.025 * bgBlack, 0.1 - 0.07 * bgBlack, 0.27 - 0.2 * bgBlack);

    key.intensity = 2.6 - bgBlack * 2.2;
    amb.intensity = 0.55 * (1 - bgBlack * 0.6);
    (rim as THREE.AmbientLight).intensity = bgBlack * 0.55;

    /* wire / grid / halo / markers */
    (wire.material as THREE.MeshBasicMaterial).opacity = smooth(0.55, 0.8, p) * 0.05;
    (grid.material as THREE.LineBasicMaterial).opacity = smooth(0.55, 0.8, p) * 0.5;
    halo.material.opacity = smooth(0.55, 0.75, p) * 0.75;
    markerGroup.visible = p > 0.6;
    grid.rotation.y = time * 0.05;

    /* ship gentle motion + twin rotation */
    ship.rotation.y = Math.sin(time * 0.16) * 0.006;
    ship.position.y = Math.sin(time * 0.6) * 0.04;
    wire.rotation.copy(ship.rotation);
    wire.position.copy(ship.position);
    twin.rotation.y = Math.sin(time * 0.13);
    twin.rotation.z = Math.sin(time * 0.09) * 0.02;
    points.rotation.copy(twin.rotation);
    points.position.copy(twin.position);

    const sweepPhase = revealU > 0.02 && revealU < 0.98;
    void sweepPhase;
    ship.visible = true;

    /* markers pulse */
    markerGroup.children.forEach((child) => {
      const u = child.userData as { ring?: boolean; i?: number };
      if (u.ring) {
        const ring = child as THREE.Mesh;
        const s = 1.2 + ((time * 0.8 + (u.i || 0) * 0.7) % 1.6);
        ring.scale.setScalar(s);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1.5 - s));
        ring.lookAt(camera.position);
      } else {
        const s = 1 + Math.sin(time * 2.4 + (u.i || 0)) * 0.15;
        child.scale.setScalar(s);
      }
    });

    /* birds */
    birdData.forEach((data, f) => {
      const im = birds[f];
      const dummy = new THREE.Object3D();
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        d.x += d.spd * dt;
        d.y += Math.sin(time * 0.7 + d.ph) * 0.03;
        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.y = 0.55 + Math.sin(time * 0.5 + d.ph) * 0.2;
        dummy.scale.set(2.2 * (1 + Math.sin(time * 7 + d.ph) * 0.15), 1.1, 1);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      }
      (im as THREE.InstancedMesh).instanceMatrix.needsUpdate = true;
    });

    /* camera */
    const pose = camPose(p, time);
    const camMix = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(pose.pos, camMix);
    camera.fov += (pose.fov - camera.fov) * camMix;
    camera.updateProjectionMatrix();
    camera.lookAt(pose.target);

    renderer.render(scene, camera);

    const now = performance.now();
    if (now - st.lastEmit > 90 || phase !== st.lastPhase) {
      st.lastEmit = now;
      st.lastPhase = phase;
      opts.onTick({ p, phase, revealU, pts: Math.round(TOTAL_POINTS * smooth(0.34, 0.7, p)) });
    }
    raf = requestAnimationFrame(tick);
  }
  let raf = requestAnimationFrame(tick);

  return {
    setProgress(v: number) {
      progress.v = Math.max(0, Math.min(1, v));
    },
    setPlaying(v: boolean) {
      playing.v = v;
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}