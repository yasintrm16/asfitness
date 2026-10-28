"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { beat, rig } from "@/lib/sceneRig";
import { CAMERA } from "./Atmosphere";

const { clamp, damp, degToRad } = THREE.MathUtils;

/** EKG şeridinin düzlemi: ekranın tam ortasından, sisin önünden geçer. */
const Z = -1.2;
const Y = -0.1;
const HEIGHT = 2.6;
/** Geniş ekranın kaç saniyelik ritmi gösterdiği (dar ekranda orantılı az): nabız yükseldikçe atışlar sıklaşır. */
const WINDOW = 2.6;
/** Çizgiyi yazan başlığın yatay konumu (0–1). Sağında ekran boş. */
const HEAD = 0.84;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform float uPhase;
  uniform float uBeats;
  uniform float uOpacity;
  uniform float uKick;
  uniform vec2 uSize;
  uniform vec3 uRed;
  varying vec2 vUv;

  const float AMP = 0.72;

  float g(float t, float c, float w) {
    float d = (t - c) / w;
    return exp(-d * d);
  }

  // Tek kalp atışı (t: 0–1): P dalgası, QRS kompleksi (R'nin tepesi t = 0.25), T dalgası.
  float ecg(float t) {
    t = fract(t);
    return 0.10 * g(t, 0.11, 0.03)
         - 0.14 * g(t, 0.215, 0.012)
         + 1.00 * g(t, 0.25, 0.016)
         - 0.30 * g(t, 0.285, 0.014)
         + 0.22 * g(t, 0.46, 0.045);
  }

  // x noktasında çizili değer: başlığın ne kadar gerisindeyse o kadar önceki atış.
  float trace(float x, float head) {
    return ecg(uPhase - (head - x) / head * uBeats) * AMP;
  }

  void main() {
    float head = ${HEAD.toFixed(2)} * uSize.x;
    float x = vUv.x * uSize.x;
    float y = (vUv.y - 0.5) * uSize.y;

    // Eğriye dik uzaklık (eğimle düzeltilmiş): sivri R dalgası da aynı kalınlıkta çizilir.
    float e = 0.002;
    float f = trace(x, head);
    float slope = (trace(x + e, head) - trace(x - e, head)) / (2.0 * e);
    float d = abs(y - f) / sqrt(1.0 + slope * slope);

    // Yazıldıkça sola kayar ve söner; başlığın sağı boş.
    float age = clamp((head - x) / head, 0.0, 1.0);
    float written = step(x, head) * pow(1.0 - age, 1.3);
    float boost = 1.0 + uKick * 0.8;

    float core = 1.0 - smoothstep(0.008, 0.03, d);
    float glow = exp(-d * 10.0) * 0.45 + exp(-d * 34.0) * 0.5;
    vec3 col = (uRed * (core * 1.4 + glow) + vec3(1.0, 0.72, 0.68) * core * 0.4) * written * boost;

    // Çizgiyi yazan parlak nokta.
    vec2 h = vec2(x - head, y - trace(head, head));
    float r2 = dot(h, h);
    col += (vec3(1.0, 0.85, 0.8) * exp(-r2 * 900.0) * 1.6 + uRed * exp(-sqrt(r2) * 7.0) * 0.6) * boost;

    // Silik monitör ızgarası (1 piksellik, kenarlara doğru kaybolur).
    vec2 cell = vec2(x, y) / 0.45;
    vec2 lines = abs(fract(cell + 0.5) - 0.5) / fwidth(cell);
    float grid = 1.0 - min(min(lines.x, lines.y), 1.0);
    grid *= (1.0 - smoothstep(0.15, 0.5, abs(vUv.x - 0.5))) * (1.0 - smoothstep(0.1, 0.45, abs(vUv.y - 0.5)));
    col += uRed * grid * 0.06;

    // Şeridin alt-üst kenarı görünmesin.
    col *= 1.0 - smoothstep(uSize.y * 0.32, uSize.y * 0.5, abs(y));
    gl_FragColor = vec4(col, uOpacity);
  }
`;

/**
 * Nabız monitörü: ekranı boydan boya geçen kızıl EKG çizgisi. Ritim Nabız bölümünden gelir
 * (beat.phase, rig.bpm); çizgi her R dalgasında parlar, bölüm görünürken belirir.
 */
export function Heartbeat({ accent }: { accent: THREE.Vector3 }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const sim = useRef({ presence: 0, beats: (WINDOW * 72) / 60 });

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uPhase: { value: 0 },
      uBeats: { value: (WINDOW * 72) / 60 },
      uOpacity: { value: 0 },
      uKick: { value: 0 },
      uSize: { value: new THREE.Vector2(1, HEIGHT) },
      uRed: { value: accent },
    }),
    [accent],
  );

  useFrame((state, delta) => {
    const m = mesh.current;
    const u = material.current?.uniforms;
    if (!m || !u) return;
    const dt = Math.min(delta, 1 / 20);
    const s = sim.current;
    s.presence = damp(s.presence, rig.pulse, 4, dt);
    m.visible = s.presence > 0.003;
    if (!m.visible) return;

    // Kamera imleçle kaydığında da kenar görünmesin diye görüş genişliğinden biraz geniş.
    const aspect = state.size.width / state.size.height;
    const halfH = Math.tan(degToRad(CAMERA.fov / 2)) * (CAMERA.z - Z);
    const width = halfH * 2 * aspect * 1.1;
    m.scale.set(width, HEIGHT, 1);
    (u.uSize.value as THREE.Vector2).set(width, HEIGHT);

    s.beats = damp(s.beats, (WINDOW * clamp(aspect / 1.6, 0.45, 1.2) * rig.bpm) / 60, 3, dt);
    u.uBeats.value = s.beats;
    u.uPhase.value = beat.phase;
    u.uKick.value = beat.kick;
    u.uOpacity.value = s.presence;
  });

  return (
    <mesh ref={mesh} position={[0, Y, Z]} visible={false} frustumCulled={false} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
