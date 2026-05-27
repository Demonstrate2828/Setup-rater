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

function dropPetals(containerEl: HTMLDivElement, onDone: () => void) {
  const petalEls = containerEl.querySelectorAll<HTMLElement>(".sakura-petal");
  if (petalEls.length === 0) { onDone(); return; }

  let finished = 0;
  const total = petalEls.length;

  petalEls.forEach((petal) => {
    const rect = petal.getBoundingClientRect();

    // Pin petal at its exact current screen position, kill the CSS float animation
    petal.style.position = "fixed";
    petal.style.left = `${rect.left}px`;
    petal.style.top = `${rect.top}px`;
    petal.style.animationName = "none";
    petal.style.transform = "none";

    const distToBottom = window.innerHeight - rect.top + rect.height + 10;
    const dur = 320 + Math.random() * 160;

    petal.animate(
      [
        { transform: "translateY(0px)",              opacity: 1 },
        { transform: `translateY(${distToBottom}px)`, opacity: 1, offset: 0.82 },
        { transform: `translateY(${distToBottom}px)`, opacity: 0 },
      ],
      { duration: dur, easing: "cubic-bezier(0.55, 0, 1, 1)", fill: "forwards" }
    ).onfinish = () => {
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
