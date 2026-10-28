"use client";

import { Environment, Lightformer, PerformanceMonitor, Sparkles } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { rig } from "@/lib/sceneRig";
import { Dumbbell } from "./Dumbbell";

const VOID = "#050507";

/** Vurgu rengi tek kaynaktan gelir: globals.css → --color-neon */
function readNeon() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--color-neon").trim();
  return value || "#1fd6ff";
}

/**
 * GSAP ScrollTrigger → rig
 * Her bölüm kendi kanalını sürer. `scrub: true` değeri doğrudan scroll konumuna
 * bağlar; yumuşatma Dumbbell içinde damp() ile yapılır (Lenis kapalıyken de akıcı).
 */
function useScrollRig() {
  useGSAP(() => {
    // 01 · Hero → Bilgi: kaldırma. Eğri (önce çöküş, sonra itiş) Dumbbell'de.
    gsap.to(rig, {
      lift: 1,
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom 40%", scrub: true },
    });

    // 02 · Bilgi: kaldırma bitince başlar — plakalar ayrılır → süzülür → kilitlenir.
    gsap
      .timeline({
        scrollTrigger: { trigger: "#bilgi", start: "top 40%", end: "bottom 70%", scrub: true },
      })
      .to(rig, { explode: 1, ease: "power2.out", duration: 1 })
      .to(rig, { explode: 0, ease: "power3.in", duration: 1 }, "+=0.9");

    // 03 · Galeri: kenara ve derine çekil.
    gsap.to(rig, {
      drift: 1,
      ease: "power1.inOut",
      scrollTrigger: { trigger: "#galeri", start: "top 85%", end: "top 10%", scrub: true },
    });

    // 04 · Footer: merkeze in ve otur.
    gsap.to(rig, {
      settle: 1,
      ease: "power2.out",
      scrollTrigger: { trigger: "#iletisim", start: "top bottom", end: "bottom bottom", scrub: true },
    });
  });
}

export default function GymScene3D() {
  useScrollRig();
  const [neon] = useState(readNeon);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, 1.75));

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 8], fov: 35, near: 0.1, far: 40 }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      // Canvas içeriğin arkasında; imleci yine de takip etsin diye olayları body'den dinle.
      eventSource={document.body}
      eventPrefix="client"
      fallback={null}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <color attach="background" args={[VOID]} />
      <fog attach="fog" args={[VOID, 7.5, 15]} />

      {/* Sinematik ışık: sıcak beyaz anahtar ışık + arkadan neon ve soğuk mavi kontur */}
      <ambientLight intensity={0.05} />
      <spotLight position={[3.5, 6, 5]} angle={0.5} penumbra={1} intensity={120} color="#f3efe8" />
      <pointLight position={[-4, 1.5, -2.5]} intensity={40} color={neon} />
      <pointLight position={[4.5, -2.5, -2]} intensity={24} color="#4f6bff" />

      {/* Krom yüzeylerin yansıttığı stüdyo ortamı — HDR dosyası indirmeden, prosedürel */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, 3]} scale={[9, 1.4, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-6, 0.5, 2]} scale={[1, 7, 1]} />
        <Lightformer form="rect" intensity={6} color={neon} position={[6, 0, -1]} scale={[0.5, 7, 1]} />
        <Lightformer form="ring" intensity={2.5} position={[1.5, 1.5, 7]} scale={1.4} />
      </Environment>

      <Dumbbell neon={neon} />

      {/* Yerçekimsiz ortamda asılı kalan tebeşir tozu */}
      <Sparkles count={70} scale={[14, 8, 6]} size={1.6} speed={0.18} opacity={0.35} color="#d8f6ff" noise={0.6} />
      <Sparkles count={18} scale={[10, 6, 4]} size={2.6} speed={0.25} opacity={0.55} color={neon} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.15} intensity={1.1} radius={0.72} />
        <Vignette offset={0.22} darkness={0.75} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
