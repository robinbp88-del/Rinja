import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";

type Variant = "idle" | "hero" | "guard" | "binoculars" | "laptop" | "notify" | "secure" | "relax";

export type RinjaMood =
  "neutral" | "happy" | "curious" | "alert" | "sleepy" | "excited" | "thinking";

type Props = {
  variant?: Variant;
  mood?: RinjaMood;
  size?: number;
  className?: string;
  priority?: boolean;
  /** Force PNG/WebP poses instead of GLB. */
  flat?: boolean;
};

const DEFAULT_MOOD: Record<Variant, RinjaMood> = {
  idle: "neutral",
  hero: "neutral",
  guard: "neutral",
  binoculars: "neutral",
  laptop: "neutral",
  notify: "neutral",
  secure: "happy",
  relax: "sleepy",
};

const MOOD_GLOW: Record<RinjaMood, string> = {
  neutral: "radial-gradient(circle at 50% 55%, oklch(0.58 0.24 295 / 0.4) 0%, transparent 70%)",
  happy: "radial-gradient(circle at 50% 55%, oklch(0.72 0.18 145 / 0.35) 0%, transparent 70%)",
  curious: "radial-gradient(circle at 50% 55%, oklch(0.62 0.22 250 / 0.35) 0%, transparent 70%)",
  alert: "radial-gradient(circle at 50% 55%, oklch(0.68 0.22 45 / 0.4) 0%, transparent 70%)",
  sleepy: "radial-gradient(circle at 50% 55%, oklch(0.45 0.08 285 / 0.3) 0%, transparent 70%)",
  excited: "radial-gradient(circle at 50% 55%, oklch(0.65 0.28 320 / 0.4) 0%, transparent 70%)",
  thinking: "radial-gradient(circle at 50% 55%, oklch(0.55 0.2 280 / 0.35) 0%, transparent 70%)",
};

/** Soft edge so baked square backgrounds don't read as a card. */
const SOFT_MASK = "radial-gradient(ellipse 72% 78% at 50% 46%, #000 38%, transparent 72%)";

const RinjaCanvas = lazy(() => import("./RinjaCanvas"));

/** Lazy asset map — only the requested pose is fetched. */
const VARIANT_LOADERS: Record<Variant, () => Promise<{ default: string }>> = {
  idle: () => import("../assets/rinja.webp"),
  hero: () => import("../assets/rinja.webp"),
  guard: () => import("../assets/rinja-guard.webp"),
  binoculars: () => import("../assets/binoculars.webp"),
  laptop: () => import("../assets/rinja-laptop.webp"),
  notify: () => import("../assets/rinja-notify.webp"),
  secure: () => import("../assets/rinja-secure.webp"),
  relax: () => import("../assets/rinja-relax.webp"),
};

function FallbackImage({
  variant,
  size,
  priority,
  mood,
}: {
  variant: Variant;
  size: number;
  priority: boolean;
  mood: RinjaMood;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void VARIANT_LOADERS[variant]().then((mod) => {
      if (!cancelled) setSrc(mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [variant]);

  return (
    <div
      className="relative inline-flex items-center justify-center overflow-visible"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-[-8%] rounded-full"
        style={{
          background: MOOD_GLOW[mood],
          filter: "blur(14px)",
          opacity: 0.85,
        }}
      />
      {src ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          {...(priority ? {} : { loading: "lazy" as const })}
          className="relative select-none object-contain"
          style={{
            width: size,
            height: size,
            transformOrigin: "50% 70%",
            WebkitMaskImage: SOFT_MASK,
            maskImage: SOFT_MASK,
            filter:
              mood === "sleepy"
                ? "brightness(0.94) saturate(0.9)"
                : "drop-shadow(0 18px 28px oklch(0.2 0.1 295 / 0.4))",
          }}
          draggable={false}
        />
      ) : (
        <div
          className="relative rounded-full bg-muted/30"
          style={{ width: size * 0.72, height: size * 0.72 }}
        />
      )}
    </div>
  );
}

class CanvasErrorCatch extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * Prefers flat WebP poses (no WebGL square viewport). Soft mask + static pose
 * so Rinja reads as a character in the room, not a boxed widget.
 */
export function RinjaMascot({
  variant = "idle",
  mood,
  size = 176,
  className = "",
  priority = false,
  flat = true,
}: Props) {
  const resolvedMood = mood ?? DEFAULT_MOOD[variant];
  const [mounted, setMounted] = useState(false);
  const [failed, setFailed] = useState(false);

  const preferFlat =
    flat ||
    variant === "binoculars" ||
    variant === "laptop" ||
    variant === "notify" ||
    variant === "relax" ||
    variant === "secure" ||
    variant === "guard" ||
    variant === "hero" ||
    variant === "idle";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || failed || preferFlat) {
    return (
      <div className={className}>
        <FallbackImage variant={variant} size={size} priority={priority} mood={resolvedMood} />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-visible ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-[-10%] rounded-full"
        style={{
          background: MOOD_GLOW[resolvedMood],
          filter: "blur(16px)",
          opacity: 0.8,
        }}
      />
      <CanvasErrorCatch onError={() => setFailed(true)}>
        <Suspense
          fallback={
            <FallbackImage variant={variant} size={size} priority={priority} mood={resolvedMood} />
          }
        >
          <RinjaCanvas size={size} mood={resolvedMood} />
        </Suspense>
      </CanvasErrorCatch>
    </div>
  );
}
