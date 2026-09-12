import { useEffect, useMemo } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";

export interface PointLayer {
  key: string;
  positions: number[];
  colors: Float32Array | number[];
  size: number; // waga wzgledna (1 = rozmiar bazowy), realny rozmiar liczony wzgledem skali kadluba
  opacity: number;
  pickable?: boolean;
}

export interface PickInfo {
  index: number;
  position: [number, number, number];
}

function PointCloud({
  layer,
  worldSize,
  onPick,
  onHover,
}: {
  layer: PointLayer;
  worldSize: number;
  onPick?: (info: PickInfo) => void;
  onHover?: (info: PickInfo | null) => void;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(layer.positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(Array.from(layer.colors), 3));
    geo.computeBoundingSphere();
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer.positions, layer.colors]);

  function toPickInfo(e: ThreeEvent<PointerEvent | MouseEvent>): PickInfo | null {
    if (e.index === undefined) return null;
    const p = e.point;
    return { index: e.index, position: [p.x, p.y, p.z] };
  }

  return (
    <points
      geometry={geometry}
      onClick={
        layer.pickable
          ? (e) => {
              e.stopPropagation();
              const info = toPickInfo(e);
              if (info) onPick?.(info);
            }
          : undefined
      }
      onPointerMove={
        layer.pickable
          ? (e) => {
              e.stopPropagation();
              onHover?.(toPickInfo(e));
            }
          : undefined
      }
      onPointerOut={layer.pickable ? () => onHover?.(null) : undefined}
    >
      <pointsMaterial
        size={worldSize * layer.size}
        vertexColors
        transparent
        opacity={layer.opacity}
        sizeAttenuation
        depthWrite={layer.opacity >= 0.98}
      />
    </points>
  );
}

function PickingThreshold({ value }: { value: number }) {
  const raycaster = useThree((s) => s.raycaster);
  useEffect(() => {
    raycaster.params.Points = { threshold: value };
  }, [raycaster, value]);
  return null;
}

interface Bounds {
  center: [number, number, number];
  radius: number;
}

function computeBounds(positions: number[]): Bounds {
  if (positions.length === 0) return { center: [0, 0, 0], radius: 10 };
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const center: [number, number, number] = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
  const radius = Math.max(1, Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2);
  return { center, radius };
}

interface HullViewerProps {
  layers: PointLayer[];
  height?: number;
  /** Wzgledna skala punktow (1 = domyslna); rzeczywisty rozmiar w jednostkach
   *  swiata jest i tak liczony proporcjonalnie do rozmiaru kadluba. */
  sizeScale?: number;
  /** Utrzymuje kadrowanie kamery stale (nie dopasowuje ponownie przy kazdej
   *  zmianie danych) - przydatne przy przewijaniu osi czasu, zeby uzytkownik
   *  nie tracil orientacji przy kazdym kroku suwaka. */
  keepCamera?: boolean;
  onPick?: (info: PickInfo) => void;
  onHover?: (info: PickInfo | null) => void;
}

export function HullViewer({ layers, height = 420, sizeScale = 1, keepCamera = false, onPick, onHover }: HullViewerProps) {
  const reference = layers.find((l) => l.positions.length > 0) ?? layers[0];
  const bounds = useMemo(() => computeBounds(reference?.positions ?? []), [reference]);
  const worldSize = (bounds.radius / 140) * sizeScale;

  const dir = new THREE.Vector3(0.9, 0.7, 0.9).normalize();
  const camPos: [number, number, number] = [
    bounds.center[0] + dir.x * bounds.radius * 2.6,
    bounds.center[1] + dir.y * bounds.radius * 2.6,
    bounds.center[2] + dir.z * bounds.radius * 2.6,
  ];

  return (
    <div style={{ height, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
      <Canvas
        key={keepCamera ? "fixed" : `${bounds.center.join(",")}-${bounds.radius.toFixed(1)}`}
        camera={{ position: camPos, fov: 42, near: bounds.radius / 200, far: bounds.radius * 40 }}
        dpr={[1, 1.5]}
        onCreated={({ scene }) => {
          scene.background = null;
        }}
      >
        <color attach="background" args={["#00000000"]} />
        <ambientLight intensity={0.95} />
        <directionalLight position={[bounds.radius, bounds.radius * 1.5, bounds.radius]} intensity={0.6} />
        <PickingThreshold value={worldSize * 4} />
        {layers.map((l) => (
          <PointCloud key={l.key} layer={l} worldSize={worldSize} onPick={onPick} onHover={onHover} />
        ))}
        <Grid
          position={[bounds.center[0], bounds.center[1] - bounds.radius * 0.9, bounds.center[2]]}
          args={[bounds.radius * 8, bounds.radius * 8]}
          cellSize={Math.max(1, bounds.radius / 10)}
          cellThickness={0.5}
          sectionSize={Math.max(5, bounds.radius / 2)}
          sectionThickness={1}
          fadeDistance={bounds.radius * 8}
          infiniteGrid
          cellColor="#8a8a86"
          sectionColor="#8a8a86"
        />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          target={bounds.center}
          minDistance={bounds.radius * 0.3}
          maxDistance={bounds.radius * 8}
        />
      </Canvas>
    </div>
  );
}
