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

interface CanvasSize {
  width: number;
  height: number;
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

function getStarDensity(width: number, height: number) {
  const area = width * height;
  return Math.max(80, Math.min(300, Math.floor(area / 4000)));
}

function createStar(width: number, height: number): Star {
  const tint = STAR_TINTS[Math.floor(Math.random() * STAR_TINTS.length)];
  return {
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
  };
}

function createStars(width: number, height: number, count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push(createStar(width, height));
  }
  return stars;
}

function resizeStars(stars: Star[], previousSize: CanvasSize, width: number, height: number) {
  const scaleX = previousSize.width > 0 ? width / previousSize.width : 1;
  const scaleY = previousSize.height > 0 ? height / previousSize.height : 1;

  for (const star of stars) {
    star.x *= scaleX;
    star.y *= scaleY;
  }

  const targetCount = getStarDensity(width, height);
  if (stars.length < targetCount) {
    for (let i = stars.length; i < targetCount; i++) {
      stars.push(createStar(width, height));
    }
  } else if (stars.length > targetCount) {
    stars.length = targetCount;
  }
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], width: number, height: number, dt: number) {
  ctx.clearRect(0, 0, width, height);

  for (const star of stars) {
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
}

interface HeroStarfieldOverlayProps {
  className?: string;
}

export default function HeroStarfieldOverlay({ className = '' }: HeroStarfieldOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>(0);
  const resizeRafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0 });

  const initStars = useCallback((width: number, height: number) => {
    starsRef.current = createStars(width, height, getStarDensity(width, height));
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
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const backingWidth = Math.max(1, Math.round(width * dpr));
      const backingHeight = Math.max(1, Math.round(height * dpr));

      if (canvas.width !== backingWidth) {
        canvas.width = backingWidth;
      }
      if (canvas.height !== backingHeight) {
        canvas.height = backingHeight;
      }
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const previousSize = sizeRef.current;
      if (starsRef.current.length === 0) {
        initStars(width, height);
      } else if (previousSize.width !== width || previousSize.height !== height) {
        resizeStars(starsRef.current, previousSize, width, height);
      }
      sizeRef.current = { width, height };
      drawStars(ctx, starsRef.current, width, height, 0);
    };

    resize();

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRafRef.current);
      resizeRafRef.current = requestAnimationFrame(resize);
    });
    ro.observe(canvas.parentElement!);

    const animate = (time: number) => {
      const dt = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;

      const { width, height } = canvas.getBoundingClientRect();
      drawStars(ctx, starsRef.current, width, height, dt);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(resizeRafRef.current);
      ro.disconnect();
    };
  }, [initStars]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ touchAction: 'pan-y' }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
