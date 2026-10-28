"use client";

import { Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { rig } from "@/lib/sceneRig";

const { clamp, damp, lerp } = THREE.MathUtils;
const TAU = Math.PI * 2;

// ─── Ölçüler (dünya birimi) ──────────────────────────────────────────────
const GRIP_R = 0.068;
const SLEEVE_R = 0.1;
const BEVEL = 0.014;
const GAP = 0.008;
const SHOULDER_X = 0.54;
const SHOULDER_HALF = 0.035;
const COLLAR_HALF = 0.045;
const SLEEVE_OVERHANG = 0.1;
const PLATES = [
  { r: 0.62, t: 0.1 },
  { r: 0.52, t: 0.085 },
  { r: 0.42, t: 0.075 },
] as const;

/** Plakaları kol üzerinde içten dışa dizer. */
const LAYOUT = (() => {
  const sleeveStart = SHOULDER_X + SHOULDER_HALF;
  let cursor = sleeveStart;
  const plates = PLATES.map((p) => {
    const thickness = p.t + BEVEL * 2;
    const x = cursor + GAP + thickness / 2;
    cursor += GAP + thickness;
    return { ...p, x, face: thickness / 2 };
  });
  const collarX = cursor + GAP + COLLAR_HALF;
  return { plates, collarX, sleeveStart, sleeveEnd: collarX + COLLAR_HALF + SLEEVE_OVERHANG };
})();

// ─── Ayrılan parçalar ────────────────────────────────────────────────────
type Part = {
  key: string;
  /** PLATES indeksi; null → kilit somunu */
  plate: number | null;
  /** birleşik hâldeki X */
  x: number;
  /** ayrık hâldeki konum */
  to: [number, number, number];
  /** ayrık hâldeki Y/Z dönüşü */
  spin: [number, number];
  /** kademeli ayrılma: dıştaki parça önce çıkar */
  delay: number;
  phase: number;
};

/** Deterministik rastgelelik: her yüklemede aynı "dağınık" kompozisyon. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PARTS: Part[] = (() => {
  const rnd = mulberry32(52);
  const spread = () => rnd() - 0.5;
  const parts: Part[] = [];
  for (const side of [-1, 1]) {
    parts.push({
      key: `collar${side}`,
      plate: null,
      x: LAYOUT.collarX * side,
      to: [(LAYOUT.collarX + 0.75) * side, spread() * 0.4, 0.15 + rnd() * 0.3],
      spin: [spread() * 2, spread() * 2],
      delay: 0,
      phase: rnd() * TAU,
    });
    LAYOUT.plates.forEach((p, i) => {
      parts.push({
        key: `plate${side}${i}`,
        plate: i,
        x: p.x * side,
        to: [(p.x + 0.22 + i * 0.2) * side, spread() * 0.6, spread() * 0.8 + 0.15],
        spin: [spread() * 1.2, spread() * 0.9],
        delay: 0.08 + (PLATES.length - 1 - i) * 0.1,
        phase: rnd() * TAU,
      });
    });
  }
  return parts;
})();
const MAX_DELAY = Math.max(...PARTS.map((p) => p.delay));

// ─── Eğriler ─────────────────────────────────────────────────────────────
const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
/** Kaldırma: önce küçük bir çöküş (dip), sonra güçlü itiş (drive) — gerçek bir kaldırış gibi. */
const liftCurve = (x: number) =>
  x < 0.18 ? -0.14 * easeOutCubic(x / 0.18) : -0.14 + 1.14 * easeOutCubic((x - 0.18) / 0.82);

// ─── Geometri & malzeme ─────────────────────────────────────────────────
/** Ortası delik, kenarları pahlı disk (plaka, göbek, bilezik); ekseni X'e hizalı. */
function disc(outer: number, inner: number, depth: number, bevel: number) {
  const shape = new THREE.Shape().absarc(0, 0, outer, 0, TAU, false);
  if (inner > 0) shape.holes.push(new THREE.Path().absarc(0, 0, inner, 0, TAU, true));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments: 96,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: bevel,
    bevelThickness: bevel,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.rotateY(Math.PI / 2);
  return geometry;
}

function createGeometry() {
  const hole = SLEEVE_R + BEVEL + 0.004;
  const sleeveLength = LAYOUT.sleeveEnd - LAYOUT.sleeveStart;
  return {
    grip: new THREE.CylinderGeometry(GRIP_R, GRIP_R, SHOULDER_X * 2, 48).rotateZ(Math.PI / 2),
    shoulder: disc(0.15, 0, SHOULDER_HALF * 2 - 0.024, 0.012),
    sleeve: new THREE.CylinderGeometry(SLEEVE_R, SLEEVE_R, sleeveLength, 48).rotateZ(Math.PI / 2),
    // 6 kenarlı silindir = altıgen kilit somunu
    collar: new THREE.CylinderGeometry(0.165, 0.165, COLLAR_HALF * 2, 6).rotateZ(Math.PI / 2),
    plates: PLATES.map((p) => disc(p.r, hole, p.t, BEVEL)),
    hubs: PLATES.map((p) => disc(0.2, hole, p.t + 0.02, 0.012)),
    rings: PLATES.map((p) => new THREE.TorusGeometry(p.r * 0.8, 0.006, 8, 180).rotateY(Math.PI / 2)),
    sleeveCenter: LAYOUT.sleeveStart + sleeveLength / 2,
  };
}

function createMaterials(neon: string) {
  return {
    chrome: new THREE.MeshStandardMaterial({ color: "#d9dde3", metalness: 1, roughness: 0.16 }),
    nut: new THREE.MeshStandardMaterial({ color: "#c9ced6", metalness: 1, roughness: 0.24, flatShading: true }),
    grip: new THREE.MeshStandardMaterial({ color: "#7b828c", metalness: 1, roughness: 0.46 }),
    plate: new THREE.MeshPhysicalMaterial({
      color: "#0d0f13",
      metalness: 0.5,
      roughness: 0.34,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
    }),
    // 1'in üzerindeki (HDR) renk bloom eşiğini aşar → neon parıltı
    glow: new THREE.MeshBasicMaterial({ color: new THREE.Color(neon).multiplyScalar(6), toneMapped: false }),
  };
}

type Geometry = ReturnType<typeof createGeometry>;
type Materials = ReturnType<typeof createMaterials>;

/** Plaka gövdesi + krom göbek + iki yüzde neon halka. */
function Plate({ index, geo, mat }: { index: number; geo: Geometry; mat: Materials }) {
  const face = LAYOUT.plates[index].face + 0.002;
  return (
    <>
      <mesh geometry={geo.plates[index]} material={mat.plate} />
      <mesh geometry={geo.hubs[index]} material={mat.chrome} />
      <mesh geometry={geo.rings[index]} material={mat.glow} position-x={face} />
      <mesh geometry={geo.rings[index]} material={mat.glow} position-x={-face} />
    </>
  );
}

// ─── Bileşen ─────────────────────────────────────────────────────────────
export function Dumbbell({ neon }: { neon: string }) {
  const root = useRef<THREE.Group>(null);
  const parts = useRef<Array<THREE.Group | null>>([]);
  const smooth = useRef({ appear: 0, lift: 0, explode: 0, drift: 0, settle: 0 });
  const [motion] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const geo = useMemo(() => createGeometry(), []);
  const mat = useMemo(() => createMaterials(neon), [neon]);

  useEffect(
    () => () => {
      for (const value of Object.values(geo)) {
        for (const g of [value].flat()) if (g instanceof THREE.BufferGeometry) g.dispose();
      }
    },
    [geo],
  );
  useEffect(() => () => Object.values(mat).forEach((m) => m.dispose()), [mat]);

  useFrame((state, delta) => {
    const group = root.current;
    if (!group) return;

    const dt = Math.min(delta, 1 / 20); // sekme değişiminden sonra zıplamasın
    const t = state.clock.elapsedTime;
    const { width, height } = state.viewport;
    const portrait = width < height;

    // GSAP'in yazdığı ham değerleri yumuşat
    const s = smooth.current;
    s.appear = motion ? damp(s.appear, rig.intro, 2.2, dt) : 1;
    s.lift = damp(s.lift, rig.lift, 6, dt);
    s.explode = damp(s.explode, rig.explode, 5, dt);
    s.drift = damp(s.drift, rig.drift, 5, dt);
    s.settle = damp(s.settle, rig.settle, 5, dt);

    // ── Pozlar: her bölüm bir öncekinin üzerine lerp edilir (sıra = scroll sırası) ──
    const w = width;
    const h = height;

    // 00 · Hero: sağ üstte, 3/4 duruş, hafif eğik
    let x = portrait ? 0 : w * 0.21;
    let y = portrait ? h * 0.2 : h * 0.07;
    let z = 0;
    let rx = 0.2;
    let ry = -0.6;
    let rz = 0.3;
    let scale = portrait ? clamp(w / 3.1, 0.5, 0.85) : clamp(w / 7.2, 0.85, 1.35);

    // 01 · Kaldırma: çöküş → itiş; bar yataya gelirken bir ucu önden kalkar
    y += liftCurve(s.lift) * (portrait ? 0.45 : 0.6);
    z = lerp(z, portrait ? -0.8 : 0, s.lift); // mobilde metnin önünden çekilir
    rx = lerp(rx, 0.06, s.lift);
    rz = lerp(rz, 0, s.lift) + Math.sin(s.lift * Math.PI) * 0.16;

    // 02 · Ayrılma: sağdaki boş sahneye geçer, plaka yüzleri kameraya dönük diyagonal
    //      "patlatılmış çizim" duruşu. Mobilde metnin arkasında derinde kalır.
    x = lerp(x, portrait ? 0 : w * 0.25, s.explode);
    y = lerp(y, portrait ? h * 0.16 : -h * 0.02, s.explode);
    z = lerp(z, portrait ? -1.6 : 0.3, s.explode);
    rx = lerp(rx, 0.22, s.explode);
    ry = lerp(ry, -1, s.explode);
    rz = lerp(rz, 0.75, s.explode);
    scale *= 1 - 0.24 * s.explode;

    // 03 · Galeri: başlıkla not arasındaki boşluğa ve derine çekilir, diğer yandan 3/4 görünür
    x = lerp(x, w * 0.18, s.drift);
    y = lerp(y, portrait ? h * 0.22 : h * 0.18, s.drift);
    z = lerp(z, -3.4, s.drift);
    ry = lerp(ry, 0.55, s.drift);
    rz = lerp(rz, -0.25, s.drift);

    // 04 · Footer: "Yol tarifi al"ın yanındaki boşluğa iner ve sakinleşir
    x = lerp(x, portrait ? 0 : w * 0.2, s.settle);
    y = lerp(y, portrait ? h * 0.28 : h * 0.25, s.settle);
    z = lerp(z, portrait ? -1 : -0.4, s.settle);
    rx = lerp(rx, 0.12, s.settle);
    ry = lerp(ry, -0.5, s.settle);
    rz = lerp(rz, 0.08, s.settle);
    scale *= lerp(1, 0.75, s.settle);

    // Boşta salınım + imleç
    if (motion) {
      ry += Math.sin(t * 0.23) * 0.22 + state.pointer.x * 0.3;
      rx -= state.pointer.y * 0.12;
    }

    // Giriş: aşağıdan, dönerek süzülür
    const enter = 1 - s.appear;
    y -= enter * 1.6;
    ry += enter * 1.4;
    scale *= 0.35 + 0.65 * s.appear;

    group.position.set(x, y, z);
    group.rotation.x = damp(group.rotation.x, rx, 4, dt);
    group.rotation.y = damp(group.rotation.y, ry, 4, dt);
    group.rotation.z = damp(group.rotation.z, rz, 4, dt);
    group.scale.setScalar(scale);
    group.visible = s.appear > 0.01;

    // ── Plakalar: kademeli ayrıl, yerçekimsiz süzül, tekrar kilitlen ──
    PARTS.forEach((p, i) => {
      const node = parts.current[i];
      if (!node) return;
      const k = easeInOutCubic(clamp((s.explode - p.delay) / (1 - MAX_DELAY), 0, 1));
      const bob = motion ? Math.sin(t * 0.9 + p.phase) * 0.06 * k : 0;
      const wobble = motion ? Math.sin(t * 0.5 + p.phase) * 0.2 * k : 0;
      node.position.set(lerp(p.x, p.to[0], k), p.to[1] * k + bob, p.to[2] * k);
      node.rotation.set(0, p.spin[0] * k + wobble, p.spin[1] * k);
    });
  });

  return (
    <group ref={root} scale={0}>
      <Float enabled={motion} speed={1.2} rotationIntensity={0.3} floatIntensity={0.6} floatingRange={[-0.08, 0.08]}>
        <mesh geometry={geo.grip} material={mat.grip} />
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh geometry={geo.shoulder} material={mat.chrome} position-x={SHOULDER_X * side} />
            <mesh geometry={geo.sleeve} material={mat.chrome} position-x={geo.sleeveCenter * side} />
          </group>
        ))}

        {PARTS.map((p, i) => (
          <group
            key={p.key}
            ref={(node) => {
              parts.current[i] = node;
            }}
            position-x={p.x}
          >
            {p.plate === null ? (
              <mesh geometry={geo.collar} material={mat.nut} />
            ) : (
              <Plate index={p.plate} geo={geo} mat={mat} />
            )}
          </group>
        ))}
      </Float>
    </group>
  );
}
