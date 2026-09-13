import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { deviationToColor, type RegionGridData, type TrendPoint } from "./data";

/* Minimal, line-drawn data visualizations in Three.js only.
   No drei, no DOM charts: everything rendered as WebGL primitives. */

const ACCENT = "#3b9dff";
const SERIES = "#8fa3bd";
const HAIR = "#27303f";

function trendGeom(pts: readonly (readonly [number, number])[]): Float32Array {
  const arr = new Float32Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    arr[i * 3] = pts[i][0];
    arr[i * 3 + 1] = pts[i][1];
    arr[i * 3 + 2] = 0;
  }
  return arr;
}

/* ---------------- trend chart ---------------- */

function TrendScene({ points, yMax }: { points: TrendPoint[]; yMax: number }) {
  const n = points.length;
  const X = 3;
  const cap = Math.max(yMax, 1.2);
  const SF = 3 / cap;

  const x = (i: number) => (n <= 1 ? 0 : -X + (i / (n - 1)) * X * 2);
  const avg = points.map((p) => [x(p.i), p.avgMm * SF] as const);
  const peak = points.map((p) => [x(p.i), p.peakMm * SF] as const);

  const gridLines = new Float32Array(6 * 5 * 6);
  for (let k = 0; k < 5; k++) {
    const gy = (k / 4) * cap * SF;
    gridLines.set([-X, gy, 0, X, gy, 0], k * 6);
  }

  const axis = new Float32Array([-X, 0, 0, X, 0, 0, -X, 0, 0, -X, cap * SF, 0]);

  const avgPts = trendGeom(avg);
  const peakPts = trendGeom(peak);
  const lastPeak = peak[Math.max(0, peak.length - 1)];

  return (
    <group position={[0, -0.4, 0]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gridLines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={HAIR} transparent opacity={0.55} />
      </lineSegments>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[axis, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={HAIR} />
      </lineSegments>

      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[avgPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={SERIES} transparent opacity={0.85} />
      </line>

      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[peakPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={ACCENT} />
      </line>

      {avg.map((p, i) => (
        <mesh key={"a" + i} position={[p[0], p[1], 0]}>
          <circleGeometry args={[0.045, 12]} />
          <meshBasicMaterial color={SERIES} transparent opacity={0.9} />
        </mesh>
      ))}
      {peak.map((p, i) => (
        <mesh key={"p" + i} position={[p[0], p[1], 0]}>
          <circleGeometry args={[0.075, 16]} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>
      ))}

      <mesh position={[lastPeak[0], lastPeak[1], 0]}>
        <ringGeometry args={[0.13, 0.19, 24]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

/* ---------------- region grid ---------------- */

function RegionScene({ g }: { g: RegionGridData }) {
  const ref = useFrameGroup();
  const maxAbs = Math.max(0.6, ...g.cells.map((c) => Math.abs(c.v)));
  const halfC = (g.cols - 1) / 2;
  const halfR = (g.rows - 1) / 2;
  const cell = 1;

  const frame = new Float32Array([
    -halfC - 0.15, 0, -halfR - 0.15,
    halfC + 0.15, 0, -halfR - 0.15,
    halfC + 0.15, 0, halfR + 0.15,
    -halfC - 0.15, 0, halfR + 0.15,
  ]);
  const frameIdx = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0]);

  return (
    <group ref={ref}>
      {g.cells.map((c, i) => {
        const [r, gg, b] = deviationToColor(c.v, maxAbs);
        const col = `rgb(${Math.round(r * 255)},${Math.round(gg * 255)},${Math.round(b * 255)})`;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(c.col - halfC) * cell, 0, (c.row - halfR) * cell]}>
            <planeGeometry args={[cell * 0.88, cell * 0.88]} />
            <meshBasicMaterial color={col} transparent opacity={0.9} />
          </mesh>
        );
      })}

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[frame, 3]} />
          <bufferAttribute attach="index" args={[frameIdx, 1]} />
        </bufferGeometry>
        <lineBasicMaterial color={HAIR} />
      </lineSegments>
    </group>
  );
}

function useFrameGroup() {
  const ref = { current: null as THREE.Group | null };
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.28) * 0.3;
  });
  return ref;
}

/* ---------------- exported components ---------------- */

export function TrendChart3D({ points }: { points: TrendPoint[] }) {
  const yMax = Math.max(...points.map((p) => p.peakMm), 0);
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ position: [0, 0, 9], fov: 24, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <TrendScene points={points} yMax={yMax} />
    </Canvas>
  );
}

export function RegionGrid3D({ data }: { data: RegionGridData }) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ position: [5.6, 7, 7.8], fov: 28, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
      onCreated={({ camera }) => camera.lookAt(0, -0.6, 0.2)}
    >
      <RegionScene g={data} />
    </Canvas>
  );
}