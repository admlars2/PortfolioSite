import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { useTheme } from '@/contexts/ThemeContext';

import earthModelUrl from '@/assets/models/low_poly_planet_earth.glb?url';

interface HeroBackgroundModelProps {
  className?: string;
  modelPath?: string | null;
}

interface LoadedModelProps {
  url: string;
  onLoaded: () => void;
  onError: (message: string) => void;
}

interface CanvasSize {
  width: number;
  height: number;
}

const CAMERA_POSITION = [3.8, 1.8, 4.6] as const;
const CAMERA_TARGET = [0, -0.15, 0] as const;
const CAMERA_FOV = 45;

function LoadedModel({ url, onLoaded, onError }: LoadedModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let active = true;
    const group = groupRef.current;
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
      group?.clear();
    };
  }, [onError, onLoaded, url]);

  return <group ref={groupRef} />;
}

/**
 * Wraps the 3D scene in a group whose scale adapts to the camera viewport so
 * the model always fits inside the visible canvas regardless of aspect ratio.
 *
 * Without this, a fixed FOV/distance camera makes the model look oversized
 * on narrow (mobile/portrait) viewports because the visible world-width
 * shrinks linearly with aspect ratio.
 *
 * The inner LoadedModel normalizes the imported scene so its largest axis is
 * NORMALIZED_MAX_AXIS world units. We compute a uniform scale that fits that
 * within `FIT_FRACTION` of the smaller of the camera's visible world width
 * and height at the model plane.
 */
const NORMALIZED_MAX_AXIS = 2.6;
const FIT_FRACTION = 0.85;

function getInitialCanvasSize(): CanvasSize {
  if (typeof window === 'undefined') {
    return { width: 390, height: 844 };
  }

  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function getResponsiveScale({ width, height }: CanvasSize) {
  if (width <= 0 || height <= 0) return 1;

  const aspect = width / height;
  const cameraDistance = new THREE.Vector3(...CAMERA_POSITION).distanceTo(new THREE.Vector3(...CAMERA_TARGET));
  const visibleHeight = 2 * cameraDistance * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
  const visibleWidth = visibleHeight * aspect;
  const target = Math.min(visibleWidth, visibleHeight) * FIT_FRACTION;

  return Math.min(1, target / NORMALIZED_MAX_AXIS);
}

function useElementSize(elementRef: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<CanvasSize>(getInitialCanvasSize);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let frameId = 0;
    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      setSize((current) => {
        if (Math.round(current.width) === Math.round(width) && Math.round(current.height) === Math.round(height)) {
          return current;
        }
        return { width, height };
      });
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateSize);
    };

    updateSize();
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(element);
    window.visualViewport?.addEventListener('resize', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.visualViewport?.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [elementRef]);

  return size;
}

function CameraTarget() {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(...CAMERA_POSITION);
    camera.lookAt(...CAMERA_TARGET);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function ResponsiveContent({ children, canvasSize }: { children: ReactNode; canvasSize: CanvasSize }) {
  const groupRef = useRef<THREE.Group>(null);
  const scale = useMemo(() => getResponsiveScale(canvasSize), [canvasSize]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef} position={[0, -0.15, 0]} scale={scale}>
      {children}
    </group>
  );
}

function FallbackGlobe({ theme }: { theme: 'light' | 'dark' }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.y += delta * 0.35;
    mesh.rotation.x += delta * 0.05;
  });

  const color = theme === 'dark' ? '#8b5cf6' : '#7a45b8';

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <icosahedronGeometry args={[1.25, 1]} />
      <meshStandardMaterial color={color} flatShading roughness={0.85} metalness={0.1} />
    </mesh>
  );
}

export function HeroBackgroundModel({ className, modelPath = null }: HeroBackgroundModelProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const canvasSize = useElementSize(wrapperRef);
  const resolvedModelPath = modelPath ?? earthModelUrl;
  const shouldLoadModel = Boolean(resolvedModelPath);
  const handleModelLoaded = useCallback(() => {}, []);
  const handleModelError = useCallback(() => {}, []);

  // Background should never block page interactions.
  return (
    <div ref={wrapperRef} className={className} style={{ pointerEvents: 'none', touchAction: 'pan-y' }}>
      <Canvas
        className="hero-model-canvas"
        shadows={false}
        style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
        // Cap DPR to reduce GPU memory usage (prevents WebGL context loss on some machines)
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'default', alpha: true }}
        camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV, near: 0.1, far: 100 }}
      >
        <CameraTarget />
        <hemisphereLight intensity={0.65} groundColor="#0b1220" />
        <directionalLight position={[5, 6, 4]} intensity={1.15} />
        <directionalLight position={[-4, 2, -4]} intensity={0.55} />
        <ResponsiveContent canvasSize={canvasSize}>
          {shouldLoadModel && resolvedModelPath ? (
            <LoadedModel url={resolvedModelPath} onLoaded={handleModelLoaded} onError={handleModelError} />
          ) : (
            <FallbackGlobe theme={theme} />
          )}
        </ResponsiveContent>
      </Canvas>
    </div>
  );
}

