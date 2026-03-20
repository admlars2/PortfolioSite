import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  OrbitControls,
} from '@react-three/drei';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { useTheme } from '@/contexts/ThemeContext';

import earthModelUrl from '@/assets/models/low_poly_planet_earth.glb?url';

interface HeroModelProps {
  modelPath?: string | null;
}

interface HeroBackgroundModelProps {
  className?: string;
  modelPath?: string | null;
}

interface LoadedModelProps {
  url: string;
  onLoaded: () => void;
  onError: (message: string) => void;
}

function LoadedModel({ url, onLoaded, onError }: LoadedModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let active = true;
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf: GLTF) => {
        if (!active) return;

        const scene = gltf.scene.clone(true);

        scene.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // Some GLBs end up with incorrect bounds/culling; avoid popping/disappearing.
            mesh.frustumCulled = false;
            const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
            geometry?.computeBoundingBox?.();
            geometry?.computeBoundingSphere?.();

            const material = mesh.material as THREE.Material | THREE.Material[];
            if (Array.isArray(material)) {
              material.forEach((mat) => {
                mat.side = THREE.FrontSide;
              });
            } else if (material) {
              material.side = THREE.FrontSide;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(scene);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        scene.position.sub(center);
        const maxAxis = Math.max(size.x, size.y, size.z);
        if (maxAxis > 0) {
          const scale = 2.6 / maxAxis;
          scene.scale.setScalar(scale);
        }

        const group = groupRef.current;
        if (group) {
          group.clear();
          group.add(scene);
        }

        onLoaded();
      },
      undefined,
      (error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Failed to load 3D model.';
        onError(message);
      }
    );

    return () => {
      active = false;
      groupRef.current?.clear();
    };
  }, [onError, onLoaded, url]);

  return <group ref={groupRef} />;
}

function FallbackGlobe({ theme }: { theme: 'light' | 'dark' }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.y += delta * 0.35;
    mesh.rotation.x += delta * 0.05;
  });

  const color = theme === 'dark' ? '#60a5fa' : '#3C6E71';

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <icosahedronGeometry args={[1.25, 1]} />
      <meshStandardMaterial color={color} flatShading roughness={0.85} metalness={0.1} />
    </mesh>
  );
}

export function HeroBackgroundModel({ className, modelPath = null }: HeroBackgroundModelProps) {
  const { theme } = useTheme();
  const resolvedModelPath = modelPath ?? earthModelUrl;
  const shouldLoadModel = Boolean(resolvedModelPath);

  // Background should never block page interactions.
  // OrbitControls still handles autoRotate even without pointer events.
  return (
    <div className={className} style={{ pointerEvents: 'none' }}>
      <Canvas
        shadows={false}
        // Cap DPR to reduce GPU memory usage (prevents WebGL context loss on some machines)
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'default', alpha: true }}
        camera={{ position: [3.8, 1.8, 4.6], fov: 45, near: 0.1, far: 100 }}
      >
        <hemisphereLight intensity={0.65} groundColor="#0b1220" />
        <directionalLight position={[5, 6, 4]} intensity={1.15} />
        <directionalLight position={[-4, 2, -4]} intensity={0.55} />
        <group position={[0, -0.15, 0]}>
          {shouldLoadModel && resolvedModelPath ? (
            <LoadedModel url={resolvedModelPath} onLoaded={() => {}} onError={() => {}} />
          ) : (
            <FallbackGlobe theme={theme} />
          )}
        </group>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          autoRotate
          autoRotateSpeed={0.55}
        />
      </Canvas>
    </div>
  );
}

export default function HeroModel({ modelPath = null }: HeroModelProps) {
  const { theme } = useTheme();
  const resolvedModelPath = modelPath ?? earthModelUrl;
  const shouldLoadModel = Boolean(resolvedModelPath);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldLoadModel) {
      setStatus('ready');
      setErrorMessage(null);
      return;
    }
    setStatus('loading');
    setErrorMessage(null);
  }, [resolvedModelPath, shouldLoadModel]);

  const handleLoaded = useCallback(() => {
    setStatus('ready');
  }, []);

  const handleError = useCallback((message: string) => {
    setStatus('error');
    setErrorMessage(message);
  }, []);

  const backgroundColor = useMemo(
    () => (theme === 'dark' ? '#0f172a' : '#f8fafc'),
    [theme],
  );

  const overlayMessage = errorMessage ?? 'Loading 3D model…';
  const showOverlay = shouldLoadModel && status !== 'ready';

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-surface-muted bg-surface-muted/60 shadow-2xl">
      {showOverlay && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center bg-surface/70 backdrop-blur-sm text-secondary">
          <div className="space-y-2">
            <p className="font-semibold text-primary">
              {errorMessage ? 'Model unavailable' : 'Preparing model'}
            </p>
            <p className="text-sm">{overlayMessage}</p>
          </div>
        </div>
      )}
      <Canvas
        shadows
        camera={{ position: [3.3, 2.2, 4.1], fov: 45 }}
        className={status === 'error' ? 'opacity-60' : undefined}
      >
        <color attach="background" args={[backgroundColor]} />
        <hemisphereLight intensity={0.35} groundColor="#0f172a" />
        <directionalLight
          position={[5, 6, 4]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-4, 2, -4]} intensity={0.5} />
        <group position={[0, -0.25, 0]}>
          {shouldLoadModel && resolvedModelPath ? (
            <LoadedModel url={resolvedModelPath} onLoaded={handleLoaded} onError={handleError} />
          ) : (
            <FallbackGlobe theme={theme} />
          )}
        </group>
        <ContactShadows
          position={[0, -1.2, 0]}
          opacity={0.5}
          scale={10}
          blur={3}
          far={5}
        />
        <Environment preset={theme === 'dark' ? 'city' : 'sunset'} />
        <OrbitControls
          enablePan={false}
          enableZoom
          autoRotate
          autoRotateSpeed={0.8}
          maxDistance={8}
          minDistance={2}
        />
      </Canvas>
    </div>
  );
}

