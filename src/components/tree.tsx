import * as THREE from "three";
import seedrandom from "seedrandom";

export class RNG {
  private prng: seedrandom.PRNG;

  constructor(seed?: number) {
    // Convert to string for seedrandom; fall back to Math.random if no seed
    this.prng = seedrandom(seed !== undefined ? String(seed) : undefined);
  }

  /**
   * Returns a random number in [min, max).
   * Usage in the article: random(gnarliness, -gnarliness)
   */
  random(max = 1, min = 0): number {
    return min + this.prng() * (max - min);
  }
}

interface Branch {
  origin: THREE.Vector3;
  orientation: THREE.Euler;
  length: number;
  radius: number;
  level: number; // recurion depth with trunk at level 0
  sectionCount: number; // number of subdevisions
  segmentCount: number; // number of segments around the trunks circumference (smoothness)
}

interface TreeOptions {
  seed?: number;
  branch: {
    length: number[];
    radius: number[];
    sections: number[];
    segments: number[];
    taper: number[];
    gnarliness: number[];
  }
}

export class Tree {
  options: TreeOptions;
  rng: RNG;
  branchQueue: Branch[];

  branches: {
    verts: THREE.Vector3[];
    indices: number[];
    normals: THREE.Vector3[];
    uvs: THREE.Vector2[];
  }
  
  leaves: {
    verts: THREE.Vector3[];
    indices: number[];
    normals: THREE.Vector3[];
    uvs: THREE.Vector2[];
  }

  constructor(options: TreeOptions) {
    this.options = options;
    this.rng = new RNG(this.options?.seed);
    this.branchQueue = [];

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

    this.rng = new RNG(this.options?.seed);

    this.branchQueue.push(
      {
        origin: new THREE.Vector3(),
        orientation: new THREE.Euler(),
        length: this.options.branch.length[0],
        radius: this.options.branch.radius[0],
        level: 0,
        sectionCount: this.options.branch.sections[0],
        segmentCount: this.options.branch.segments[0],
      }
    )


    while (this.branchQueue.length > 0) {
      const branch = this.branchQueue.shift();
      if (!branch) continue;

      this.generateBranch(branch);
    }
  }

  private generateBranch(branch: Branch): void {
    let sectionOrigin = branch.origin.clone();
    let sectionOrientation = branch.orientation.clone();
    let sectionLength = branch.length;

    let sections = [];

    for (let i = 0; i < branch.sectionCount; i++) {
      // Calculate Radius with Taper
      let sectionRadius = branch.radius;

      if (i === branch.sectionCount) {
        sectionRadius = 0.001;
      } else {
        sectionRadius *= 1 - this.options.branch.taper[branch.level] * (i / branch.sectionCount);
      }
      
      // Build Section Geometry
      for (let j = 0; j < branch.segmentCount; j++) {
        // Growth Force
        const qSection = new THREE.Quaternion().setFromEuler(sectionOrientation);
        const qTwist = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), 
          this.options.branch.twist[branch.level]
        );

        const qForce = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), 
          new THREE.Vector3().copy(this.options.branch.force.direction)
        );

        qSection.multiply(qTwist);
        qSection.rotateTowards(
          qForce, this.options.branch.force.strength / sectionRadius
        );

        sectionOrientation.setFromQuaternion(qSection);

        // Calculate Gnarliness
        const gnarliness = 
        Math.max(1, 1 / Math.sqrt(branch.radius)) * 
        this.options.branch.gnarliness[branch.level];

        sectionOrientation.x += this.rng.random(-gnarliness, gnarliness);
        sectionOrientation.z += this.rng.random(-gnarliness, gnarliness);

        let angle = (2.0 * Math.PI * j) / branch.segmentCount;
        
        const vertex = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
        .multiplyScalar(sectionRadius)
        .applyEuler(sectionOrientation)
        .add(sectionOrigin);
        
        const normal = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
        .applyEuler(sectionOrientation)
        .normalize();
        
        const uv = new THREE.Vector2(
          j / branch.segmentCount, 
          (i % 2 === 0) ? 0 : 1
        );
        
        this.branches.verts.push(...Object.values(vertex));
        this.branches.normals.push(...Object.values(normal));
        this.branches.uvs.push(...Object.values(uv));
      }
      
      
      sections.push({
        origin: sectionOrigin.clone(),
        orientation: sectionOrientation.clone(),
        radius: sectionRadius
      })
    }
  }
}