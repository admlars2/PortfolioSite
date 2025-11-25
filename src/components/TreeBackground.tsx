import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Tree } from './tree';
import { useTheme } from '../contexts/ThemeContext';

interface TreeMeshProps {
  tree: Tree;
  branchColor: string;
  leafColor: string;
}

function TreeMesh({ tree, branchColor, leafColor }: TreeMeshProps) {
  const branchMeshRef = useRef<THREE.Mesh>(null);
  const leafMeshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const branchGeometry = useMemo(() => tree.createBranchGeometry(), [tree]);
  const leafGeometry = useMemo(() => tree.createLeafGeometry(), [tree]);

  const branchMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: branchColor,
        roughness: 0.8,
        metalness: 0.1,
      }),
    [branchColor]
  );

  const leafMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: leafColor,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      }),
    [leafColor]
  );

  // Subtle animation
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle sway
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={branchMeshRef} geometry={branchGeometry} material={branchMaterial} />
      <mesh ref={leafMeshRef} geometry={leafGeometry} material={leafMaterial} />
    </group>
  );
}

interface TreeBackgroundProps {
  seed?: number;
}

export default function TreeBackground({ seed = 42 }: TreeBackgroundProps) {
  const { theme } = useTheme();

  // Theme-aware colors - trunk should be darker brown
  const branchColor = theme === 'dark' ? '#5d4e37' : '#6b5d47';
  const leafColor = theme === 'dark' ? '#6b8e6b' : '#5a8a5a';

  // Default tree options
  const treeOptions = useMemo(
    () => ({
      seed,
      branch: {
        length: [4.0, 2.0, 1.2, 0.6], // Lengths for each level
        radius: [0.2, 0.1, 0.05, 0.025], // Radii for each level
        sections: [10, 8, 6, 4], // Number of sections per branch
        segments: [8, 8, 6, 6], // Segments around circumference
        taper: [0.25, 0.35, 0.45, 0.55], // Taper factor per level
        gnarliness: [0.06, 0.08, 0.1, 0.12], // Reduced random variation per level
        twist: [0.02, 0.04, 0.06, 0.08], // Reduced twist per level
        force: {
          direction: new THREE.Vector3(0, 1, 0), // Upward growth
          strength: 0.02, // Minimal force - just a slight upward tendency
        },
      },
    }),
    [seed]
  );

  const tree = useMemo(() => {
    const t = new Tree(treeOptions);
    t.generate();
    return t;
  }, [treeOptions]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [2, 1, 6], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <group position={[1.5, -2.5, 0]}>
          <TreeMesh tree={tree} branchColor={branchColor} leafColor={leafColor} />
        </group>
      </Canvas>
    </div>
  );
}

