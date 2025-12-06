import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Tree } from '../components/tree';
import { useTheme } from '../contexts/ThemeContext';
import type { LSystemConfig } from '../components/LSystem';
import { useTranslation } from 'react-i18next';

interface TreeMeshProps {
  tree: Tree;
  branchColor: string;
  wireframe: boolean;
  onRotationStart: () => void;
  onRotationEnd: () => void;
}

function TreeMesh({ tree, branchColor, wireframe, onRotationStart, onRotationEnd }: TreeMeshProps) {
  const branchMeshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef<{ x: number; y: number } | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });

  const branchGeometry = useMemo(() => tree.createBranchGeometry(), [tree]);

  const branchMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: branchColor,
        roughness: 0.8,
        metalness: 0.1,
        wireframe: wireframe,
      }),
    [branchColor, wireframe]
  );

  const handlePointerDown = (event: React.PointerEvent) => {
    event.stopPropagation();
    isDraggingRef.current = true;
    previousMouseRef.current = { x: event.clientX, y: event.clientY };
    onRotationStart();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!isDraggingRef.current || !previousMouseRef.current || !groupRef.current) return;

    const deltaX = event.clientX - previousMouseRef.current.x;
    const deltaY = event.clientY - previousMouseRef.current.y;

    const rotationSpeed = 0.005;
    rotationRef.current.y += deltaX * rotationSpeed;
    rotationRef.current.x += deltaY * rotationSpeed;

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

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <mesh ref={branchMeshRef} geometry={branchGeometry} material={branchMaterial} />
    </group>
  );
}

// Zoom controls component
function ZoomControls() {
  const { camera } = useThree();
  const zoomSpeed = 0.001; // Smaller multiplier for smoother zoom
  const minZoom = 2;
  const maxZoom = 20;
  const targetDistanceRef = useRef<number>(camera.position.length());
  const animationFrameRef = useRef<number | undefined>(undefined);

  React.useEffect(() => {
    // Initialize target distance
    targetDistanceRef.current = camera.position.length();

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Scroll up (negative deltaY) should zoom in (decrease distance)
      // Scroll down (positive deltaY) should zoom out (increase distance)
      // Use exponential scaling for smoother feel
      const delta = e.deltaY * zoomSpeed * targetDistanceRef.current;
      const currentDistance = targetDistanceRef.current;
      const newDistance = Math.max(minZoom, Math.min(maxZoom, currentDistance + delta));
      targetDistanceRef.current = newDistance;
      
      // Smooth zoom using requestAnimationFrame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      const animateZoom = () => {
        const currentDist = camera.position.length();
        const targetDist = targetDistanceRef.current;
        const diff = targetDist - currentDist;
        
        if (Math.abs(diff) > 0.01) {
          // Smooth interpolation
          const newDist = currentDist + diff * 0.1;
          camera.position.normalize().multiplyScalar(newDist);
          camera.updateProjectionMatrix();
          animationFrameRef.current = requestAnimationFrame(animateZoom);
        } else {
          // Snap to final position
          camera.position.normalize().multiplyScalar(targetDist);
          camera.updateProjectionMatrix();
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animateZoom);
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [camera]);

  return null;
}

interface TreeAdjustmentProps {}

export default function TreeAdjustment({}: TreeAdjustmentProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isRotating, setIsRotating] = useState(false);
  const [seed, setSeed] = useState(42);
  
  // Trunk parameters
  const [initialLength, setInitialLength] = useState(1.5);
  const [initialRadius, setInitialRadius] = useState(0.3);
  const [sectionCount, setSectionCount] = useState(5);
  const [faceCount, setFaceCount] = useState(5);
  const [taper, setTaper] = useState(1);
  const [twist, setTwist] = useState(Math.PI / 3);
  const [segments, setSegments] = useState(5); // Number of segments in the tree
  const [angleStep, setAngleStep] = useState(Math.PI / 3); // 60 degrees
  const [wireframe, setWireframe] = useState(false);
  const [gnarliness, setGnarliness] = useState(1.3);
  const [upForce, setUpForce] = useState(0.3);

  const branchColor = theme === 'dark' ? '#5d4e37' : '#6b5d47';

  // L-system configuration with branching and angleStep support
  // Use initialLength as a multiplier for the size parameter
  const lSystemConfig: LSystemConfig = useMemo(
    () => {
      // Convert angleStep to a string representation for use in production rules
      // Use angleStep directly in rotation commands
      const angleStr = angleStep.toString();
      
      return {
        axiom: `T(${initialLength}, 0)`, // Start with initialLength as the size
        iterations: segments,
        seed,
        rules: [
          // Trunk forks into branches when size > 0.3
          // Add pitch rotations to create 3D branching: & (pitch down) and ^ (pitch up)
          // Use 3 branches: one left with pitch down, one right with pitch down, one forward with pitch up
          {
            symbol: 'T',
            condition: (params) => params[0] > 0.3,
            production: `F(s)[+${angleStr}&${angleStr} B(s * 0.8, d + 1)][-${angleStr}&${angleStr} B(s * 0.8, d + 1)][^${angleStr} B(s * 0.8, d + 1)] T(s * 0.9, d + 1)`,
          },
          // Trunk stops when size <= 0.3
          {
            symbol: 'T',
            condition: (params) => params[0] <= 0.3,
            production: 'F(s)',
          },
          // Branches continue branching when size > 0.2
          // Add pitch rotations for 3D branching
          {
            symbol: 'B',
            condition: (params) => params[0] > 0.2,
            production: `F(s)[+${angleStr}&${angleStr} B(s * 0.7, d + 1)][-${angleStr}&${angleStr} B(s * 0.7, d + 1)][^${angleStr} B(s * 0.7, d + 1)]`,
          },
          // Branches stop when size <= 0.2
          {
            symbol: 'B',
            condition: (params) => params[0] <= 0.2,
            production: 'F(s)',
          },
        ],
      };
    },
    [seed, segments, initialLength, angleStep]
  );

  // Turtle interpreter configuration
  const turtleConfig = useMemo(
    () => ({
      initialLength,
      initialRadius,
      lengthScale: 0.9,
      radiusScale: 0.9,
      angleStep,
      sectionCount,
      faceCount,
      taper,
      twist,
      gnarliness,
      upForce,
    }),
    [initialLength, initialRadius, angleStep, sectionCount, faceCount, taper, twist, gnarliness, upForce]
  );

  // Tree options
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
    <div className="h-full w-full flex flex-col bg-app text-primary">
      <div className="flex-1 flex">
        {/* Controls Panel */}
        <div className="w-80 p-6 border-r border-sidebar overflow-y-auto">
          <h1 className="text-2xl font-bold mb-6">{t('treeAdjustment.title')}</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('treeAdjustment.seed', { value: seed })}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('treeAdjustment.initialLength', { value: initialLength.toFixed(2) })}
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={initialLength}
                onChange={(e) => setInitialLength(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('treeAdjustment.initialRadius', { value: initialRadius.toFixed(3) })}
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={initialRadius}
                onChange={(e) => setInitialRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('treeAdjustment.sectionCount', { value: sectionCount })}
              </label>
              <input
                type="range"
                min="4"
                max="32"
                step="1"
                value={sectionCount}
                onChange={(e) => setSectionCount(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('treeAdjustment.faceCount', { value: faceCount })}
              </label>
              <input
                type="range"
                min="4"
                max="32"
                step="1"
                value={faceCount}
                onChange={(e) => setFaceCount(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" title={t('treeAdjustment.taperHint')}>
                {t('treeAdjustment.taper', { value: taper.toFixed(2) })}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={taper}
                onChange={(e) => setTaper(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('treeAdjustment.twist', { value: (twist * 180 / Math.PI).toFixed(1) })}
              </label>
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step="0.1"
                value={twist}
                onChange={(e) => setTwist(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('treeAdjustment.segments', { value: segments })}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={segments}
                onChange={(e) => setSegments(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('treeAdjustment.angleStep', { value: (angleStep * 180 / Math.PI).toFixed(1) })}
              </label>
              <input
                type="range"
                min="0"
                max={Math.PI / 2}
                step="0.01"
                value={angleStep}
                onChange={(e) => setAngleStep(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="pt-4 border-t border-sidebar">
              <label className="block text-sm font-medium mb-2">
                {t('treeAdjustment.gnarliness', { value: gnarliness.toFixed(2) })}
              </label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.01"
                value={gnarliness}
                onChange={(e) => setGnarliness(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('treeAdjustment.upwardForce', { value: upForce.toFixed(2) })}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={upForce}
                onChange={(e) => setUpForce(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="pt-4 border-t border-sidebar">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wireframe}
                  onChange={(e) => setWireframe(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">{t('treeAdjustment.wireframe')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tree Preview */}
        <div 
          className="flex-1 relative"
          style={{ pointerEvents: 'auto', cursor: isRotating ? 'grabbing' : 'grab' }}
        >
          <Canvas
            camera={{ position: [2, 1, 6], fov: 50 }}
            gl={{ alpha: true, antialias: true }}
            style={{ background: 'transparent', pointerEvents: 'auto' }}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            <ZoomControls />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, 3, -5]} intensity={0.4} />
            <group position={[0, -2, 0]}>
              <TreeMesh 
                tree={tree} 
                branchColor={branchColor}
                wireframe={wireframe}
                onRotationStart={() => setIsRotating(true)}
                onRotationEnd={() => setIsRotating(false)}
              />
            </group>
          </Canvas>
        </div>
      </div>
    </div>
  );
}

