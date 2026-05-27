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

function burst(containerEl: HTMLDivElement) {
  const petalEls = containerEl.querySelectorAll<HTMLElement>(".sakura-petal");

  petalEls.forEach((petal) => {
    const rect = petal.getBoundingClientRect();
    if (rect.width === 0) return;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const count = 40 + Math.floor(Math.random() * 20);
    const radius = 28 + Math.random() * 16;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r     = radius + (Math.random() - 0.5) * 8;
      const dx    = Math.cos(angle) * r;
      const dy    = Math.sin(angle) * r;
      const dur   = 350 + Math.random() * 200;
      const delay = Math.random() * 40;

      const p = document.createElement("div");
      p.style.cssText = `
        position:fixed;
        left:${cx}px;top:${cy}px;
        width:2px;height:2px;
        background:hsl(var(--primary));
        border-radius:0;
        pointer-events:none;
        z-index:9000;
        image-rendering:pixelated;
        will-change:transform,opacity;
      `;
      document.body.appendChild(p);

      p.animate(
        [
          { transform: `translate(-50%,-50%)`, opacity: 1, offset: 0 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, opacity: 1, offset: 0.6 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, opacity: 0, offset: 1 },
        ],
        {
          duration: dur,
          delay,
          easing: "cubic-bezier(0.2, 0.9, 0.4, 1)",
          fill: "forwards",
        }
      ).onfinish = () => p.remove();
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
