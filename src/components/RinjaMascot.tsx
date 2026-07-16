import { useEffect, useState } from "react";
import rinja from "../assets/rinja.png";
import binoculars from "../assets/binoculars.png";
import laptop from "../assets/rinja-laptop.png";

type Variant = "idle" | "binoculars" | "laptop";

type Props = {
  variant?: Variant;
  size?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Rinja mascot with subtle "alive" animations.
 * - idle: gentle float, soft pulsing glow, occasional blink + wave
 * - binoculars: slow left/right pan while "searching"
 * - laptop: purple screen glow with occasional "look up" pause
 */
export function RinjaMascot({
  variant = "idle",
  size = 176,
  className = "",
  priority = false,
}: Props) {
  const [blink, setBlink] = useState(false);
  const [wave, setWave] = useState(false);
  const [lookUp, setLookUp] = useState(false);

  useEffect(() => {
    if (variant !== "idle") return;
    const b = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 4200 + Math.random() * 1800);
    const w = setInterval(
      () => {
        setWave(true);
        setTimeout(() => setWave(false), 1600);
      },
      20000 + Math.random() * 3000,
    );
    return () => {
      clearInterval(b);
      clearInterval(w);
    };
  }, [variant]);

  useEffect(() => {
    if (variant !== "laptop") return;
    const id = setInterval(() => {
      setLookUp(true);
      setTimeout(() => setLookUp(false), 900);
    }, 4500);
    return () => clearInterval(id);
  }, [variant]);

  const src = variant === "binoculars" ? binoculars : variant === "laptop" ? laptop : rinja;

  const animName =
    variant === "idle"
      ? wave
        ? "rinja-wave"
        : "rinja-float"
      : variant === "binoculars"
        ? "rinja-scan"
        : lookUp
          ? "rinja-lookup"
          : "rinja-type";

  const animDuration =
    variant === "idle"
      ? wave
        ? "1.6s"
        : "3.6s"
      : variant === "binoculars"
        ? "2.4s"
        : lookUp
          ? "0.9s"
          : "2.8s";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Soft pulsing glow */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, oklch(0.58 0.24 295 / 0.55) 0%, oklch(0.58 0.24 295 / 0) 65%)",
          animation: variant === "idle" ? "rinja-glow 3.2s ease-in-out infinite, rinja-breathe 4.2s ease-in-out infinite" : "rinja-glow 3.2s ease-in-out infinite",
          filter: "blur(4px)",
        }}
      />
      <img
        src={src}
        alt="Rinja"
        width={size}
        height={size}
        {...(priority ? {} : { loading: "lazy" as const })}
        className="relative select-none"
        style={{
          width: size,
          height: size,
          transform: blink ? "scaleY(0.92)" : undefined,
          transition: "transform 90ms ease-out",
          animation: `${animName} ${animDuration} ease-in-out infinite`,
          transformOrigin: "50% 60%",
        }}
        draggable={false}
      />
    </div>
  );
}
