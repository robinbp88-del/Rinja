import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import rinjaHero from "../assets/rinja.png";
import rinjaGuard from "../assets/rinja-guard.png";
import rinjaBinoculars from "../assets/binoculars.png";
import rinjaLaptop from "../assets/rinja-laptop.png";
import rinjaNotify from "../assets/rinja-notify.png";
import rinjaSecure from "../assets/rinja-secure.png";
import rinjaRelax from "../assets/rinja-relax.png";

type Variant =
  | "idle"
  | "hero"
  | "guard"
  | "binoculars"
  | "laptop"
  | "notify"
  | "secure"
  | "relax";

export type RinjaMood =
  | "neutral"
  | "happy"
  | "curious"
  | "alert"
  | "sleepy"
  | "excited"
  | "thinking";

type Props = {
  variant?: Variant;
  mood?: RinjaMood;
  size?: number;
  className?: string;
  priority?: boolean;
  /** Force PNG poses instead of GLB. */
  flat?: boolean;
};

const DEFAULT_MOOD: Record<Variant, RinjaMood> = {
  idle: "curious",
  hero: "curious",
  guard: "neutral",
  binoculars: "curious",
  laptop: "thinking",
  notify: "alert",
  secure: "happy",
  relax: "sleepy",
};

const MOOD_GLOW: Record<RinjaMood, string> = {
  neutral:
    "radial-gradient(circle at 50% 55%, oklch(0.58 0.24 295 / 0.55) 0%, transparent 65%)",
  happy:
    "radial-gradient(circle at 50% 55%, oklch(0.72 0.18 145 / 0.5) 0%, transparent 68%)",
  curious:
    "radial-gradient(circle at 50% 55%, oklch(0.62 0.22 250 / 0.55) 0%, transparent 65%)",
  alert:
    "radial-gradient(circle at 50% 55%, oklch(0.68 0.22 45 / 0.55) 0%, transparent 65%)",
  sleepy:
    "radial-gradient(circle at 50% 55%, oklch(0.45 0.08 285 / 0.45) 0%, transparent 65%)",
  excited:
    "radial-gradient(circle at 50% 55%, oklch(0.65 0.28 320 / 0.65) 0%, transparent 68%)",
  thinking:
    "radial-gradient(circle at 50% 55%, oklch(0.55 0.2 280 / 0.55) 0%, transparent 65%)",
};

const MOOD_ANIM: Record<RinjaMood, string> = {
  neutral: "rinja-float",
  happy: "rinja-happy",
  curious: "rinja-curious",
  alert: "rinja-alert",
  sleepy: "rinja-sleepy",
  excited: "rinja-excited",
  thinking: "rinja-thinking",
};

const RinjaCanvas = lazy(() => import("./RinjaCanvas"));

function assetFor(variant: Variant) {
  switch (variant) {
    case "guard":
      return rinjaGuard;
    case "binoculars":
      return rinjaBinoculars;
    case "laptop":
      return rinjaLaptop;
    case "notify":
      return rinjaNotify;
    case "secure":
      return rinjaSecure;
    case "relax":
      return rinjaRelax;
    default:
      return rinjaHero;
  }
}

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
  const [blink, setBlink] = useState(false);
  const [react, setReact] = useState(false);

  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 3200 + Math.random() * 2200);

    const reactTimer = setInterval(() => {
      if (mood === "sleepy") return;
      setReact(true);
      setTimeout(() => setReact(false), 900);
    }, 7000 + Math.random() * 4000);

    return () => {
      clearInterval(blinkTimer);
      clearInterval(reactTimer);
    };
  }, [mood]);

  const animName = useMemo(() => {
    if (react && mood === "excited") return "rinja-excited-pop";
    if (react && mood === "happy") return "rinja-wave";
    return MOOD_ANIM[mood];
  }, [react, mood]);

  const animDuration =
    mood === "sleepy" ? "4.8s" : mood === "alert" ? "1.8s" : "3.4s";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: MOOD_GLOW[mood],
          animation:
            mood === "sleepy"
              ? "rinja-glow-slow 5.5s ease-in-out infinite"
              : "rinja-glow 3.2s ease-in-out infinite, rinja-breathe 4.2s ease-in-out infinite",
          filter: "blur(5px)",
        }}
      />
      <img
        src={assetFor(variant)}
        alt=""
        width={size}
        height={size}
        {...(priority ? {} : { loading: "lazy" as const })}
        className="relative select-none object-contain"
        style={{
          width: size,
          height: size,
          transform: blink ? "scaleY(0.96)" : undefined,
          transition: "transform 80ms ease-out",
          animation: `${animName} ${animDuration} ease-in-out infinite`,
          transformOrigin: "50% 70%",
          filter:
            mood === "sleepy"
              ? "brightness(0.94) saturate(0.9)"
              : "drop-shadow(0 14px 24px oklch(0.25 0.12 295 / 0.45))",
        }}
        draggable={false}
      />
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
 * Uses remeshed GLB when available; PNG pose fallback per screen / on error.
 * Pose-specific PNGs still used for binoculars/laptop/notify/etc when flat,
 * or as loading fallback for 3D.
 */
export function RinjaMascot({
  variant = "idle",
  mood,
  size = 176,
  className = "",
  priority = false,
  flat = false,
}: Props) {
  const resolvedMood = mood ?? DEFAULT_MOOD[variant];
  const [mounted, setMounted] = useState(false);
  const [failed, setFailed] = useState(false);

  // Pose variants that should stay as 2D art (clearer for those actions)
  const preferFlat =
    flat ||
    variant === "binoculars" ||
    variant === "laptop" ||
    variant === "notify" ||
    variant === "relax" ||
    variant === "secure" ||
    variant === "guard";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || failed || preferFlat) {
    return (
      <div className={className}>
        <FallbackImage
          variant={variant}
          size={size}
          priority={priority}
          mood={resolvedMood}
        />
      </div>
    );
  }

  // 3D for hero/idle (welcome + login)
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: MOOD_GLOW[resolvedMood],
          filter: "blur(10px)",
          animation: "rinja-glow 3.2s ease-in-out infinite",
        }}
      />

      <Suspense
        fallback={
          <FallbackImage
            variant={variant}
            size={size}
            priority={priority}
            mood={resolvedMood}
          />
        }
      >
        <CanvasErrorCatch onError={() => setFailed(true)}>
          <RinjaCanvas mood={resolvedMood} size={size} />
        </CanvasErrorCatch>
      </Suspense>
    </div>
  );
}
