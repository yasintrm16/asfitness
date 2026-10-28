"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

// three.js (~600 KB) ana paketten ayrılır ve yalnızca tarayıcıda yüklenir;
// metin içerik bu sırada çoktan boyanmış olur.
const GymScene3D = dynamic(() => import("./GymScene3D"), { ssr: false });

/** WebGL bir sebeple çökerse sayfa ayakta kalsın: sahne sessizce kaybolur. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SceneCanvas() {
  return (
    // lvh: mobilde adres çubuğu açılıp kapanırken canvas yeniden boyutlanmasın.
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh">
      <SceneBoundary>
        <GymScene3D />
      </SceneBoundary>
    </div>
  );
}
