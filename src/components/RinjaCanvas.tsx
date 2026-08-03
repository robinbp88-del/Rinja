import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bounds,
  Center,
  Environment,
  useGLTF,
} from "@react-three/drei";
import type { Group } from "three";
import type { RinjaMood } from "./RinjaMascot";

type Props = {
  mood: RinjaMood;
  size: number;
};

const MODEL_URL = "/rinja.glb";

function RinjaModel({ mood }: { mood: RinjaMood }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useFrame(() => {
    if (!group.current) return;
    // Almost still — tiny settle only for sleepy.
    group.current.position.y = mood === "sleepy" ? -0.02 : 0;
    group.current.rotation.y = 0.12;
    group.current.rotation.x = mood === "sleepy" ? 0.06 : 0.02;
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
    <div
      style={{ width: size, height: size }}
      className="relative overflow-visible bg-transparent"
    >
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

        <Suspense fallback={null}>
          <Bounds fit observe margin={1.15}>
            <RinjaModel mood={mood} />
          </Bounds>
          <Environment preset="city" environmentIntensity={0.28} />
        </Suspense>
      </Canvas>
    </div>
  );
}
