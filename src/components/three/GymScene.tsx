"use client";

import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { pointer } from "@/lib/sceneRig";
import { Atmosphere, CAMERA, readAccent } from "./Atmosphere";
import { Barbell } from "./Barbell";
import { Gear } from "./Gear";
import { Heartbeat } from "./Heartbeat";

const { damp } = THREE.MathUtils;

/** Kamera imlece hafifçe kayar: bar, plakalar ve sis arasında derinlik paralaksı. */
function CameraRig() {
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const camera = state.camera;
    camera.position.x = damp(camera.position.x, pointer.x * 0.35, 2, dt);
    camera.position.y = damp(camera.position.y, 0.1 + pointer.y * 0.22, 2, dt);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/**
 * Ana sayfanın 3D sahnesi: kızıl sis ve partiküllerin içinde "AS FITNESS" plakalı Olimpik bar,
 * köşelerde süzülen kettlebell, dambıl ve lastik, Nabız bölümünde ekranı kesen EKG çizgisi.
 * Sinematik ışık: üstten soğuk beyaz spot, arkadan kan kırmızısı kontur; krom yansımaları HDR
 * dosyası indirmeden prosedürel stüdyo ortamından gelir. Uzaktaki parçalar siyah sise gömülür.
 */
export default function GymScene({ active }: { active: boolean }) {
  const [accent] = useState(readAccent);
  const [accentHex] = useState(
    () => getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "#cc0000",
  );
  const [aspect] = useState(() => window.innerWidth / window.innerHeight);
  const [small] = useState(() => window.innerWidth < 768);
  const [motion] = useState(() => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.15 : 1));
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, 1.6));

  // İmleç (ve dokunmatikte parmak) tüm sayfadan dinlenir: canvas içeriğin arkasında.
  useEffect(() => {
    const move = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      pointer.lastMove = performance.now();
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.1, CAMERA.z], fov: CAMERA.fov, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false }}
      // Canvas metnin arkasında; plakalar yine de imleci hissetsin diye olaylar body'den dinlenir.
      eventSource={document.body}
      eventPrefix="client"
      fallback={null}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 13, 30]} />
      <CameraRig />

      <ambientLight intensity={0.12} />
      <spotLight position={[-3, 7, 6]} angle={0.55} penumbra={1} intensity={150} color="#f2f2f2" />
      <pointLight position={[5, 1.5, -2]} intensity={60} color={accentHex} />
      <pointLight position={[-6, -0.5, -4]} intensity={55} color={accentHex} />
      <pointLight position={[0, -3, 4]} intensity={8} color="#ffffff" />

      <Environment resolution={small ? 128 : 256} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[0, 5, 2]} scale={[10, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 1, 1]} scale={[1, 6, 1]} />
        <Lightformer form="rect" intensity={6} color={accentHex} position={[6, 0, -2]} scale={[0.6, 7, 1]} />
        <Lightformer form="ring" intensity={2} position={[2, 2, 8]} scale={1.5} />
      </Environment>

      <Atmosphere count={small ? 800 : 1700} aspect={aspect} accent={accent} motion={motion} />
      <Heartbeat accent={accent} />
      <Barbell motion={motion} />
      <Gear motion={motion} />
    </Canvas>
  );
}
