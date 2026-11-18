import { useEffect, useRef } from 'react';

// Vanta NET effect — floating particles connected by animated lines
// Loads THREE r121 (known stable with Vanta) then vanta.net
declare global {
  interface Window {
    THREE: Record<string, unknown>;
    VANTA: {
      NET: (opts: Record<string, unknown>) => { destroy: () => void };
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      // If already loaded just resolve
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = false; // keep load order deterministic
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
        // THREE r121 — well-tested with all Vanta effects
        await loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js',
        );
        // Small pause so THREE fully registers on window
        await new Promise<void>((r) => setTimeout(r, 50));

        await loadScript(
          'https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.net.min.js',
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
          color:           0x00d4ff,  // bright cyan nodes — matches app accent
          backgroundColor: 0x09090b, // zinc-950
          points:          14,
          maxDistance:     22,
          spacing:         18,
          showDots:        true,
        });
      } catch (err) {
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
