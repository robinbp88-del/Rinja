import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bounds,
  Center,
  ContactShadows,
  Environment,
  Float,
  PresentationControls,
  useGLTF,
} from "@react-three/drei";
import type { Group } from "three";
import type { RinjaMood } from "./RinjaMascot";

type Props = {
  mood: RinjaMood;
  size: number;
};

const MODEL_URL = "/rinja.glb";

function moodMotion(mood: RinjaMood, t: number) {
  switch (mood) {
    case "alert":
      return {
        y: Math.sin(t * 3.8) * 0.03,
        rotY: Math.sin(t * 2.6) * 0.12,
        rotX: Math.sin(t * 4.2) * 0.04,
      };
    case "curious":
      return {
        y: Math.sin(t * 1.3) * 0.045,
        rotY: Math.sin(t * 0.95) * 0.28,
        rotX: Math.sin(t * 0.7) * 0.06,
      };
    case "happy":
    case "excited":
      return {
        y: Math.abs(Math.sin(t * 2.4)) * 0.08,
        rotY: Math.sin(t * 1.8) * 0.16,
        rotX: Math.sin(t * 2.6) * 0.05,
      };
    case "sleepy":
      return {
        y: Math.sin(t * 0.6) * 0.015,
        rotY: Math.sin(t * 0.35) * 0.06,
        rotX: 0.1 + Math.sin(t * 0.45) * 0.02,
      };
    case "thinking":
      return {
        y: Math.sin(t * 1.0) * 0.03,
        rotY: -0.2 + Math.sin(t * 0.55) * 0.08,
        rotX: 0.06,
      };
    default:
      return {
        y: Math.sin(t * 1.15) * 0.04,
        rotY: Math.sin(t * 0.85) * 0.18,
        rotX: Math.sin(t * 0.65) * 0.04,
      };
  }
}

function RinjaModel({ mood }: { mood: RinjaMood }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const m = moodMotion(mood, clock.getElapsedTime());
    group.current.position.y = m.y;
    group.current.rotation.y = m.rotY;
    group.current.rotation.x = m.rotX;
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={cloned} />
      </Center>
    </group>
  );
}



export default function RinjaCanvas({ mood, size }: Props) {
  return (
    <div style={{ width: size, height: size }} className="relative">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.2, 2.6], fov: 30, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[2.5, 3.5, 2]}
          intensity={1.4}
          color="#efe6ff"
        />
        <pointLight position={[-2, 1.2, 1.5]} intensity={1.0} color="#a855f7" />
        <spotLight
          position={[0, 2.8, 2.2]}
          angle={0.4}
          penumbra={0.7}
          intensity={1.1}
          color="#c4b5fd"
        />

        <Suspense fallback={null}>
          <PresentationControls
            global={false}
            cursor
            snap
            speed={1.1}
            zoom={1}
            polar={[-0.2, 0.3]}
            azimuth={[-0.65, 0.65]}
          >
            <Float
              speed={mood === "sleepy" ? 0.7 : 1.4}
              rotationIntensity={0.12}
              floatIntensity={mood === "alert" ? 1.0 : 0.55}
            >
              {/* Bounds auto-frames Meshy models that vary in scale */}
              <Bounds fit clip observe margin={1.25}>
                <RinjaModel mood={mood} />
              </Bounds>
            </Float>
          </PresentationControls>

          <ContactShadows
            position={[0, -0.95, 0]}
            opacity={0.4}
            scale={3.4}
            blur={2.8}
            far={2.8}
            color="#241035"
          />
          <Environment preset="city" environmentIntensity={0.28} />
        </Suspense>
      </Canvas>
    </div>
  );
}
