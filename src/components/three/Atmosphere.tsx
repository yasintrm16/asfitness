"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { beat, pointer, rig } from "@/lib/sceneRig";

const { damp, degToRad } = THREE.MathUtils;

/** Sahnenin kamerası (GymScene kurar, CameraRig imlece göre kaydırır). */
export const CAMERA = { z: 9, fov: 35 } as const;
const CAMERA_Z = CAMERA.z;
const FOV = CAMERA.fov;
/** Kırmızı neon ışığın süzüldüğü düzlem (kameraya biraz yakın: önündeki partiküller de aydınlanır). */
const LIGHT_Z = 0.6;
/** Partikül hacminin derinliği: kameranın hemen önünden sisin içine kadar. */
const NEAR_Z = 5.2;
const FAR_Z = -14;
/** Bir derinlikteki görüş alanının yarı yüksekliği / mesafe — biraz pay ile (kamera paralaksı ekranı boşaltmasın). */
const SPAN = Math.tan(degToRad(FOV / 2)) * 1.35;

/** Vurgu rengi tek kaynaktan gelir: globals.css → --color-accent. Shader'a sRGB değeriyle gider. */
export function readAccent() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
  const color = new THREE.Color(value || "#cc0000");
  return new THREE.Vector3(...color.convertLinearToSRGB().toArray());
}

/** Tohumlu rastgele sayı: her yüklemede aynı dizilim, render saf kalır. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Ortak GLSL ──────────────────────────────────────────────────────────
const NOISE = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }
`;

// ─── Sis: tam ekran, domain-warp fbm. Neon ışığın olduğu yerde kızıllaşır. ──────────
const fogVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const fogFragment = /* glsl */ `
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uLight;
  uniform vec3 uRed;
  uniform float uIntro;
  uniform float uBeat;
  varying vec2 vUv;
  ${NOISE}

  void main() {
    vec2 asp = vec2(uAspect, 1.0);
    vec2 p = vUv * asp * 2.0;
    float t = uTime * 0.03;

    // İki kat domain warp: sis kendi içinde ağır ağır kıvrılır.
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
    float f = fbm(p + 2.2 * q + vec2(t * 0.7, -t * 0.4));
    float density = smoothstep(0.32, 0.92, f);

    // Işık kaynakları: imleci izleyen neon + zeminden sızan kızıllık.
    vec2 d = (vUv - uLight) * asp;
    float lamp = exp(-dot(d, d) * 3.2);
    float floorGlow = exp(-pow(vUv.y * 2.6, 2.0));
    // Nabız bölümünde her kalp atışında sis ortadan dışarı kızarır.
    vec2 c = (vUv - 0.5) * asp;
    float heart = uBeat * (0.3 + exp(-dot(c, c) * 1.4) * 1.1);
    float light = 0.1 + lamp * 1.1 + floorGlow * 0.55 + heart;

    vec3 col = uRed * density * light * 0.42;
    col += vec3(0.05, 0.045, 0.045) * pow(density, 3.0) * (0.4 + lamp);

    // Kenarlar zifiri siyaha iner.
    float vig = 1.0 - smoothstep(0.35, 1.25, length((vUv - 0.5) * asp * vec2(0.85, 1.25)));
    col *= vig * uIntro;

    // Koyu kırmızı geçişlerde bantlanmayı kırmak için ince dither.
    col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

// ─── Partiküller: yavaşça yükselen kül ve köz. Neon ışığa yaklaşanlar kızarır. ──────
const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform vec3 uLight;
  uniform vec3 uNeon;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uSpan;
  uniform float uIntro;
  uniform float uBeat;
  attribute vec4 aSeed; // x: faz · y: hız · z: boyut · w: köz (1) / kül (0)
  varying float vGlow;
  varying float vAlpha;
  varying float vEmber;

  void main() {
    vec3 p = position;
    float t = uTime * aSeed.y;
    float phase = aSeed.x * 6.2831;

    // Organik süzülme: katmanlı sinüsler + yavaş yükseliş. Tepeden çıkan, kendi derinliğindeki
    // görüş alanının altından geri döner (yakındakiler ekranda kalsın diye yükseklik derinliğe göre).
    float h = uSpan * (${CAMERA_Z.toFixed(1)} - position.z);
    p.x += sin(t * 0.55 + phase + p.y * 0.35) * 0.32;
    p.z += cos(t * 0.45 + phase * 1.3 + p.x * 0.22) * 0.28;
    p.y += sin(t * 0.4 + phase * 0.7) * 0.18 + uTime * 0.05 * aSeed.y;
    p.y = mod(p.y + h * 0.5, h) - h * 0.5;

    // İmleç: ışığın etrafındaki partiküller yumuşakça kenara açılır.
    vec2 away = p.xy - uLight.xy;
    float reach = (1.0 - smoothstep(0.0, 1.7, length(away))) * (1.0 - smoothstep(0.0, 4.0, abs(p.z - uLight.z)));
    p.xy += normalize(away + 1e-4) * reach * 0.55;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uSize * aSeed.z * uPixelRatio / depth;

    float dl = distance(p, uLight);
    float dn = distance(p, uNeon);
    vGlow = 1.0 / (1.0 + dl * dl * 1.1) + 0.6 / (1.0 + dn * dn * 0.12) + uBeat * 0.3;

    float edge = abs(p.y) / (h * 0.5);
    vAlpha = (1.0 - smoothstep(15.0, 24.0, depth))  // uzakta sise karışır
           * smoothstep(0.9, 2.4, depth)             // objektife çarpanlar söner
           * (1.0 - smoothstep(0.82, 1.0, edge))     // dönüş noktası görünmez
           * uIntro;
    vEmber = aSeed.w;
  }
`;

const particleFragment = /* glsl */ `
  uniform vec3 uRed;
  varying float vGlow;
  varying float vAlpha;
  varying float vEmber;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = 1.0 - smoothstep(0.0, 0.5, d);
    disc *= disc;

    vec3 ash = vec3(0.62, 0.58, 0.56) * 0.32;
    vec3 base = mix(ash, uRed * 0.75, vEmber);
    vec3 col = base + uRed * vGlow * 1.6;
    // Işığın tam dibindekiler beyaza yakın bir çekirdekle yanar.
    col += vec3(1.0, 0.5, 0.45) * pow(min(vGlow, 1.0), 4.0) * 0.55;

    gl_FragColor = vec4(col, disc * vAlpha);
  }
`;

type Uniforms = Record<string, THREE.IUniform>;

/** Ekranı her derinlikte eşit dolduracak şekilde kesik piramit (frustum) içine dağıt. */
function scatter(count: number, aspect: number) {
  const rand = mulberry32(1987);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    // Uzak katmanlara daha çok partikül: derinlik hissi.
    const z = NEAR_Z + (FAR_Z - NEAR_Z) * Math.sqrt(rand());
    const halfH = (SPAN * (CAMERA_Z - z)) / 1.1;
    const halfW = halfH * Math.max(aspect, 0.75);
    positions[i * 3] = (rand() * 2 - 1) * halfW;
    positions[i * 3 + 1] = (rand() * 2 - 1) * halfH;
    positions[i * 3 + 2] = z;

    seeds[i * 4] = rand();
    seeds[i * 4 + 1] = 0.35 + rand() * 0.9;
    // Çoğu toz zerresi kadar küçük, birkaçı objektifin önünde büyük bokeh.
    seeds[i * 4 + 2] = 0.55 + Math.pow(rand(), 4) * 3.4;
    seeds[i * 4 + 3] = rand() < 0.2 ? 1 : 0;
  }
  return { positions, seeds };
}

/**
 * Atmosfer: zifiri karanlıkta ağır ağır süzülen kül ve köz partikülleri, arkada kıvrılan
 * kızıl sis. İmleci kırmızı bir neon ışık takip eder; yaklaştığı partiküller kızarıp kenara
 * açılır, sis o noktada aydınlanır. Nabız bölümünde sis ve partiküller kalp atışıyla atar.
 */
export function Atmosphere({ count, aspect, accent, motion }: { count: number; aspect: number; accent: THREE.Vector3; motion: number }) {
  const particles = useRef<THREE.ShaderMaterial>(null);
  const fog = useRef<THREE.ShaderMaterial>(null);
  const clock = useRef(0);
  const follow = useRef(0);
  const pulse = useRef(0);
  const light = useRef(new THREE.Vector3(0, 0, LIGHT_Z));
  const projected = useRef(new THREE.Vector3());

  const field = useMemo(() => scatter(count, aspect), [count, aspect]);

  const particleUniforms = useMemo<Uniforms>(
    () => ({
      uTime: { value: 0 },
      uLight: { value: new THREE.Vector3(0, 0, LIGHT_Z) },
      uNeon: { value: new THREE.Vector3(-4.5, -3.2, -5) },
      uSize: { value: 44 },
      uPixelRatio: { value: 1 },
      uSpan: { value: SPAN * 2 },
      uIntro: { value: 0 },
      uBeat: { value: 0 },
      uRed: { value: accent },
    }),
    [accent],
  );

  const fogUniforms = useMemo<Uniforms>(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: aspect },
      uLight: { value: new THREE.Vector2(0.5, 0.5) },
      uRed: { value: accent },
      uIntro: { value: 0 },
      uBeat: { value: 0 },
    }),
    [accent, aspect],
  );

  useFrame((state, delta) => {
    const p = particles.current;
    const f = fog.current;
    if (!p || !f) return;

    // Sekme arka plandan dönünce büyük sıçrama olmasın.
    const dt = Math.min(delta, 1 / 20);
    clock.current += dt * motion;
    const t = clock.current;
    const { camera, size, viewport } = state;

    // Işık hedefi: imleç hareket ediyorsa onu, birkaç saniye durduysa sisin içinde yavaş bir yörüngeyi izler.
    const halfH = Math.tan(degToRad(FOV / 2)) * (CAMERA_Z - LIGHT_Z);
    const halfW = halfH * (size.width / size.height);
    const active = performance.now() - pointer.lastMove < 3500 ? 1 : 0;
    follow.current = damp(follow.current, active, 1.6, dt);
    const idleT = performance.now() / 1000;
    const tx = THREE.MathUtils.lerp(Math.sin(idleT * 0.21) * halfW * 0.55, pointer.x * halfW, follow.current);
    const ty = THREE.MathUtils.lerp(Math.sin(idleT * 0.29 + 1.2) * halfH * 0.45, pointer.y * halfH, follow.current);
    light.current.x = damp(light.current.x, tx, 2.4, dt);
    light.current.y = damp(light.current.y, ty, 2.4, dt);

    const intro = damp(p.uniforms.uIntro.value as number, rig.intro, 1.4, dt);
    pulse.current = damp(pulse.current, rig.pulse, 4, dt);
    const heart = beat.kick * pulse.current;

    p.uniforms.uTime.value = t;
    p.uniforms.uIntro.value = intro;
    p.uniforms.uBeat.value = heart;
    p.uniforms.uPixelRatio.value = viewport.dpr;
    (p.uniforms.uLight.value as THREE.Vector3).copy(light.current);

    projected.current.copy(light.current).project(camera);
    (f.uniforms.uLight.value as THREE.Vector2).set(projected.current.x * 0.5 + 0.5, projected.current.y * 0.5 + 0.5);
    f.uniforms.uTime.value = t;
    f.uniforms.uIntro.value = intro;
    f.uniforms.uBeat.value = heart;
    f.uniforms.uAspect.value = size.width / size.height;
  });

  return (
    <>
      {/* Sis her şeyin arkasında: derinlik testi yok, ilk çizilir. */}
      <mesh frustumCulled={false} renderOrder={-1}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={fog}
          vertexShader={fogVertex}
          fragmentShader={fogFragment}
          uniforms={fogUniforms}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[field.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[field.seeds, 4]} />
        </bufferGeometry>
        <shaderMaterial
          ref={particles}
          vertexShader={particleVertex}
          fragmentShader={particleFragment}
          uniforms={particleUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
