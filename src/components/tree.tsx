import * as THREE from "three";
import { LSystemGenerator } from "./LSystem";
import type { LSystemConfig } from "./LSystem";
import { TurtleInterpreter } from "./TurtleInterpreter";
import type { TurtleConfig } from "./TurtleInterpreter";

export interface TreeOptions {
  seed?: number;
  lSystem: LSystemConfig;
  turtle: TurtleConfig;
}

export class Tree {
  options: TreeOptions;
  lSystemGenerator: LSystemGenerator;
  turtleInterpreter: TurtleInterpreter;

  branches: {
    verts: number[];
    indices: number[];
    normals: number[];
    uvs: number[];
  }
  
  leaves: {
    verts: number[];
    indices: number[];
    normals: number[];
    uvs: number[];
  }

  constructor(options: TreeOptions) {
    this.options = options;
    
    // Initialize L-system generator
    const lSystemConfig: LSystemConfig = {
      ...options.lSystem,
      seed: options.seed,
    };
    this.lSystemGenerator = new LSystemGenerator(lSystemConfig);
    
    // Initialize turtle interpreter with seed
    this.turtleInterpreter = new TurtleInterpreter({
      ...options.turtle,
      seed: options.seed,
    });

    this.branches = {
      verts: [],
      indices: [],
      normals: [],
      uvs: [],
    };

    this.leaves = {
      verts: [],
      indices: [],
      normals: [],
      uvs: [],
    };
  }

  generate(): void {
    // Update L-system generator config in case it changed
    // Include seed to ensure RNG is reinitialized for deterministic results
    this.lSystemGenerator.updateConfig({
      ...this.options.lSystem,
      seed: this.options.seed,
    });
    
    // Update turtle interpreter config in case it changed
    // Include seed to ensure RNG is reinitialized for deterministic results
    this.turtleInterpreter.updateConfig({
      ...this.options.turtle,
      seed: this.options.seed,
    });
    
    // Reset branches
    this.branches = {
      verts: [],
      indices: [],
      normals: [],
      uvs: [],
    };

    this.leaves = {
      verts: [],
      indices: [],
      normals: [],
      uvs: [],
    };

    // Generate L-system string
    const lSystemString = this.lSystemGenerator.generate();
    
    // Interpret with turtle graphics to generate geometry
    this.turtleInterpreter.interpret(lSystemString);
    
    // Copy geometry from turtle interpreter
    this.branches = {
      verts: [...this.turtleInterpreter.branches.verts],
      indices: [...this.turtleInterpreter.branches.indices],
      normals: [...this.turtleInterpreter.branches.normals],
      uvs: [...this.turtleInterpreter.branches.uvs],
    };
  }

  createBranchGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.branches.verts, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.branches.normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.branches.uvs, 2));
    geometry.setIndex(this.branches.indices);

    return geometry;
  }

  createLeafGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.leaves.verts, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.leaves.normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.leaves.uvs, 2));
    geometry.setIndex(this.leaves.indices);

    return geometry;
  }
}
