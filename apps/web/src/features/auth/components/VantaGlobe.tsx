import { useEffect, useRef } from 'react';

// Pure-canvas animated particle network — no CDN, no dependencies.
// Cyan floating dots connected by lines that fade with distance.
// Reacts to mouse movement.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const COLOR_DOT  = '234, 88, 12';    // orange-600 in RGB
const COLOR_LINE = '234, 88, 12';
const BG         = '#09090b';       // zinc-950
const PARTICLE_COUNT = 70;
const MAX_DIST   = 160;
const SPEED      = 0.4;

export default function ParticleNet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let mouse = { x: -9999, y: -9999 };
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const init = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r:  Math.random() * 2 + 1.5,
      }));
    };

    const draw = () => {
      const isLight = document.documentElement.classList.contains('light');
      ctx.fillStyle = isLight ? '#f1f5f9' : BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw lines between close particles (and to mouse)
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];

        // Mouse attraction line
        const mdx = mouse.x - a.x;
        const mdy = mouse.y - a.y;
        const md  = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < MAX_DIST * 1.5) {
          const opacity = (1 - md / (MAX_DIST * 1.5)) * 0.5;
          ctx.strokeStyle = `rgba(${COLOR_LINE}, ${opacity})`;
          ctx.lineWidth   = 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        for (let j = i + 1; j < particles.length; j++) {
          const b   = particles[j];
          const dx  = b.x - a.x;
          const dy  = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const opacity = (1 - dist / MAX_DIST) * 0.6;
            ctx.strokeStyle = `rgba(${COLOR_LINE}, ${opacity})`;
            ctx.lineWidth   = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw dots
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR_DOT}, 0.85)`;
        ctx.fill();

        // Subtle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR_DOT}, 0.08)`;
        ctx.fill();

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouse = { x: -9999, y: -9999 };
    };

    resize();
    draw();

    window.addEventListener('resize',     resize);
    window.addEventListener('mousemove',  onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize',     resize);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 -z-10'
      aria-hidden='true'
    />
  );
}
