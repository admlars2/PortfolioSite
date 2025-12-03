import { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Tree } from './tree';
import { useTheme } from '../contexts/ThemeContext';
import type { LSystemConfig } from './LSystem';

interface TreeMeshProps {
  tree: Tree;
  branchColor: string;
  onRotationStart: () => void;
  onRotationEnd: () => void;
}

function TreeMesh({ tree, branchColor, onRotationStart, onRotationEnd }: TreeMeshProps) {
  const branchMeshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef<{ x: number; y: number } | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });

  const branchGeometry = useMemo(() => tree.createBranchGeometry(), [tree]);
  // const leafGeometry = useMemo(() => tree.createLeafGeometry(), [tree]);

  const branchMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: branchColor,
        roughness: 0.8,
        metalness: 0.1,
      }),
    [branchColor]
  );

  // const leafMaterial = useMemo(
  //   () =>
  //     new THREE.MeshStandardMaterial({
  //       color: leafColor,
  //       roughness: 0.9,
  //       metalness: 0.0,
  //       side: THREE.DoubleSide,
  //       transparent: true,
  //       opacity: 0.8,
  //     }),
  //   [leafColor]
  // );

  const handlePointerDown = (event: React.PointerEvent) => {
    event.stopPropagation();
    isDraggingRef.current = true;
    previousMouseRef.current = { x: event.clientX, y: event.clientY };
    onRotationStart();
    // Capture pointer to track movement outside the element
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!isDraggingRef.current || !previousMouseRef.current || !groupRef.current) return;

    const deltaX = event.clientX - previousMouseRef.current.x;
    const deltaY = event.clientY - previousMouseRef.current.y;

    // Rotate around Y axis (horizontal drag) and X axis (vertical drag)
    const rotationSpeed = 0.005;
    rotationRef.current.y += deltaX * rotationSpeed;
    rotationRef.current.x += deltaY * rotationSpeed;

    // Apply rotation to group
    groupRef.current.rotation.y = rotationRef.current.y;
    groupRef.current.rotation.x = rotationRef.current.x;

    previousMouseRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    isDraggingRef.current = false;
    previousMouseRef.current = null;
    onRotationEnd();
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  };

  const handlePointerCancel = (event: React.PointerEvent) => {
    isDraggingRef.current = false;
    previousMouseRef.current = null;
    onRotationEnd();
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  };

  // Subtle animation
  // useFrame((state) => {
  //   if (groupRef.current) {
  //     // Gentle sway
  //     groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
  //     groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.03;
  //   }
  // });

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <mesh ref={branchMeshRef} geometry={branchGeometry} material={branchMaterial} />
      {/* <mesh ref={leafMeshRef} geometry={leafGeometry} material={leafMaterial} /> */}
    </group>
  );
}

interface TreeBackgroundProps {
  seed?: number;
}

export default function TreeBackground({ seed = 42 }: TreeBackgroundProps) {
  const { theme } = useTheme();
  const [isRotating, setIsRotating] = useState(false);

  // Theme-aware colors - trunk should be darker brown
  const branchColor = theme === 'dark' ? '#5d4e37' : '#6b5d47';

  // L-system configuration for oak-like tree with 2 branches
  const lSystemConfig: LSystemConfig = useMemo(
    () => ({
      axiom: 'T(1.0, 0)',
      iterations: 4,
      seed,
      rules: [
        // Trunk forks into 2 leaders when size > 0.3
        {
          symbol: 'T',
          condition: (params) => params[0] > 0.3, // s > 0.3
          production: 'F(s)[+0.4 T(s * 0.8, d + 1)][-0.4 T(s * 0.8, d + 1)]',
        },
        // Trunk stops when size <= 0.3
        {
          symbol: 'T',
          condition: (params) => params[0] <= 0.3, // s <= 0.3
          production: 'F(s)',
        },
        // Side branches continue branching when size > 0.2
        {
          symbol: 'B',
          condition: (params) => params[0] > 0.2, // s > 0.2
          production: 'F(s)[+0.3 B(s * 0.7, d + 1)][-0.3 B(s * 0.7, d + 1)]',
        },
        // Side branches stop when size <= 0.2
        {
          symbol: 'B',
          condition: (params) => params[0] <= 0.2, // s <= 0.2
          production: 'F(s)',
        },
      ],
    }),
    [seed]
  );

  // Turtle interpreter configuration
  const turtleConfig = useMemo(
    () => ({
      initialLength: 1.5,
      initialRadius: 0.15,
      lengthScale: 0.8,
      radiusScale: 0.7,
      angleStep: Math.PI / 6, // 30 degrees
      sectionCount: 8,
      faceCount: 8,
      taper: 1,
      twist: 0.0,
    }),
    []
  );

  // Tree options combining L-system and turtle config
  const treeOptions = useMemo(
    () => ({
      seed,
      lSystem: lSystemConfig,
      turtle: turtleConfig,
    }),
    [seed, lSystemConfig, turtleConfig]
  );

  const tree = useMemo(() => {
    const t = new Tree(treeOptions);
    t.generate();
    return t;
  }, [treeOptions]);

  return (
    <div 
      className="absolute inset-0 overflow-hidden hidden sm:block" 
      style={{ zIndex: 0, pointerEvents: 'auto', cursor: isRotating ? 'grabbing' : 'grab' }}
    >
      <Canvas
        camera={{ position: [2, 1, 6], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent', pointerEvents: 'auto' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <group position={[1.5, -2.5, 0]}>
          <TreeMesh 
            tree={tree} 
            branchColor={branchColor}
            onRotationStart={() => setIsRotating(true)}
            onRotationEnd={() => setIsRotating(false)}
          />
        </group>
      </Canvas>
    </div>
  );
}

