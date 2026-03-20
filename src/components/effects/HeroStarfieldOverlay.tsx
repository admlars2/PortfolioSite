import { useRef, useEffect, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  r: number;
  g: number;
  b: number;
  flareTimer: number;
  flareCooldown: number;
  flareDuration: number;
  flaring: boolean;
}

const STAR_TINTS = [
  { r: 255, g: 255, b: 255 },
  { r: 220, g: 230, b: 255 },
  { r: 200, g: 215, b: 255 },
  { r: 255, g: 248, b: 230 },
  { r: 255, g: 235, b: 210 },
  { r: 240, g: 245, b: 255 },
];

function randomCooldown() {
  return 5000 + Math.random() * 14000;
}

function randomFlareDuration() {
  return 1200 + Math.random() * 1000;
}

function createStars(width: number, height: number, count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const tint = STAR_TINTS[Math.floor(Math.random() * STAR_TINTS.length)];
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.4 + Math.random() * 1.8,
      baseAlpha: 0.15 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.9,
      r: tint.r,
      g: tint.g,
      b: tint.b,
      flareTimer: 0,
      flareCooldown: randomCooldown(),
      flareDuration: randomFlareDuration(),
      flaring: false,
    });
  }
  return stars;
}

interface HeroStarfieldOverlayProps {
  className?: string;
}

export default function HeroStarfieldOverlay({ className = '' }: HeroStarfieldOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const initStars = useCallback((width: number, height: number) => {
    const area = width * height;
    const density = Math.max(80, Math.min(300, Math.floor(area / 4000)));
    starsRef.current = createStars(width, height, density);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initStars(width, height);
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const animate = (time: number) => {
      const dt = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;

      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      for (const star of starsRef.current) {
        star.phase += star.speed * dt * 0.001;
        star.flareTimer += dt;

        const baseOscillation = Math.sin(star.phase) * 0.25;
        const normalAlpha = Math.max(0.05, star.baseAlpha + baseOscillation * star.baseAlpha);

        let alpha: number;
        let currentRadius = star.radius;

        if (star.flaring) {
          const t = star.flareTimer / star.flareDuration;
          if (t >= 1) {
            star.flaring = false;
            star.flareTimer = 0;
            star.flareCooldown = randomCooldown();
            alpha = normalAlpha;
          } else {
            const flareCurve = Math.sin(t * Math.PI);
            const flareAlpha = Math.min(1, star.baseAlpha + flareCurve * 0.55);
            alpha = normalAlpha + (flareAlpha - normalAlpha) * flareCurve;
            currentRadius = star.radius * (1 + flareCurve * 0.4);
          }
        } else {
          alpha = normalAlpha;
          if (star.flareTimer >= star.flareCooldown) {
            star.flaring = true;
            star.flareTimer = 0;
            star.flareDuration = randomFlareDuration();
          }
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.r}, ${star.g}, ${star.b}, ${alpha})`;
        ctx.fill();

        if (currentRadius > 1.2 && alpha > 0.35) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, currentRadius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${star.r}, ${star.g}, ${star.b}, ${alpha * 0.1})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [initStars]);

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
