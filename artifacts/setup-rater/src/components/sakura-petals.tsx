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

function dropPetals(containerEl: HTMLDivElement) {
  const petalEls = containerEl.querySelectorAll<HTMLElement>(".sakura-petal");

  petalEls.forEach((petal) => {
    const rect = petal.getBoundingClientRect();
    if (rect.width === 0) return;

    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const distToBottom = window.innerHeight - startY + rect.height;

    const clone = document.createElement("div");
    clone.style.cssText = `
      position:fixed;
      left:${startX}px;
      top:${startY}px;
      width:${rect.width}px;
      height:${rect.height}px;
      background:hsl(var(--primary));
      border-radius:${petal.style.borderRadius || "100% 0 100% 0"};
      pointer-events:none;
      z-index:9000;
      will-change:transform,opacity;
    `;
    document.body.appendChild(clone);

    const dur = 280 + Math.random() * 120;

    clone.animate(
      [
        { transform: `translate(-50%,-50%) translateY(0px)`,              opacity: 1 },
        { transform: `translate(-50%,-50%) translateY(${distToBottom}px)`, opacity: 1, offset: 0.78 },
        { transform: `translate(-50%,-50%) translateY(${distToBottom}px)`, opacity: 0 },
      ],
      { duration: dur, easing: "cubic-bezier(0.55, 0, 1, 1)", fill: "forwards" }
    ).onfinish = () => clone.remove();
  });
}

export function SakuraPetals() {
  const [petals, setPetals] = useState<Petal[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPetals(makePetals());

    const onExplode = () => {
      if (containerRef.current) dropPetals(containerRef.current);
      setPetals([]);
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
