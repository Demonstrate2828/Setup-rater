import { useEffect, useState, useRef } from "react";

interface Petal {
  id: number;
  left: string;
  size: number;
  duration: string;
  delay: string;
  drift: string;
  spin: string;
}

function makePetals(): Petal[] {
  return Array.from({ length: 20 }).map((_, i) => ({
    id: i + Date.now(),
    left: `${Math.random() * 100}vw`,
    size: Math.random() * 10 + 8,
    duration: `${Math.random() * 10 + 10}s`,
    delay: `-${Math.random() * 20}s`,
    drift: `${Math.random() * 40 - 20}vw`,
    spin: `${Math.random() * 720 - 360}deg`,
  }));
}

function spawnVoxel(
  cx: number, cy: number,
  dx: number, dy: number,
  size: number, dur: number, delay: number,
  z = 9000,
) {
  const p = document.createElement("div");
  p.style.cssText = `
    position:fixed;left:${cx}px;top:${cy}px;
    width:${size}px;height:${size}px;
    background:hsl(var(--primary));
    border-radius:0;image-rendering:pixelated;
    pointer-events:none;z-index:${z};
    will-change:transform,opacity;
  `;
  document.body.appendChild(p);
  p.animate(
    [
      { transform: `translate(-50%,-50%)`,                                                          opacity: 1, offset: 0   },
      { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`,                         opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`,                         opacity: 0, offset: 1   },
    ],
    { duration: dur, delay, easing: "cubic-bezier(0.12, 0.9, 0.25, 1)", fill: "forwards" }
  ).onfinish = () => p.remove();
}

function burst(containerEl: HTMLDivElement) {
  const petalEls = containerEl.querySelectorAll<HTMLElement>(".sakura-petal");

  petalEls.forEach((petal) => {
    const rect = petal.getBoundingClientRect();
    if (rect.width === 0) return;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    /* ── 1. Core flash ───────────────────────────────────────────── */
    const flash = document.createElement("div");
    flash.style.cssText = `
      position:fixed;left:${cx}px;top:${cy}px;
      width:6px;height:6px;
      background:hsl(var(--primary));
      border-radius:0;
      pointer-events:none;z-index:9003;
      box-shadow:0 0 8px 4px hsl(var(--primary)/0.8);
      will-change:transform,opacity;
    `;
    document.body.appendChild(flash);
    flash.animate(
      [
        { transform: "translate(-50%,-50%) scale(1)",  opacity: 1 },
        { transform: "translate(-50%,-50%) scale(3)",  opacity: 0 },
      ],
      { duration: 180, easing: "ease-out", fill: "forwards" }
    ).onfinish = () => flash.remove();

    /* ── 2. Shockwave rings ──────────────────────────────────────── */
    [0, 80].forEach((ringDelay) => {
      const ring = document.createElement("div");
      ring.style.cssText = `
        position:fixed;left:${cx}px;top:${cy}px;
        width:4px;height:4px;
        border:1px solid hsl(var(--primary)/0.9);
        border-radius:50%;
        pointer-events:none;z-index:8999;
        will-change:transform,opacity;
      `;
      document.body.appendChild(ring);
      ring.animate(
        [
          { transform: "translate(-50%,-50%) scale(1)",  opacity: 0.9 },
          { transform: "translate(-50%,-50%) scale(22)", opacity: 0   },
        ],
        { duration: 420, delay: ringDelay, easing: "cubic-bezier(0.1,0.4,0.2,1)", fill: "forwards" }
      ).onfinish = () => ring.remove();
    });

    /* ── 3. Inner voxel ring (2px, 64 particles, r≈20) ──────────── */
    const innerN = 64;
    for (let i = 0; i < innerN; i++) {
      const angle = (i / innerN) * Math.PI * 2;
      const r     = 20 + (Math.random() - 0.5) * 5;
      spawnVoxel(cx, cy, Math.cos(angle)*r, Math.sin(angle)*r, 2, 320 + Math.random()*100, i * 1.5);
    }

    /* ── 4. Outer voxel ring (1px, 96 particles, r≈44) ──────────── */
    const outerN = 96;
    for (let i = 0; i < outerN; i++) {
      const angle = (i / outerN) * Math.PI * 2 + 0.033;
      const r     = 44 + (Math.random() - 0.5) * 10;
      spawnVoxel(cx, cy, Math.cos(angle)*r, Math.sin(angle)*r, 1, 480 + Math.random()*180, 40 + i * 1.2);
    }

    /* ── 5. Gravity sparks (2px, shoot up, arc down) ────────────── */
    const sparkN = 20;
    for (let i = 0; i < sparkN; i++) {
      const angle  = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed  = 55 + Math.random() * 90;
      const vx     = Math.cos(angle) * speed;
      const vy     = Math.sin(angle) * speed;
      const grav   = 140 + Math.random() * 80;
      const dur    = 650 + Math.random() * 350;

      const p = document.createElement("div");
      p.style.cssText = `
        position:fixed;left:${cx}px;top:${cy}px;
        width:2px;height:2px;
        background:hsl(var(--primary));
        border-radius:0;image-rendering:pixelated;
        pointer-events:none;z-index:9001;
        will-change:transform,opacity;
      `;
      document.body.appendChild(p);

      const steps = 10;
      const frames = Array.from({ length: steps + 1 }, (_, s) => {
        const t  = s / steps;
        const px = vx * t;
        const py = vy * t + 0.5 * grav * t * t;
        const op = t < 0.55 ? 1 : Math.max(0, 1 - (t - 0.55) / 0.45);
        return { transform: `translate(calc(-50% + ${px}px),calc(-50% + ${py}px))`, opacity: op, offset: t };
      });

      p.animate(frames, { duration: dur, delay: Math.random() * 40, fill: "forwards" })
       .onfinish = () => p.remove();
    }
  });
}

export function SakuraPetals() {
  const [petals, setPetals] = useState<Petal[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPetals(makePetals());

    const onExplode = () => {
      if (containerRef.current) burst(containerRef.current);
      setPetals([]); // remove petals immediately after capturing positions
    };

    const onSpawn = () => setPetals(makePetals());

    window.addEventListener("sakura:explode", onExplode);
    window.addEventListener("sakura:spawn",   onSpawn);
    return () => {
      window.removeEventListener("sakura:explode", onExplode);
      window.removeEventListener("sakura:spawn",   onSpawn);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="sakura-container fixed inset-0 pointer-events-none overflow-hidden"
    >
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="sakura-petal"
          style={{
            left: petal.left,
            width:  `${petal.size}px`,
            height: `${petal.size}px`,
            animationDuration: petal.duration,
            animationDelay:    petal.delay,
            "--drift": petal.drift,
            "--spin":  petal.spin,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
