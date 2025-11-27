import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Tree } from '../components/tree';
import { useTheme } from '../contexts/ThemeContext';
import type { LSystemConfig } from '../components/LSystem';

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
  const { theme } = useTheme();
  const [isRotating, setIsRotating] = useState(false);
  const [seed, setSeed] = useState(42);
  
  // Trunk parameters
  const [initialLength, setInitialLength] = useState(1.3);
  const [initialRadius, setInitialRadius] = useState(0.3);
  const [sectionCount, setSectionCount] = useState(5);
  const [faceCount, setFaceCount] = useState(5);
  const [taper, setTaper] = useState(0.3);
  const [twist, setTwist] = useState(Math.PI / 3);
  const [segments, setSegments] = useState(3); // Number of segments in the tree
  const [angleStep, setAngleStep] = useState(Math.PI / 3); // 60 degrees
  const [wireframe, setWireframe] = useState(false);

  const branchColor = theme === 'dark' ? '#5d4e37' : '#6b5d47';

  // L-system configuration - simplified to just trunk for now
  // Use initialLength as a multiplier for the size parameter
  const lSystemConfig: LSystemConfig = useMemo(
    () => ({
      axiom: `T(${initialLength}, 0)`, // Start with initialLength as the size
      iterations: segments,
      seed,
      rules: [
        // Trunk stops when size <= 0.3
        {
          symbol: 'T',
          condition: (params) => params[0] <= 0.3,
          production: 'F(s)',
        },
        // Trunk continues when size > 0.3
        {
          symbol: 'T',
          condition: (params) => params[0] > 0.3,
          production: 'F(s) T(s * 0.9, d + 1)',
        },
      ],
    }),
    [seed, segments, initialLength]
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
    }),
    [initialLength, initialRadius, angleStep, sectionCount, faceCount, taper, twist]
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
          <h1 className="text-2xl font-bold mb-6">Tree Adjustment</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Seed: {seed}
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
                Initial Length: {initialLength.toFixed(2)}
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
                Initial Radius: {initialRadius.toFixed(3)}
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
                Section Count: {sectionCount}
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
                Face Count: {faceCount}
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
              <label className="block text-sm font-medium mb-2">
                Taper: {taper.toFixed(2)}
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
                Twist: {(twist * 180 / Math.PI).toFixed(1)}°
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
                Segments: {segments}
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
                Angle Step: {(angleStep * 180 / Math.PI).toFixed(1)}°
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wireframe}
                  onChange={(e) => setWireframe(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Wireframe Mode</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tree Preview */}
        <div 
          className="flex-1 relative"
          style={{ pointerEvents: isRotating ? 'auto' : 'none', cursor: isRotating ? 'grabbing' : 'grab' }}
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

