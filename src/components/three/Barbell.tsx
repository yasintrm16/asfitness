"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { pointer, rig } from "@/lib/sceneRig";
import { mulberry32 } from "./Atmosphere";
import { knurlTexture, plateFaceTexture, type PlateInk } from "./textures";

const { clamp, damp, lerp } = THREE.MathUtils;

// ─── Ölçüler (dünya birimi; bar X ekseni boyunca) ─────────────────────────
const SHAFT_R = 0.062;
/** İç bilezik: plakaların dayandığı omuz. Esneme bu noktadan olur. */
const COLLAR_X = 1.95;
const SLEEVE_R = 0.1;
const SLEEVE_END = 3.12;
const HOLE_R = 0.106;
const HUB_R = 0.2;

type Finish = "rubber" | "red" | "steel";
type PlateSpec = { kg: number; radius: number; thickness: number; finish: Finish };

/** Bilezikten dışarı doğru takılma sırası. Toplam: 20 kg bar + 2 × (25 + 20 + 15 + 10) = 160 kg. */
export const PLATES: PlateSpec[] = [
  { kg: 25, radius: 0.98, thickness: 0.27, finish: "rubber" },
  { kg: 20, radius: 0.86, thickness: 0.23, finish: "red" },
  { kg: 15, radius: 0.72, thickness: 0.19, finish: "steel" },
  { kg: 10, radius: 0.6, thickness: 0.16, finish: "rubber" },
];

/** Her plakanın merkezinin bilezikten uzaklığı (aralarında ince boşluk). */
const SEATS = (() => {
  let edge = 0.06;
  return PLATES.map(({ thickness }) => {
    const seat = edge + thickness / 2;
    edge += thickness + 0.012;
    return seat;
  });
})();

const INKS: Record<Finish, PlateInk> = {
  rubber: { text: "#e01414", accent: "#cc0000", fine: "#8f8f8f" },
  red: { text: "#f4f4f4", accent: "#140000", fine: "#f1caca" },
  steel: { text: "#e6e6e6", accent: "#cc0000", fine: "#b8b8b8" },
};

/** Yerçekimsiz bekleyiş noktaları (plaka sırasıyla; bar grubuna göre). Barın üstünde, ekranın iki yanında. */
const FLOAT: Record<1 | -1, [number, number, number][]> = {
  1: [
    [4.0, 1.5, -0.5],
    [4.8, -0.15, 0.6],
    [5.4, 1.95, -1.4],
    [4.3, 1.3, 1.5],
  ],
  [-1]: [
    [-4.1, 1.9, 0.4],
    [-4.9, 0.45, -0.6],
    [-5.4, 2.35, 1.0],
    [-4.4, 1.05, -1.4],
  ],
};

/** Sahne kompozisyonu: hero'da aşağıda ve açılı, "Barı Yükle"de merkezde, sonra yukarı süzülüp sise karışır. */
const POSE = {
  hero: { pos: [0, -1.95, -0.8], rot: [0.16, -0.34, 0] },
  load: { pos: [0.3, 0.4, 0.4], rot: [0.12, -0.36, 0.02] },
  exit: { pos: [0.5, 9.5, -18], rot: [0.5, 1.2, 0.3] },
} as const;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn = (t: number) => t * t * t;

/** Bumper plaka kesiti (göbek, gömük yüz, yükseltilmiş kenar) — Y ekseninde döndürülüp X'e çevrilir. */
function plateGeometry(radius: number, thickness: number) {
  const h = thickness / 2;
  const profile: [number, number][] = [
    [HOLE_R, -h * 0.92],
    [HUB_R, -h * 0.92],
    [HUB_R * 1.1, -h * 0.6],
    [radius * 0.8, -h * 0.6],
    [radius * 0.87, -h * 0.97],
    [radius * 0.97, -h],
    [radius, -h * 0.82],
    [radius, h * 0.82],
    [radius * 0.97, h],
    [radius * 0.87, h * 0.97],
    [radius * 0.8, h * 0.6],
    [HUB_R * 1.1, h * 0.6],
    [HUB_R, h * 0.92],
    [HOLE_R, h * 0.92],
    [HOLE_R, -h * 0.92],
  ];
  const geometry = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    72,
  );
  geometry.rotateZ(-Math.PI / 2);
  return geometry;
}

/** X eksenine bakan halka (dir = 1: +X yüzü, -1: -X yüzü). UV düzlemsel: baskı dokusu kareye oturur. */
export function faceRing(inner: number, outer: number, dir: 1 | -1) {
  const geometry = new THREE.RingGeometry(inner, outer, 72);
  geometry.rotateY((dir * Math.PI) / 2);
  return geometry;
}

type PlateState = {
  spec: PlateSpec;
  k: number;
  side: 1 | -1;
  float: THREE.Vector3;
  axis: THREE.Vector3;
  phase: number;
  tumble: number;
  tumbleSpeed: number;
  spin: number;
  spinVel: number;
  hover: boolean;
  glow: number;
  flash: number;
  locked: boolean;
};

function createPlates(): PlateState[] {
  const rand = mulberry32(42);
  return ([-1, 1] as const).flatMap((side) =>
    PLATES.map((spec, k) => {
      return {
        spec,
        k,
        side,
        float: new THREE.Vector3(...FLOAT[side][k]),
        axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        phase: rand() * Math.PI * 2,
        tumble: rand() * Math.PI * 2,
        tumbleSpeed: 0.12 + rand() * 0.2,
        spin: rand() * Math.PI * 2,
        spinVel: 0,
        hover: false,
        glow: 0,
        flash: 0,
        locked: false,
      };
    }),
  );
}

function useAssets(plates: PlateState[]) {
  const assets = useMemo(() => {
    const chrome = new THREE.MeshStandardMaterial({ color: "#d6d6d6", metalness: 1, roughness: 0.16 });
    const knurl = new THREE.MeshStandardMaterial({
      color: "#a4a4a4",
      metalness: 1,
      roughness: 0.42,
      bumpMap: knurlTexture(),
      bumpScale: 1.4,
    });
    const collar = new THREE.MeshStandardMaterial({ color: "#151515", metalness: 0.85, roughness: 0.3 });
    const cap = new THREE.MeshStandardMaterial({ color: "#b00000", metalness: 0.7, roughness: 0.28, emissive: "#3a0000" });
    const bodies: Record<Finish, THREE.MeshStandardMaterial> = {
      rubber: new THREE.MeshStandardMaterial({ color: "#121212", roughness: 0.82, metalness: 0.05 }),
      red: new THREE.MeshStandardMaterial({ color: "#8c0808", roughness: 0.6, metalness: 0.05 }),
      steel: new THREE.MeshStandardMaterial({ color: "#3d3d3d", roughness: 0.32, metalness: 0.9 }),
    };

    const plateGeos = PLATES.map((p) => plateGeometry(p.radius, p.thickness));
    const decalGeos = PLATES.map((p) => ({
      front: faceRing(HUB_R * 1.12, p.radius * 0.8, 1),
      back: faceRing(HUB_R * 1.12, p.radius * 0.8, -1),
    }));
    const hubGeos = { front: faceRing(HOLE_R, HUB_R * 1.04, 1), back: faceRing(HOLE_R, HUB_R * 1.04, -1) };
    const faces = PLATES.map((p) => plateFaceTexture(p.kg, INKS[p.finish]));
    // Her plakanın kendi baskı malzemesi: üzerine gelinen plaka tek başına parlasın.
    const decals = plates.map(
      (p) =>
        new THREE.MeshStandardMaterial({
          map: faces[p.k],
          emissiveMap: faces[p.k],
          emissive: "#ffffff",
          emissiveIntensity: 0.35,
          transparent: true,
          depthWrite: false,
          roughness: 0.55,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        }),
    );

    return { chrome, knurl, collar, cap, bodies, plateGeos, decalGeos, hubGeos, faces, decals };
  }, [plates]);

  useEffect(
    () => () => {
      const { chrome, knurl, collar, cap, bodies, plateGeos, decalGeos, hubGeos, faces, decals } = assets;
      knurl.bumpMap?.dispose();
      for (const item of [chrome, knurl, collar, cap, ...Object.values(bodies), ...plateGeos, ...faces, ...decals])
        item.dispose();
      for (const ring of [...decalGeos, hubGeos]) {
        ring.front.dispose();
        ring.back.dispose();
      }
    },
    [assets],
  );

  return assets;
}

// Kare başına yeniden kullanılan geçici nesneler (çöp üretmesin).
const _float = new THREE.Vector3();
const _pre = new THREE.Vector3();
const _seat = new THREE.Vector3();
const _qFloat = new THREE.Quaternion();
const _qSeat = new THREE.Quaternion();
const _qTilt = new THREE.Quaternion();
const _qRoll = new THREE.Quaternion();
const _qSpin = new THREE.Quaternion();

/**
 * Olimpik bar ve "AS FITNESS" baskılı plakalar.
 *  · Hero: plakalar barın uçlarında yerçekimsiz süzülür, yavaşça takla atar.
 *  · Scroll (rig.load): her çift sırayla hizalanır, kovana kayar ve "çat" diye oturur —
 *    bar sarsılır, uçları esner.
 *  · rig.lift: bar kaldırılır; ivmeye göre uçlar yaylanır (bar whip).
 *  · İmleç barı kendine doğru eğer; üzerine gelinen plaka döner ve baskısı parlar,
 *    tıklanınca hızla çevrilir.
 */
export function Barbell({ motion }: { motion: number }) {
  const root = useRef<THREE.Group>(null);
  const shaft = useRef<THREE.Group>(null);
  const sides = useRef<(THREE.Group | null)[]>([]);
  const sleeves = useRef<(THREE.Group | null)[]>([]);
  const plateGroups = useRef<(THREE.Group | null)[]>([]);
  const [initial] = useState(createPlates);
  const plates = useRef(initial);
  const sim = useRef({ t: 0, roll: 0, focus: 0, load: 0, lift: 0, exit: 0, intro: 0, px: 0, py: 0, whip: 0, whipVel: 0, y: 0, vy: 0, shake: 0 });
  const { chrome, knurl, collar, cap, bodies, plateGeos, decalGeos, hubGeos, decals } = useAssets(initial);

  useFrame((state, delta) => {
    const group = root.current;
    if (!group || delta < 1e-4) return;
    const dt = Math.min(delta, 1 / 20);
    const s = sim.current;
    s.t += dt * motion;
    s.focus = damp(s.focus, rig.focus, 3.5, dt);
    s.load = damp(s.load, rig.load, 7, dt);
    s.lift = damp(s.lift, rig.lift, 4.5, dt);
    s.exit = damp(s.exit, rig.exit, 3, dt);
    s.intro = damp(s.intro, rig.intro, 1.3, dt);
    s.px = damp(s.px, pointer.x, 2.5, dt);
    s.py = damp(s.py, pointer.y, 2.5, dt);
    s.shake = damp(s.shake, 0, 5, dt);

    // Kompozisyon: hero → yükle → çıkış arasında yumuşak geçiş, üstüne imleç eğimi ve nefes.
    const f = easeInOut(s.focus);
    const e = easeInOut(s.exit);
    const at = (a: readonly number[], b: readonly number[], c: readonly number[], i: number) =>
      lerp(lerp(a[i], b[i], f), c[i], e);
    const bob = Math.sin(s.t * 0.7) * 0.07;
    const liftY = s.lift * 0.85;
    const shakeY = Math.sin(performance.now() * 0.08) * 0.025 * s.shake;
    group.position.set(
      at(POSE.hero.pos, POSE.load.pos, POSE.exit.pos, 0),
      at(POSE.hero.pos, POSE.load.pos, POSE.exit.pos, 1) + bob + liftY + shakeY - (1 - s.intro) * 3,
      at(POSE.hero.pos, POSE.load.pos, POSE.exit.pos, 2),
    );
    group.rotation.set(
      at(POSE.hero.rot, POSE.load.rot, POSE.exit.rot, 0) - s.py * 0.14 - s.lift * 0.06,
      at(POSE.hero.rot, POSE.load.rot, POSE.exit.rot, 1) + s.px * 0.3,
      at(POSE.hero.rot, POSE.load.rot, POSE.exit.rot, 2) + Math.sin(s.t * 0.5) * 0.015,
    );
    // Dar ekranda bar ekrana sığsın; süzülen plakalar da kenardan içeri toplansın.
    const aspect = state.size.width / state.size.height;
    group.scale.setScalar(clamp(aspect / 1.55, 0.42, 1) * (0.9 + 0.1 * s.intro));
    const gather = 1 - 0.3 * clamp((1.5 - aspect) / 1, 0, 1);

    // Bar esnemesi: dikey ivme uçları yaylandırır (w > 0 → uçlar sarkar). Yük arttıkça hafif sehim.
    const y = bob + liftY;
    const vy = (y - s.y) / dt;
    const ay = (vy - s.vy) / dt;
    s.y = y;
    s.vy = vy;
    s.whipVel += (-150 * s.whip - 9 * s.whipVel + clamp(ay, -40, 40) * 0.004) * dt;
    s.whip = clamp(s.whip + s.whipVel * dt, -0.09, 0.09);
    const w = s.whip + 0.006 * s.load;
    const [left, right] = sides.current;
    if (left) left.rotation.z = w;
    if (right) right.rotation.z = -w;

    // Bar kendi ekseninde yavaşça döner (kovanlar da).
    s.roll += dt * 0.1 * motion;
    if (shaft.current) shaft.current.rotation.x = s.roll;
    for (const sleeve of sleeves.current) if (sleeve) sleeve.rotation.x = s.roll;

    plates.current.forEach((p, i) => {
      const plate = plateGroups.current[i];
      if (!plate) return;

      p.spinVel = damp(p.spinVel, p.hover ? 5 : 0, p.hover ? 3 : 1.2, dt);
      p.spin += p.spinVel * dt;
      p.glow = damp(p.glow, p.hover ? 1 : 0, 6, dt);
      p.flash = damp(p.flash, 0, 4, dt);
      p.tumble += dt * p.tumbleSpeed * motion;

      // Takılı hâl: bilezikten dışarı, esnemeyle birlikte eğik; bar ve kendi dönüşüyle döner.
      const seat = SEATS[p.k];
      _seat.set(p.side * (COLLAR_X + seat * Math.cos(w)), -seat * Math.sin(w), 0);
      _qTilt.setFromAxisAngle(Z_AXIS, -p.side * w);
      _qRoll.setFromAxisAngle(X_AXIS, s.roll + p.spin);
      _qSeat.multiplyQuaternions(_qTilt, _qRoll);

      // Süzülme hâli
      _float.copy(p.float);
      _float.x *= gather;
      _float.y += Math.sin(s.t * 0.6 + p.phase) * 0.14;
      _float.x += Math.cos(s.t * 0.4 + p.phase) * 0.06;
      _qFloat.setFromAxisAngle(p.axis, p.tumble).multiply(_qSpin.setFromAxisAngle(X_AXIS, p.spin));

      // Kovanın ucunun hemen dışında, eksene hizalı bekleme noktası.
      const reach = SLEEVE_END - COLLAR_X + 0.35 + p.spec.thickness;
      _pre.set(p.side * (COLLAR_X + reach * Math.cos(w)), -reach * Math.sin(w), 0);

      const t = clamp(s.load - p.k, 0, 1);
      if (t <= 0) {
        plate.position.copy(_float);
        plate.quaternion.copy(_qFloat);
      } else if (t < 0.62) {
        const a = easeInOut(t / 0.62);
        plate.position.lerpVectors(_float, _pre, a);
        plate.quaternion.slerpQuaternions(_qFloat, _qSeat, a);
      } else {
        // Kovana hızlanarak kayar ve bileziğe çarpar.
        plate.position.lerpVectors(_pre, _seat, easeIn((t - 0.62) / 0.38));
        plate.quaternion.copy(_qSeat);
      }

      const locked = t >= 0.995;
      if (locked && !p.locked) {
        s.whipVel += (0.35 * p.spec.kg) / 25;
        s.shake = 1;
        p.flash = 1;
      }
      p.locked = locked;

      decals[i].emissiveIntensity = 0.35 + p.glow * 2.2 + p.flash * 2.5;
    });
  });

  const over = (i: number) => (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    plates.current[i].hover = true;
  };
  const out = (i: number) => () => {
    plates.current[i].hover = false;
  };
  const flick = (i: number) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    plates.current[i].spinVel += 16;
  };

  return (
    <group ref={root}>
      {/* Gövde: düz krom orta, iki yanda tırtıllı tutuş bölgesi */}
      <group ref={shaft}>
        <mesh material={chrome} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[SHAFT_R, SHAFT_R, COLLAR_X * 2, 32]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={knurl} position-x={s * 1.2} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[SHAFT_R + 0.002, SHAFT_R + 0.002, 1.2, 32]} />
          </mesh>
        ))}
        <mesh material={knurl} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[SHAFT_R + 0.002, SHAFT_R + 0.002, 0.3, 32]} />
        </mesh>
      </group>

      {/* Kovanlar: bilezikten esner, kendi ekseninde döner */}
      {([-1, 1] as const).map((s, i) => (
        <group
          key={s}
          ref={(el) => {
            sides.current[i] = el;
          }}
          position-x={s * COLLAR_X}
        >
          <group
            ref={(el) => {
              sleeves.current[i] = el;
            }}
          >
            <mesh material={collar} position-x={s * 0.03} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.16, 0.16, 0.06, 40]} />
            </mesh>
            <mesh material={chrome} position-x={(s * (SLEEVE_END - COLLAR_X)) / 2} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[SLEEVE_R, SLEEVE_R, SLEEVE_END - COLLAR_X, 40]} />
            </mesh>
            <mesh material={cap} position-x={s * (SLEEVE_END - COLLAR_X + 0.012)} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[SLEEVE_R * 1.03, SLEEVE_R * 1.03, 0.025, 40]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Plakalar */}
      {initial.map((p, i) => {
        const face = (p.spec.thickness / 2) * 0.6 + 0.003;
        const hub = (p.spec.thickness / 2) * 0.92 + 0.002;
        return (
          <group
            key={`${p.side}-${p.k}`}
            ref={(el) => {
              plateGroups.current[i] = el;
            }}
          >
            <mesh
              geometry={plateGeos[p.k]}
              material={bodies[p.spec.finish]}
              onPointerOver={over(i)}
              onPointerOut={out(i)}
              onClick={flick(i)}
            />
            <mesh geometry={decalGeos[p.k].front} material={decals[i]} position-x={face} />
            <mesh geometry={decalGeos[p.k].back} material={decals[i]} position-x={-face} />
            <mesh geometry={hubGeos.front} material={chrome} position-x={hub} />
            <mesh geometry={hubGeos.back} material={chrome} position-x={-hub} />
          </group>
        );
      })}
    </group>
  );
}
