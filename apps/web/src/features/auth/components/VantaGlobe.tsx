import { useEffect, useRef } from 'react';

// Vanta NET effect — moving particles connected by animated lines
// Much livelier than GLOBE: nodes float + connect dynamically
declare global {
  interface Window {
    THREE: unknown;
    VANTA: {
      NET: (opts: Record<string, unknown>) => { destroy: () => void };
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default function VantaGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef    = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Load THREE first, then Vanta NET
        await loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js',
        );
        await loadScript(
          'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js',
        );

        if (cancelled || !containerRef.current || !window.VANTA?.NET) return;

        effectRef.current = window.VANTA.NET({
          el:              containerRef.current,
          THREE:           window.THREE,
          mouseControls:   true,
          touchControls:   true,
          gyroControls:    false,
          minHeight:       200,
          minWidth:        200,
          scale:           1.0,
          scaleMobile:     1.0,
          // Bright cyan nodes on dark background — matches app accent
          color:           0x00d4ff,   // cyan node colour
          backgroundColor: 0x09090b,  // zinc-950 — matches app bg
          points:          14,         // number of floating nodes
          maxDistance:     22,         // connection draw distance
          spacing:         18,         // spread between nodes
          showDots:        true,       // render dots at node positions
        });
      } catch (err) {
        // Silently fail — login form still works without the animation
        console.warn('[VantaNet] Could not load animation:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className='fixed inset-0 -z-10'
      aria-hidden='true'
    />
  );
}
