"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GEAR_COUNT, GEAR_END, pointer, rig } from "@/lib/sceneRig";
import { mulberry32 } from "./Atmosphere";
import { faceRing } from "./Barbell";
import { badgeTexture, kettlebellTexture, knurlTexture, tireTexture } from "./textures";

const { clamp, damp, lerp } = THREE.MathUtils;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type GearSpec = {
  /** Hero'daki yerçekimsiz bekleyiş noktası: sisin derinliğinde, ekranın köşelerinde. */
  float: [number, number, number];
  /** Ölçek: süzülürken · sahnedeyken */
  scale: [number, number];
  /** Sahnedeki duruş açısı (baskı kameraya dönük) */
  present: [number, number, number];
  /** Kendi ekseni: boşta ve üzerine gelince bu eksende döner */
  axis: THREE.Vector3;
  idle: number;
  /** Sahnede sağa-sola salınım payı (lastik yanağı hep kameraya dönük kalsın diye az) */
  sway: number;
};

/** Sahneye geliş sırası: kettlebell, dambıl, lastik — Equipment.tsx'teki metinlerle aynı sıra. */
const GEAR: GearSpec[] = [
  { float: [-5.3, 2.6, -6.5], scale: [0.62, 1], present: [0.14, 0, 0.06], axis: Y_AXIS, idle: 0, sway: 1 },
  { float: [5.7, 2.8, -8], scale: [0.72, 1.08], present: [0.3, -0.55, 0.32], axis: X_AXIS, idle: 0.3, sway: 1 },
  { float: [-2.6, -5.4, -12], scale: [0.8, 0.88], present: [0.22, 0.32, 0], axis: Z_AXIS, idle: 0.22, sway: 0.45 },
];

// ─── Kettlebell (Y ekseni; taban -0.62, sap tepesi ~1.46) ─────────────────
const BELL_R = 0.82;
const BELL_BASE = -0.62;
/** Modelin dikey ortası: kendi etrafında dengeli dönsün. */
const BELL_CENTER = 0.42;

/** Gövde: tabanı düz kesilmiş küre. */
function bellGeometry() {
  const from = Math.asin(BELL_BASE / BELL_R);
  const to = 1.22;
  const points = [new THREE.Vector2(0, BELL_BASE)];
  for (let i = 0; i <= 32; i++) {
    const a = lerp(from, to, i / 32);
    points.push(new THREE.Vector2(Math.cos(a) * BELL_R, Math.sin(a) * BELL_R));
  }
  points.push(new THREE.Vector2(0, Math.sin(to) * BELL_R + 0.02));
  return new THREE.LatheGeometry(points, 64);
}

/** Sap: gövdeye gömülen iki bacak ve üstte yuvarlak kavrama. */
function handleGeometry() {
  const path = new THREE.CatmullRomCurve3(
    [
      [-0.43, 0.42],
      [-0.47, 0.86],
      [-0.41, 1.2],
      [-0.21, 1.35],
      [0, 1.38],
      [0.21, 1.35],
      [0.41, 1.2],
      [0.47, 0.86],
      [0.43, 0.42],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
  );
  return new THREE.TubeGeometry(path, 80, 0.085, 18, false);
}

// ─── Traktör lastiği (Z ekseni: yanak kameraya bakar) ──────────────────────
const TIRE = { center: 0.92, half: 0.34, width: 0.36 };
const LUG_R = TIRE.center + TIRE.half + 0.01;

/**
 * Yuvarlatılmış kare kesit (süperelips, n = 4) döndürülür. Kesit yay uzunluğuna göre eşit
 * örneklenir: baskı dokusunun v ekseni kesit boyunca düzgün ilerlesin.
 */
function tireGeometry() {
  const { center, half, width } = TIRE;
  const dense: THREE.Vector2[] = [];
  for (let i = 0; i <= 400; i++) {
    const t = Math.PI + (i / 400) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    dense.push(
      new THREE.Vector2(center + half * Math.sign(c) * Math.sqrt(Math.abs(c)), width * Math.sign(s) * Math.sqrt(Math.abs(s))),
    );
  }
  const profile = new THREE.SplineCurve(dense);
  const geometry = new THREE.LatheGeometry(profile.getSpacedPoints(96), 96);
  geometry.rotateX(Math.PI / 2);
  return { geometry, around: Math.PI * 2 * center, across: profile.getLength() };
}

/** Sırttaki V desenli diş blokları (tek InstancedMesh). */
function treadLugs(material: THREE.Material) {
  const count = 34;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.11, 0.3), material, count * 2);
  const tangent = new THREE.Vector3();
  const radial = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  const tilt = new THREE.Matrix4();
  let n = 0;
  for (let i = 0; i < count; i++) {
    for (const side of [-1, 1]) {
      const a = ((i + (side > 0 ? 0.5 : 0)) / count) * Math.PI * 2;
      radial.set(Math.cos(a), Math.sin(a), 0);
      tangent.set(-Math.sin(a), Math.cos(a), 0);
      basis.makeBasis(tangent, radial, Z_AXIS).setPosition(radial.x * LUG_R, radial.y * LUG_R, side * 0.14);
      mesh.setMatrixAt(n++, basis.multiply(tilt.makeRotationY(side * 0.55)));
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function useAssets() {
  const assets = useMemo(() => {
    const red = new THREE.MeshStandardMaterial({ color: "#8a0a0a", roughness: 0.38, metalness: 0.4 });
    const rubber = new THREE.MeshStandardMaterial({ color: "#131313", roughness: 0.85, metalness: 0.05 });
    const chrome = new THREE.MeshStandardMaterial({ color: "#d6d6d6", metalness: 1, roughness: 0.16 });
    const knurlMap = knurlTexture();
    knurlMap.repeat.set(8, 14);
    const knurl = new THREE.MeshStandardMaterial({
      color: "#a4a4a4",
      metalness: 1,
      roughness: 0.42,
      bumpMap: knurlMap,
      bumpScale: 1.2,
    });

    const tire = tireGeometry();
    const prints = {
      bell: kettlebellTexture(32, { text: "#f4f4f4", accent: "#160000", fine: "#f1caca" }),
      badge: badgeTexture(20, { text: "#f2f2f2", accent: "#cc0000", fine: "#9a9a9a" }),
      tire: tireTexture(tire.around, tire.across),
    };
    const decal = (map: THREE.Texture) =>
      new THREE.MeshStandardMaterial({
        map,
        emissiveMap: map,
        emissive: "#ffffff",
        emissiveIntensity: 0.3,
        transparent: true,
        depthWrite: false,
        roughness: 0.5,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      });
    const bellDecal = decal(prints.bell);
    const badgeDecal = decal(prints.badge);
    const tireBody = new THREE.MeshStandardMaterial({
      map: prints.tire,
      emissiveMap: prints.tire,
      emissive: "#ffffff",
      emissiveIntensity: 0.12,
      roughness: 0.9,
      metalness: 0,
    });

    const geometries = {
      bell: bellGeometry(),
      handle: handleGeometry(),
      // Gövdenin önüne kavisli oturan baskı yaması (ekvatorda, +Z yönünde).
      bellPatch: new THREE.SphereGeometry(BELL_R + 0.004, 32, 16, Math.PI / 2 - 0.62, 1.24, Math.PI / 2 - 0.42, 0.84),
      grip: new THREE.CylinderGeometry(0.07, 0.07, 0.92, 24),
      collar: new THREE.CylinderGeometry(0.12, 0.12, 0.05, 32),
      head: new THREE.CylinderGeometry(0.4, 0.4, 0.5, 6),
      badgeFront: faceRing(0.001, 0.32, 1),
      badgeBack: faceRing(0.001, 0.32, -1),
      tire: tire.geometry,
    };
    const lugs = treadLugs(rubber);

    // Üzerine gelinince parlayan baskılar, sahne sırasıyla: [malzeme, taban parlaklığı]
    const glows: [THREE.MeshStandardMaterial, number][] = [
      [bellDecal, 0.3],
      [badgeDecal, 0.3],
      [tireBody, 0.12],
    ];

    return { red, rubber, chrome, knurl, bellDecal, badgeDecal, tireBody, prints, geometries, lugs, glows };
  }, []);

  useEffect(
    () => () => {
      const { red, rubber, chrome, knurl, bellDecal, badgeDecal, tireBody, prints, geometries, lugs } = assets;
      knurl.bumpMap?.dispose();
      for (const item of [red, rubber, chrome, knurl, bellDecal, badgeDecal, tireBody, ...Object.values(prints)])
        item.dispose();
      for (const geometry of Object.values(geometries)) geometry.dispose();
      lugs.geometry.dispose();
      lugs.dispose();
    },
    [assets],
  );

  return assets;
}

type GearState = {
  spec: GearSpec;
  present: THREE.Quaternion;
  tumbleAxis: THREE.Vector3;
  phase: number;
  tumble: number;
  tumbleSpeed: number;
  spin: number;
  spinVel: number;
  hover: boolean;
  glow: number;
  flash: number;
  staged: boolean;
};

function createGear(): GearState[] {
  const rand = mulberry32(7);
  return GEAR.map((spec) => ({
    spec,
    present: new THREE.Quaternion().setFromEuler(new THREE.Euler(...spec.present)),
    tumbleAxis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
    phase: rand() * Math.PI * 2,
    tumble: rand() * Math.PI * 2,
    tumbleSpeed: 0.1 + rand() * 0.12,
    spin: 0,
    spinVel: 0,
    hover: false,
    glow: 0,
    flash: 0,
    staged: false,
  }));
}

// Kare başına yeniden kullanılan geçici nesneler.
const _float = new THREE.Vector3();
const _stage = new THREE.Vector3();
const _qFloat = new THREE.Quaternion();
const _qStage = new THREE.Quaternion();
const _qSpin = new THREE.Quaternion();
const _euler = new THREE.Euler();

/**
 * Salonun geri kalanı: kettlebell, altıgen dambıl ve traktör lastiği.
 *  · Hero: sisin derinliğinde, ekranın köşelerinde yerçekimsiz süzülür, ağır ağır takla atar.
 *  · Barı yükle: daha da geriye, sisin içine çekilir.
 *  · Ekipman (rig.gear): her biri sırayla öne gelip sahneye oturur, scroll'la döner;
 *    sıradaki gelince süzüldüğü yere geri döner. Sonuncusu da çıkınca hepsi sisin dibine çekilir.
 *  · Üzerine gelinen parça kendi ekseninde döner ve baskısı parlar; tıklayınca hızla çevrilir.
 */
export function Gear({ motion }: { motion: number }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const [initial] = useState(createGear);
  const gear = useRef(initial);
  const sim = useRef({ t: 0, focus: 0, gear: 0, intro: 0, px: 0, py: 0 });
  const { red, rubber, chrome, knurl, bellDecal, badgeDecal, tireBody, geometries, lugs, glows } = useAssets();

  useFrame((state, delta) => {
    if (delta < 1e-4) return;
    const dt = Math.min(delta, 1 / 20);
    const s = sim.current;
    s.t += dt * motion;
    s.focus = damp(s.focus, rig.focus, 3.5, dt);
    s.gear = damp(s.gear, rig.gear, 6, dt);
    s.intro = damp(s.intro, rig.intro, 1.1, dt);
    s.px = damp(s.px, pointer.x, 2.5, dt);
    s.py = damp(s.py, pointer.y, 2.5, dt);

    // Sahne noktası: geniş ekranda sağda (metin solda), dikey ekranda ortada ve aşağıda (metin üstte).
    const aspect = state.size.width / state.size.height;
    const wide = clamp((aspect - 0.8) / 0.6, 0, 1);
    const spread = clamp(aspect / 1.6, 0.45, 1);
    _stage.set(lerp(0, 2.3, wide) * clamp(aspect / 1.6, 0.8, 1), lerp(-1.2, -0.1, wide), lerp(0.2, 1.4, wide));
    const f = easeInOut(s.focus);
    // Son parça sahneden çıkarken hepsi sisin dibine çekilir: sonraki bölümlerin başlıkları temiz kalsın.
    const retreat = easeInOut(clamp((s.gear - GEAR_COUNT) / (GEAR_END - GEAR_COUNT), 0, 1));

    gear.current.forEach((g, i) => {
      const group = groups.current[i];
      if (!group) return;

      g.spinVel = damp(g.spinVel, g.hover ? 4 : 0, g.hover ? 3 : 1.2, dt);
      g.spin += (g.spinVel + g.spec.idle * motion) * dt;
      g.tumble += dt * g.tumbleSpeed * motion;
      g.glow = damp(g.glow, g.hover ? 1 : 0, 6, dt);
      g.flash = damp(g.flash, 0, 3, dt);

      // Süzülme: hero'da köşelerde; bar yüklenirken daha geriye, ekipman bitince sisin dibine çekilir.
      _float.set(...g.spec.float);
      _float.x *= spread * (1 + 0.15 * f + 0.3 * retreat);
      _float.z -= 4 * f + 9 * retreat;
      _float.x += Math.cos(s.t * 0.35 + g.phase) * 0.15;
      _float.y += Math.sin(s.t * 0.5 + g.phase) * 0.25 - (1 - s.intro) * 3;
      _qFloat.setFromAxisAngle(g.tumbleAxis, g.tumble);

      // Sahne: imlece eğilir, hafifçe salınır; scroll ilerledikçe kendi etrafında döner.
      const a = s.gear - i;
      const turn = (Math.sin(s.t * 0.35 + i) * 0.45 + (a - 0.72) * 1.6) * g.spec.sway;
      _qStage.setFromEuler(_euler.set(-s.py * 0.2, turn + s.px * 0.4, 0)).multiply(g.present);

      // 0 → 0.45 sahneye gelir, 1 → 1.45 sıradakine yer açıp süzüldüğü yere döner.
      const w = easeInOut(clamp(a / 0.45, 0, 1)) * (1 - easeInOut(clamp((a - 1) / 0.45, 0, 1)));
      group.position.lerpVectors(_float, _stage, w);
      group.position.y += Math.sin(s.t * 0.8 + g.phase) * 0.06 * w;
      group.quaternion.slerpQuaternions(_qFloat, _qStage, w).multiply(_qSpin.setFromAxisAngle(g.spec.axis, g.spin));
      group.scale.setScalar(lerp(g.spec.scale[0] * spread, g.spec.scale[1] * lerp(0.72, 1, wide), w));

      // Sahneye oturduğu an baskısı bir kez parlar.
      const staged = w > 0.98;
      if (staged && !g.staged) g.flash = 1;
      g.staged = staged;

      const [material, base] = glows[i];
      material.emissiveIntensity = base + g.glow * 1.6 + g.flash * 1.8;
    });
  });

  const handlers = (i: number) => ({
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      gear.current[i].hover = true;
    },
    onPointerOut: () => {
      gear.current[i].hover = false;
    },
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      gear.current[i].spinVel += 12;
    },
  });

  return (
    <>
      {/* Kettlebell: kırmızı yarışma kettlebell'i, önünde "32 KG" */}
      <group
        ref={(el) => {
          groups.current[0] = el;
        }}
        {...handlers(0)}
      >
        <group position-y={-BELL_CENTER}>
          <mesh geometry={geometries.bell} material={red} />
          <mesh geometry={geometries.handle} material={red} />
          <mesh geometry={geometries.bellPatch} material={bellDecal} />
        </group>
      </group>

      {/* Altıgen dambıl: tırtıllı krom sap, kauçuk başlar, uçlarda "20 KG" */}
      <group
        ref={(el) => {
          groups.current[1] = el;
        }}
        {...handlers(1)}
      >
        <mesh geometry={geometries.grip} material={knurl} rotation-z={Math.PI / 2} />
        {([-1, 1] as const).map((side) => (
          <group key={side}>
            <mesh geometry={geometries.collar} material={chrome} position-x={side * 0.485} rotation-z={Math.PI / 2} />
            <mesh geometry={geometries.head} material={rubber} position-x={side * 0.755} rotation-z={Math.PI / 2} />
            <mesh
              geometry={side > 0 ? geometries.badgeFront : geometries.badgeBack}
              material={badgeDecal}
              position-x={side * 1.008}
            />
          </group>
        ))}
      </group>

      {/* Traktör lastiği: V dişli sırt, yanakta "AS FITNESS" */}
      <group
        ref={(el) => {
          groups.current[2] = el;
        }}
        {...handlers(2)}
      >
        <mesh geometry={geometries.tire} material={tireBody} />
        <primitive object={lugs} />
      </group>
    </>
  );
}
