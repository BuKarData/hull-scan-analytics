import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, FlyControls, Grid } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

export type RenderMode = "points" | "mesh";
export type ControlMode = "orbit" | "fly";

export interface PointLayer {
  key: string;
  positions: number[];
  colors: Float32Array | number[];
  normals?: number[];
  /** Trojkaty siatki (z serwera - prawdziwa geometria kadluba); wymagane dla renderMode="mesh". */
  indices?: number[];
  size: number; // waga wzgledna (1 = rozmiar bazowy), realny rozmiar liczony wzgledem skali kadluba
  opacity: number;
  pickable?: boolean;
}

export interface PickInfo {
  index: number;
  position: [number, number, number];
}

function toPickInfo(e: ThreeEvent<PointerEvent | MouseEvent>): PickInfo | null {
  const p = e.point;
  if (e.index !== undefined) {
    // Chmura punktow: three.js podaje bezposrednio indeks trafionego punktu.
    return { index: e.index, position: [p.x, p.y, p.z] };
  }
  if (e.face) {
    // Model (siatka): brak pojedynczego "indeksu punktu" - bierzemy najblizszy
    // z trzech wierzcholkow trafionego trojkata jako przyblizenie.
    const geo = (e.object as THREE.Mesh).geometry as THREE.BufferGeometry;
    const posAttr = geo.getAttribute("position");
    const candidates = [e.face.a, e.face.b, e.face.c];
    let best = candidates[0];
    let bestDist = Infinity;
    for (const idx of candidates) {
      const dx = posAttr.getX(idx) - p.x;
      const dy = posAttr.getY(idx) - p.y;
      const dz = posAttr.getZ(idx) - p.z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        best = idx;
      }
    }
    return { index: best, position: [p.x, p.y, p.z] };
  }
  return null;
}

function PointCloudLayer({
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

function MeshLayer({
  layer,
  onPick,
  onHover,
}: {
  layer: PointLayer;
  onPick?: (info: PickInfo) => void;
  onHover?: (info: PickInfo | null) => void;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(layer.positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(Array.from(layer.colors), 3));
    if (layer.normals && layer.normals.length === layer.positions.length) {
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(layer.normals, 3));
    }
    if (layer.indices && layer.indices.length > 0) {
      geo.setIndex(new THREE.BufferAttribute(new Uint32Array(layer.indices), 1));
    }
    if (!layer.normals || layer.normals.length !== layer.positions.length) geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer.positions, layer.colors, layer.normals, layer.indices]);

  return (
    <mesh
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
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={layer.opacity}
        roughness={0.65}
        metalness={0.15}
        side={THREE.DoubleSide}
        depthWrite={layer.opacity >= 0.98}
      />
    </mesh>
  );
}

/** Punkty podswietlenia (np. klikniety kafelek heatmapy regionow) - renderowane
 *  zawsze jako jaskrawe punkty NA WIERZCHU (bez testu glebi), niezaleznie od
 *  trybu "Chmura punktow"/"Model", zeby byly widoczne z kazdego kata i w
 *  kazdym trybie renderowania. */
function HighlightLayer({ positions, worldSize }: { positions: number[]; worldSize: number }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [positions]);

  if (positions.length === 0) return null;
  return (
    <points geometry={geometry} renderOrder={999}>
      <pointsMaterial
        color="#ffcc33"
        size={worldSize * 4.5}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthTest={false}
        depthWrite={false}
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

/**
 * Ustawia pozycje kamery i cel OrbitControls IMPERATYWNIE, tylko raz przy
 * montowaniu i za kazdym razem, gdy zmieni sie `resetKey` (np. inna jednostka
 * albo inna zakladka budowa/eksploatacja) - NIE przy kazdej zmianie danych
 * (np. przewijanie suwaka miedzy skanami). Dzieki temu obrot/przesuniecie
 * kamery uzyskane przez uzytkownika przetrwa przelaczanie miedzy skanami.
 */
function CameraRig({
  resetKey,
  boundsRef,
  controlsRef,
}: {
  resetKey: string;
  boundsRef: React.RefObject<Bounds>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const bounds = boundsRef.current;
    if (!bounds) return;
    const dir = new THREE.Vector3(0.9, 0.7, 0.9).normalize();
    camera.position.set(
      bounds.center[0] + dir.x * bounds.radius * 2.6,
      bounds.center[1] + dir.y * bounds.radius * 2.6,
      bounds.center[2] + dir.z * bounds.radius * 2.6
    );
    camera.near = Math.max(0.02, bounds.radius / 200);
    camera.far = bounds.radius * 200;
    if ("updateProjectionMatrix" in camera) (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(bounds.center[0], bounds.center[1], bounds.center[2]);
      controls.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return null;
}

interface HullViewerProps {
  layers: PointLayer[];
  height?: number;
  /** Wzgledna skala punktow (1 = domyslna); rzeczywisty rozmiar w jednostkach
   *  swiata jest i tak liczony proporcjonalnie do rozmiaru kadluba. Ignorowane w trybie "mesh". */
  sizeScale?: number;
  renderMode?: RenderMode;
  controlMode?: ControlMode;
  /** Klucz resetu widoku - kamera dopasowuje sie od nowa tylko wtedy, gdy ta
   *  wartosc sie zmieni (np. inna jednostka), nie przy kazdej zmianie `layers`. */
  resetViewKey?: string;
  /** Dodatkowe punkty do jaskrawego podswietlenia (np. wybrany kafelek heatmapy). */
  highlightPositions?: number[];
  onPick?: (info: PickInfo) => void;
  onHover?: (info: PickInfo | null) => void;
}

export function HullViewer({
  layers,
  height = 420,
  sizeScale = 1,
  renderMode = "points",
  controlMode = "orbit",
  resetViewKey = "static",
  highlightPositions,
  onPick,
  onHover,
}: HullViewerProps) {
  const reference = layers.find((l) => l.positions.length > 0) ?? layers[0];
  const bounds = useMemo(() => computeBounds(reference?.positions ?? []), [reference]);
  const worldSize = (bounds.radius / 140) * sizeScale;
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const dir = new THREE.Vector3(0.9, 0.7, 0.9).normalize();
  const initialCamPos: [number, number, number] = [
    bounds.center[0] + dir.x * bounds.radius * 2.6,
    bounds.center[1] + dir.y * bounds.radius * 2.6,
    bounds.center[2] + dir.z * bounds.radius * 2.6,
  ];

  return (
    <div style={{ height, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
      <Canvas
        key={resetViewKey}
        camera={{ position: initialCamPos, fov: 42, near: Math.max(0.02, bounds.radius / 200), far: bounds.radius * 200 }}
        dpr={[1, 1.5]}
        onCreated={({ scene }) => {
          scene.background = null;
        }}
      >
        <color attach="background" args={["#00000000"]} />
        <ambientLight intensity={renderMode === "mesh" ? 0.75 : 0.95} />
        <directionalLight position={[bounds.radius, bounds.radius * 1.5, bounds.radius]} intensity={renderMode === "mesh" ? 1.1 : 0.6} />
        {renderMode === "mesh" && (
          <directionalLight position={[-bounds.radius, bounds.radius * 0.4, -bounds.radius * 0.6]} intensity={0.35} />
        )}
        {renderMode === "points" && <PickingThreshold value={worldSize * 4} />}
        {layers.map((l) =>
          renderMode === "mesh" ? (
            <MeshLayer key={l.key} layer={l} onPick={onPick} onHover={onHover} />
          ) : (
            <PointCloudLayer key={l.key} layer={l} worldSize={worldSize} onPick={onPick} onHover={onHover} />
          )
        )}
        {highlightPositions && <HighlightLayer positions={highlightPositions} worldSize={worldSize} />}
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
        <CameraRig resetKey={resetViewKey} boundsRef={boundsRef} controlsRef={controlsRef} />
        {controlMode === "orbit" ? (
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={bounds.radius * 0.05}
            maxDistance={bounds.radius * 8}
          />
        ) : (
          <FlyControls movementSpeed={bounds.radius * 0.6} rollSpeed={Math.PI / 8} dragToLook autoForward={false} />
        )}
      </Canvas>
    </div>
  );
}
