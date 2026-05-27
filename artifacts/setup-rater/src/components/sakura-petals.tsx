import { useEffect, useState, useRef } from "react";

interface Petal {
  id: number;
  left: string;
  size: number;
  duration: string;
  delay: string;
  drift: string;
  spin: string;
  sway: string;
  opacity: number;
}

function makePetals(): Petal[] {
  return Array.from({ length: 28 }).map((_, i) => ({
    id: i + Date.now(),
    left:     `${Math.random() * 100}vw`,
    size:     Math.random() * 12 + 6,
    duration: `${Math.random() * 12 + 11}s`,
    delay:    `-${Math.random() * 24}s`,
    drift:    `${Math.random() * 50 - 25}vw`,
    spin:     `${Math.random() * 900 - 450}deg`,
    sway:     `${Math.random() * 24 + 10}px`,
    opacity:  0.55 + Math.random() * 0.35,
  }));
}

function dropPetals(containerEl: HTMLDivElement, onDone: () => void) {
  const petalEls = containerEl.querySelectorAll<HTMLElement>(".sakura-petal");
  if (petalEls.length === 0) { onDone(); return; }

  let finished = 0;
  const total = petalEls.length;

  petalEls.forEach((petal, idx) => {
    const rect = petal.getBoundingClientRect();
    if (rect.width === 0) { finished++; if (finished === total) onDone(); return; }

    // Freeze petal at its exact current visual position
    petal.style.position   = "fixed";
    petal.style.left       = `${rect.left}px`;
    petal.style.top        = `${rect.top}px`;
    petal.style.animationName = "none";
    petal.style.transform  = "none";

    const distToBottom = window.innerHeight - rect.top + rect.height + 20;
    const windX        = (Math.random() - 0.5) * 80;   // gentle side drift
    const endSpin      = (Math.random() - 0.5) * 540;  // tumble as it falls
    const dur          = 420 + Math.random() * 220;
    const delay        = idx * 12 + Math.random() * 30; // stagger

    const steps = 10;
    const frames = Array.from({ length: steps + 1 }, (_, s) => {
      const t   = s / steps;
      // quadratic y (gravity), linear x drift
      const py  = distToBottom * t * t;
      const px  = windX * t;
      const rot = endSpin * t;
      const op  = t < 0.65 ? 1 : Math.max(0, 1 - (t - 0.65) / 0.35);
      return {
        transform: `translate(${px}px, ${py}px) rotate(${rot}deg)`,
        opacity: op,
        offset: t,
      };
    });

    petal.animate(frames, {
      duration: dur,
      delay,
      easing: "linear",
      fill: "forwards",
    }).onfinish = () => {
      finished++;
      if (finished === total) onDone();
    };
  });
}

export function SakuraPetals() {
  const [petals, setPetals] = useState<Petal[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPetals(makePetals());

    const onExplode = () => {
      if (containerRef.current) {
        dropPetals(containerRef.current, () => setPetals([]));
      } else {
        setPetals([]);
      }
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
            left:              petal.left,
            width:             `${petal.size}px`,
            height:            `${petal.size}px`,
            opacity:           petal.opacity,
            animationDuration: petal.duration,
            animationDelay:    petal.delay,
            "--drift":         petal.drift,
            "--spin":          petal.spin,
            "--sway":          petal.sway,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
