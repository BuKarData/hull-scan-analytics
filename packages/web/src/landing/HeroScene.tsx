import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { ClusterSafe, HeatData } from "./data";

export type Phase = "film" | "transition" | "scan";

export interface HeroTick {
  p: number;
  phase: Phase;
  revealU: number;
  maxDevMm: number;
}

interface HeroSceneProps {
  data: HeatData;
  progressRef: MutableRefObject<number>;
  draggingRef: MutableRefObject<boolean>;
  playingRef: MutableRefObject<boolean>;
  onTick: (tick: HeroTick) => void;
}

export const DURATION = 17;

const SWEEP_START = 0.34;
const SWEEP_END = 0.68;
const FILM_END = 0.3;
const SCAN_START = 0.8;

function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}

function smoothstep(a: number, b: number, x: number) {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function makeGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,240,214,1)");
  g.addColorStop(0.2, "rgba(255,214,150,0.85)");
  g.addColorStop(0.5, "rgba(255,180,110,0.22)");
  g.addColorStop(1, "rgba(255,170,90,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function skyGradientTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#12355c");
  g.addColorStop(0.42, "#5d87a8");
  g.addColorStop(0.6, "#9fb5c4");
  g.addColorStop(0.74, "#cdd9e2");
  g.addColorStop(1, "#dbe6ef");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

const OCEAN_VERT = /* glsl */ `
uniform float time;
varying vec3 vWorld;
varying float vH;
void main() {
  vec3 p = position;
  float n1 = sin(p.x * 0.055 + time * 1.1) * 0.5 + sin(p.z * 0.04 + time * 0.8) * 0.5;
  float n2 = sin((p.x + p.z) * 0.11 + time * 1.6) * 0.3;
  float h = (n1 + n2) * 1.35;
  p.y += h;
  vH = h;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const OCEAN_FRAG = /* glsl */ `
uniform vec3 deepCol;
uniform vec3 midCol;
uniform vec3 hazeCol;
uniform float fade;
uniform vec3 sunDir;
varying vec3 vWorld;
varying float vH;
float glint(vec3 V, vec3 sunDir) {
  vec3 n = vec3(-0.12, 1.0, 0.04);
  vec3 r = reflect(-sunDir, n);
  return pow(max(dot(r, V), 0.0), 42.0);
}
void main() {
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
  vec3 col = mix(midCol, deepCol, clamp(vH * 0.5, 0.0, 1.0));
  col += vec3(1.0, 0.94, 0.85) * glint(V, sunDir) * 0.65;
  col += vec3(0.92, 0.96, 1.0) * fres * 0.45;
  float d = distance(vWorld.xz, cameraPosition.xz);
  col = mix(col, hazeCol, smoothstep(60.0, 380.0, d));
  gl_FragColor = vec4(col, 1.0 - fade * 0.6);
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
uniform sampler2D map;
uniform float fade;
varying float vY;
void main() {
  vec3 col = texture2D(map, vec2(0.25, 1.0 - vY)).rgb;
  vec3 hz = vec3(0.88, 0.9, 0.94);
  float horizon = smoothstep(-0.05, 0.22, vY);
  col = mix(col, hz, (1.0 - horizon) * 0.5);
  gl_FragColor = vec4(col, 1.0 - fade * 0.92);
}
`;

const FILM_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aU;
varying vec3 vN;
varying vec3 vWorld;
varying vec3 vColorV;
varying float vU;
void main() {
  vN = normalMatrix * normal;
  vColorV = aColor;
  vU = aU;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FILM_FRAG = /* glsl */ `
uniform vec3 lightDir;
uniform float revealU;
uniform float waterY;
uniform float time;
varying vec3 vN;
varying vec3 vWorld;
varying vec3 vColorV;
varying float vU;
void main() {
  if (vU < revealU) discard;
  vec3 N = normalize(vN);
  vec3 L = normalize(lightDir);
  float diff = max(dot(N, L), 0.0);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 R = reflect(-L, N);
  float spec = pow(max(dot(R, V), 0.0), 26.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 col = vColorV * (0.32 + 0.82 * diff);
  col += vec3(1.0, 0.96, 0.86) * spec * 0.55;
  col += vec3(0.52, 0.72, 0.94) * fres * 0.5;
  float under = smoothstep(waterY + 0.3, waterY - 1.2, vWorld.y);
  col = mix(col, col * 0.32, under);
  col = mix(col, vec3(0.2, 0.05, 0.03), under * 0.85);
  float fringe = 1.0 - smoothstep(0.0, 0.03, vU - revealU);
  col += vec3(0.0, 0.95, 1.0) * 0.5 * fringe * (0.8 + 0.2 * sin(time * 7.0));
  gl_FragColor = vec4(col, 1.0);
}
`;

const POINT_VERT = /* glsl */ `
attribute vec3 aHeat;
attribute float aU;
uniform float revealU;
uniform float radius;
uniform float sizeMul;
varying vec3 vCol;
varying float vA;
float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.16))) * 43758.5453); }
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  if (aU > revealU) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vA = 0.0; return; }
  float edge = smoothstep(0.04, 0.0, aU - revealU);
  gl_PointSize = radius * (300.0 / max(1.0, -mv.z)) * sizeMul * (0.82 + hash(position.xyz) * 0.4);
  gl_Position = projectionMatrix * mv;
  vCol = aHeat;
  vA = edge;
}
`;

const POINT_FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.14, d);
  if (a <= 0.002 || vA <= 0.002) discard;
  float halo = smoothstep(0.5, 0.22, d);
  vec3 col = mix(vCol, vec3(0.62, 0.92, 1.0), halo * 0.35);
  gl_FragColor = vec4(col, a * vA * 0.94);
}
`;

function Ocean() {
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      deepCol: { value: new THREE.Color("#08344e") },
      midCol: { value: new THREE.Color("#1c6a86") },
      hazeCol: { value: new THREE.Color("#c9d8e3") },
      fade: { value: 0 },
      sunDir: { value: new THREE.Vector3(0.55, 0.7, -0.4).normalize() },
    }),
    []
  );
  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime;
  });
  return (
    <mesh name="ocean" rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2000, 2000, 150, 150]} />
      <shaderMaterial vertexShader={OCEAN_VERT} fragmentShader={OCEAN_FRAG} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}

function Sky() {
  const uniforms = useMemo(
    () => ({
      map: { value: skyGradientTexture() },
      fade: { value: 0 },
    }),
    []
  );
  return (
    <mesh name="sky">
      <sphereGeometry args={[1400, 24, 18]} />
      <shaderMaterial vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} uniforms={uniforms} side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

function Sun() {
  const texture = useMemo(() => makeGlowTexture(), []);
  return (
    <group name="sun-group" position={[220, 300, -420]}>
      <sprite scale={[300, 300, 1]}>
        <spriteMaterial map={texture} transparent opacity={0.7} depthWrite={false} />
      </sprite>
    </group>
  );
}

function ClusterDot({ c, r }: { c: ClusterSafe; r: number }) {
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const color = c.sign === "dent" ? "#ff5c6c" : "#37f2ff";
  const size = Math.max(0.14, r * 0.012);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(t * 2.6 + c.z) * 0.14);
    if (ring.current) {
      const rs = 1.1 + ((t * 0.7) % 1.3);
      ring.current.scale.setScalar(rs);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.65 * (1.35 - rs));
    }
  });
  return (
    <group ref={ref} position={[c.x, c.y, c.z]}>
      <mesh>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
      <mesh ref={ring}>
        <sphereGeometry args={[size * 2, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} wireframe />
      </mesh>
    </group>
  );
}

function CameraRig({ data, progressRef }: { data: HeatData; progressRef: MutableRefObject<number> }) {
  const from = useRef(new THREE.Vector3());
  const to = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const p = progressRef.current;
    const cam = state.camera as THREE.PerspectiveCamera;

    const r = data.radius;
    const swayX = Math.sin(t * 0.22) * r * 0.06;
    const swayZ = Math.cos(t * 0.18) * r * 0.05;
    from.current.set(-r * 1.35 + swayX, data.waterY + r * 0.24, r * 1.12 + swayZ);
    to.current.set(
      r * 1.15 + Math.sin(t * 0.07) * r * 0.08,
      data.center[1] + r * 0.85 + Math.cos(t * 0.06) * r * 0.04,
      r * 1.7
    );

    const mix = easeInOut(smoothstep(0.28, 0.78, p));
    const target = new THREE.Vector3().lerpVectors(from.current, to.current, mix);
    const k = 1 - Math.exp(-dt * 2.4);
    cam.position.lerp(target, k);
    cam.lookAt(new THREE.Vector3().lerpVectors(new THREE.Vector3(0, data.center[1] * 0.5, 0), new THREE.Vector3(data.center[0], data.center[1], 0), mix));
    cam.fov = THREE.MathUtils.lerp(46, 42, mix);
    cam.updateProjectionMatrix();
  });
  return null;
}

function HullActor({ data, progressRef }: { data: HeatData; progressRef: MutableRefObject<number> }) {
  const filmMat = useRef<THREE.ShaderMaterial>(null);
  const pointMat = useRef<THREE.ShaderMaterial>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const fragRef = useRef<THREE.Mesh>(null);
  const farRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(data.normals, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(data.baseColor, 3));
    geo.setAttribute("aHeat", new THREE.BufferAttribute(data.heatColor, 3));
    geo.setAttribute("aU", new THREE.BufferAttribute(data.aU, 1));
    if (data.indices && data.indices.length) {
      const arr = Array.isArray(data.indices) ? new Uint32Array(data.indices) : data.indices;
      geo.setIndex(new THREE.BufferAttribute(arr, 1));
    }
    geo.computeBoundingSphere();
    return geo;
  }, [data]);

  const uniformsFilm = useMemo(
    () => ({
      lightDir: { value: new THREE.Vector3(0.75, 0.9, -0.35).normalize() },
      revealU: { value: 0 },
      waterY: { value: data.waterY },
      time: { value: 0 },
    }),
    [data]
  );

  const uniformsPoints = useMemo(
    () => ({
      revealU: { value: 0 },
      radius: { value: 1 },
      sizeMul: { value: 1 },
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = progressRef.current;

    const revealE = easeInOut(THREE.MathUtils.clamp((p - SWEEP_START) / (SWEEP_END - SWEEP_START), 0, 1));

    uniformsFilm.revealU.value = revealE;
    uniformsFilm.time.value = t;
    uniformsPoints.revealU.value = revealE;
    uniformsPoints.radius.value = data.radius * 0.05 * (1 + revealE * 0.3);
    uniformsPoints.sizeMul.value = 1 + revealE * 0.45;

    const group = state.scene.getObjectByName("hull-group");
    if (group) {
      group.position.y = Math.sin(t * 0.7) * data.radius * 0.004;
      group.rotation.z = Math.sin(t * 0.55) * 0.0035;
    }

    if (planeRef.current) {
      const zPos = data.minZ + (data.maxZ - data.minZ) * revealE;
      planeRef.current.position.set(data.center[0], data.center[1], zPos);
      const act = smoothstep(SWEEP_START, SWEEP_END, p);
      const mat = planeRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = act > 0 && act < 1 ? 0.2 + Math.sin(t * 7) * 0.07 : 0;
    }

    if (wireRef.current) {
      const mat = wireRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = smoothstep(0.62, 0.82, p) * 0.08;
    }

    const clusterVis = smoothstep(0.76, 0.92, p);
    const clusterGroup = state.scene.getObjectByName("clusters");
    if (clusterGroup) {
      clusterGroup.visible = clusterVis > 0.01;
      clusterGroup.children.forEach((child) => {
        if (child.userData.fade === undefined) {
          child.userData.fade = child.position.z;
        }
      });
    }

    if (fragRef.current) {
      const mat = fragRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = smoothstep(0.74, 0.95, p) * 0.5;
    }
    if (farRef.current) {
      const mat = farRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = smoothstep(0.72, 0.95, p) * 0.35;
    }

    const ocean = state.scene.getObjectByName("ocean") as THREE.Mesh | null;
    if (ocean) {
      ocean.position.set(0, data.waterY, 0);
      const mat = ocean.material as THREE.ShaderMaterial;
      mat.uniforms.fade.value = 1 - smoothstep(0.3, 0.78, p);
    }
    const sky = state.scene.getObjectByName("sky") as THREE.Mesh | null;
    if (sky) {
      const mat = sky.material as THREE.ShaderMaterial;
      mat.uniforms.fade.value = 1 - smoothstep(0.3, 0.8, p);
    }
    const sunGroup = state.scene.getObjectByName("sun-group");
    if (sunGroup) sunGroup.visible = p < 0.6;

    const fog = state.scene.fog as THREE.Fog | null;
    if (fog) {
      const a = 1 - smoothstep(0.3, 0.8, p);
      fog.color.setRGB(a * 0.8, a * 0.86, a * 0.92);
    }
  });

  return (
    <group name="hull-group">
      <mesh geometry={geometry}>
        <shaderMaterial ref={filmMat} vertexShader={FILM_VERT} fragmentShader={FILM_FRAG} uniforms={uniformsFilm} side={THREE.DoubleSide} />
      </mesh>

      <points geometry={geometry}>
        <shaderMaterial
          ref={pointMat}
          vertexShader={POINT_VERT}
          fragmentShader={POINT_FRAG}
          uniforms={uniformsPoints}
          transparent
          depthWrite={false}
        />
      </points>

      <mesh ref={wireRef} geometry={geometry}>
        <meshBasicMaterial color="#7fd4ff" wireframe transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh ref={planeRef}>
        <planeGeometry args={[data.beamSpan * 1.0, data.heightSpan]} />
        <meshBasicMaterial color="#37f2ff" transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh ref={fragRef} position={[data.center[0], data.center[1], data.minZ - 2]}>
        <boxGeometry args={[data.beamSpan * 1.3, data.heightSpan * 1.05, 0.3]} />
        <meshBasicMaterial color="#37f2ff" transparent opacity={0} wireframe depthWrite={false} />
      </mesh>

      <mesh ref={farRef} position={[data.center[0], data.center[1], data.maxZ + 2]}>
        <boxGeometry args={[data.beamSpan * 1.3, data.heightSpan * 1.05, 0.3]} />
        <meshBasicMaterial color="#37f2ff" transparent opacity={0} wireframe depthWrite={false} />
      </mesh>

      <group name="clusters" visible={false}>
        {data.clusters.map((c, i) => (
          <ClusterDot key={i} c={c} r={data.radius} />
        ))}
      </group>

      <CameraRig data={data} progressRef={progressRef} />
    </group>
  );
}

function Driver({
  data,
  progressRef,
  draggingRef,
  playingRef,
  onTick,
}: {
  data: HeatData;
  progressRef: MutableRefObject<number>;
  draggingRef: MutableRefObject<boolean>;
  playingRef: MutableRefObject<boolean>;
  onTick: (tick: HeroTick) => void;
}) {
  const lastEmit = useRef(0);
  const lastPhase = useRef<Phase>("film");
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!draggingRef.current && playingRef.current) {
      progressRef.current = (progressRef.current + dt / DURATION) % 1;
    }
    const p = progressRef.current;
    const revealU = THREE.MathUtils.clamp((p - SWEEP_START) / (SWEEP_END - SWEEP_START), 0, 1);
    const phase: Phase = p < FILM_END ? "film" : p > SCAN_START ? "scan" : "transition";
    const now = state.clock.elapsedTime;
    if (phase !== lastPhase.current || now - lastEmit.current > 0.08) {
      lastEmit.current = now;
      lastPhase.current = phase;
      onTick({ p, phase, revealU, maxDevMm: data.maxAbsDeviationMm });
    }
  });
  return null;
}

export function HeroScene({ data, progressRef, draggingRef, playingRef, onTick }: HeroSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 46, near: 0.1, far: 2200, position: [0, 6, 24] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog(0xced9e2, 60, 700);
      }}
    >
      <Driver data={data} progressRef={progressRef} draggingRef={draggingRef} playingRef={playingRef} onTick={onTick} />
      <Ocean />
      <Sky />
      <Sun />
      <HullActor data={data} progressRef={progressRef} />
    </Canvas>
  );
}