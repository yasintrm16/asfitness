"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";

// three.js ana paketten ayrılır ve yalnızca tarayıcıda yüklenir; metin bu sırada çoktan boyanmış olur.
const GymScene = dynamic(() => import("./GymScene"), { ssr: false });

/** WebGL bir sebeple çökerse sayfa ayakta kalsın: sahne sessizce kaybolur, siyah zemin kalır. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Ana sayfanın sabit 3D katmanı: içerik bunun üzerinde akar, sahne scroll'a göre oynar.
 * İzlenen bölüm (watch: 3D'nin arkada göründüğü bölümleri saran kutu) ekrandan çıkınca çizim durur.
 */
export function SceneCanvas({ watch }: { watch: string }) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const target = document.getElementById(watch);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [watch]);

  return (
    // lvh: mobilde adres çubuğu açılıp kapanırken canvas yeniden boyutlanmasın.
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh">
      <SceneBoundary>
        <GymScene active={active} />
      </SceneBoundary>
    </div>
  );
}
