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
    twist: number[];
    force: {
      direction: THREE.Vector3;
      strength: number;
    };
  }
}

export class Tree {
  options: TreeOptions;
  rng: RNG;
  branchQueue: Branch[];

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
    const sectionLength = branch.length / branch.sectionCount;
    const startVertexIndex = this.branches.verts.length / 3;

    // Calculate endpoint radius (don't taper to zero - keep some radius for child branches)
    const endpointRadius = branch.radius * (1 - this.options.branch.taper[branch.level] * 0.9);
    
    // Generate vertices for all sections
    for (let i = 0; i <= branch.sectionCount; i++) {
      // Calculate Radius with Taper
      let sectionRadius = branch.radius;
      
      if (i === branch.sectionCount) {
        // Final section - use endpoint radius (not zero)
        sectionRadius = Math.max(endpointRadius, branch.radius * 0.1);
      } else {
        const taperProgress = i / branch.sectionCount;
        sectionRadius *= 1 - this.options.branch.taper[branch.level] * taperProgress;
      }
      
      // Build Section Geometry using current orientation
      for (let j = 0; j < branch.segmentCount; j++) {
        const angle = (2.0 * Math.PI * j) / branch.segmentCount;
        
        // Create local vertex in the XZ plane (perpendicular to Y axis)
        const localVertex = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
          .multiplyScalar(sectionRadius);
        
        // Transform vertex to world space
        const vertex = localVertex
          .clone()
          .applyEuler(sectionOrientation)
          .add(sectionOrigin);
        
        // Normal points outward from the center - same direction as localVertex
        // Transform the normalized local direction to world space
        const localNormal = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
        const normal = localNormal
          .applyEuler(sectionOrientation);
        
        const uv = new THREE.Vector2(
          j / branch.segmentCount, 
          i / branch.sectionCount
        );
        
        this.branches.verts.push(vertex.x, vertex.y, vertex.z);
        this.branches.normals.push(normal.x, normal.y, normal.z);
        this.branches.uvs.push(uv.x, uv.y);
      }

      // Advance to next section and update orientation
      if (i < branch.sectionCount) {
        // Move forward along current orientation
        const forward = new THREE.Vector3(0, 1, 0)
          .applyEuler(sectionOrientation)
          .multiplyScalar(sectionLength);
        sectionOrigin.add(forward);

        // Apply growth force and twist for next section
        const qSection = new THREE.Quaternion().setFromEuler(sectionOrientation);
        
        // Apply twist
        const qTwist = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), 
          this.options.branch.twist[branch.level]
        );
        qSection.multiply(qTwist);

        // Apply growth force (minimal strength)
        const forceDir = this.options.branch.force.direction.clone().normalize();
        const qForce = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), 
          forceDir
        );
        const forceStrength = Math.min(
          this.options.branch.force.strength * 0.2 / Math.max(sectionRadius, 0.01),
          Math.PI / 12  // Very minimal - 15 degrees max
        );
        qSection.rotateTowards(qForce, forceStrength);

        sectionOrientation.setFromQuaternion(qSection);

        // Apply gnarliness (minimal random variation)
        const gnarliness = 
          Math.max(0.02, 0.5 / Math.sqrt(Math.max(branch.radius, 0.01))) * 
          this.options.branch.gnarliness[branch.level];

        sectionOrientation.x += this.rng.random(gnarliness, -gnarliness);
        sectionOrientation.z += this.rng.random(gnarliness, -gnarliness);
      }
    }

    // Generate indices to connect sections
    this.generateBranchIndices(startVertexIndex, branch.sectionCount, branch.segmentCount);

    // Generate child branches if not at max level
    const maxLevel = Math.min(
      this.options.branch.length.length - 1,
      this.options.branch.radius.length - 1,
      this.options.branch.sections.length - 1,
      this.options.branch.segments.length - 1
    );

    if (branch.level < maxLevel) {
      // Generate branches along the parent branch, not just at the end
      // Store section positions and orientations as we go
      const sectionPositions: Array<{ origin: THREE.Vector3; orientation: THREE.Euler; radius: number }> = [];
      
      // Recalculate section positions (we need to track them)
      let tempOrigin = branch.origin.clone();
      let tempOrientation = branch.orientation.clone();
      const tempSectionLength = branch.length / branch.sectionCount;
      
      for (let i = 0; i <= branch.sectionCount; i++) {
        let sectionRadius = branch.radius;
        if (i === branch.sectionCount) {
          sectionRadius = Math.max(endpointRadius, branch.radius * 0.1);
        } else {
          const taperProgress = i / branch.sectionCount;
          sectionRadius *= 1 - this.options.branch.taper[branch.level] * taperProgress;
        }
        
        sectionPositions.push({
          origin: tempOrigin.clone(),
          orientation: tempOrientation.clone(),
          radius: sectionRadius
        });
        
        if (i < branch.sectionCount) {
          const forward = new THREE.Vector3(0, 1, 0)
            .applyEuler(tempOrientation)
            .multiplyScalar(tempSectionLength);
          tempOrigin.add(forward);
          
          // Update orientation (simplified version)
          const qSection = new THREE.Quaternion().setFromEuler(tempOrientation);
          const qTwist = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), 
            this.options.branch.twist[branch.level]
          );
          qSection.multiply(qTwist);
          
          const forceDir = this.options.branch.force.direction.clone().normalize();
          const qForce = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), 
            forceDir
          );
          const forceStrength = Math.min(
            this.options.branch.force.strength * 0.2 / Math.max(sectionRadius, 0.01),
            Math.PI / 12  // Very minimal - 15 degrees max
          );
          qSection.rotateTowards(qForce, forceStrength);
          tempOrientation.setFromQuaternion(qSection);
          
          const gnarliness = 
            Math.max(0.02, 0.5 / Math.sqrt(Math.max(branch.radius, 0.01))) * 
            this.options.branch.gnarliness[branch.level];
          tempOrientation.x += this.rng.random(gnarliness, -gnarliness);
          tempOrientation.z += this.rng.random(gnarliness, -gnarliness);
        }
      }
      
      // Generate child branches at strategic points along the branch
      // For trunk (level 0), generate branches along the upper portion
      // For other branches, generate mostly at the end
      if (branch.level === 0) {
        // Generate branches along upper 60% of trunk
        const startSection = Math.floor(branch.sectionCount * 0.4);
        const endSection = branch.sectionCount;
        const numBranchPoints = 1 + Math.floor(this.rng.random(2)); // random(2) returns [0,2), so floor gives 0 or 1
        
        for (let bp = 0; bp < numBranchPoints; bp++) {
          const sectionIdx = startSection + Math.floor(this.rng.random(endSection - startSection));
          const section = sectionPositions[sectionIdx];
          this.generateChildBranches(
            section.origin,
            section.orientation,
            branch,
            section.radius,
            true
          );
        }
      } else {
        // For non-trunk branches, generate at the end
        const endSection = sectionPositions[sectionPositions.length - 1];
        this.generateChildBranches(
          endSection.origin,
          endSection.orientation,
          branch,
          endSection.radius,
          false
        );
      }
    } else {
      // Generate leaves at branch endpoints
      const endpointRadius = branch.radius * (1 - this.options.branch.taper[branch.level] * 0.9);
      this.generateLeaves(sectionOrigin, sectionOrientation, endpointRadius);
    }
  }

  private generateBranchIndices(startIndex: number, sectionCount: number, segmentCount: number): void {
    for (let i = 0; i < sectionCount; i++) {
      for (let j = 0; j < segmentCount; j++) {
        const current = startIndex + i * segmentCount + j;
        const next = startIndex + i * segmentCount + ((j + 1) % segmentCount);
        const currentNext = startIndex + (i + 1) * segmentCount + j;
        const nextNext = startIndex + (i + 1) * segmentCount + ((j + 1) % segmentCount);

        // First triangle - counter-clockwise winding for outward-facing normals
        this.branches.indices.push(current, next, currentNext);
        // Second triangle - counter-clockwise winding
        this.branches.indices.push(next, nextNext, currentNext);
      }
    }
  }

  private generateChildBranches(
    origin: THREE.Vector3,
    orientation: THREE.Euler,
    parentBranch: Branch,
    endpointRadius: number,
    isTrunkBranch: boolean = false
  ): void {
    const nextLevel = parentBranch.level + 1;
    const maxLevel = Math.min(
      this.options.branch.length.length - 1,
      this.options.branch.radius.length - 1,
      this.options.branch.sections.length - 1,
      this.options.branch.segments.length - 1
    );

    if (nextLevel > maxLevel) {
      return;
    }

    // Determine number of child branches based on level
    let numChildren: number;
    if (nextLevel === 1) {
      // First level branches (from trunk)
      numChildren = 2 + Math.floor(this.rng.random(2));
    } else if (nextLevel === 2) {
      // Second level branches
      numChildren = 1 + Math.floor(this.rng.random(2));
    } else {
      // Higher level branches
      numChildren = 1 + Math.floor(this.rng.random(1.5));
    }

    // Convert parent orientation to quaternion
    const qParent = new THREE.Quaternion().setFromEuler(orientation);
    
    // Get local right and up vectors for positioning branches around circumference
    const localRight = new THREE.Vector3(1, 0, 0).applyQuaternion(qParent);
    const localUp = new THREE.Vector3(0, 0, 1).applyQuaternion(qParent);

    for (let i = 0; i < numChildren; i++) {
      // Calculate angle around the circumference (distribute evenly)
      const angleAround = (2 * Math.PI * i) / numChildren + this.rng.random(0.3, -0.3);
      
      // Offset child branch origin from center to circumference
      const offset = localRight.clone().multiplyScalar(Math.cos(angleAround) * endpointRadius)
        .add(localUp.clone().multiplyScalar(Math.sin(angleAround) * endpointRadius));
      
      const childOrigin = origin.clone().add(offset);
      
      // Calculate child orientation - branches should grow outward from parent
      // Get the direction from parent center to child origin (outward direction)
      const outwardDir = offset.clone().normalize();
      
      // Start with parent orientation
      let qChild = qParent.clone();
      
      // Rotate to align with outward direction (but not completely - keep some upward component)
      const targetDir = new THREE.Vector3(0, 1, 0)
        .applyQuaternion(qParent)
        .lerp(outwardDir, 0.6)  // Mix 60% outward, 40% upward
        .normalize();
      
      const qAlign = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0).applyQuaternion(qParent),
        targetDir
      );
      qChild.multiply(qAlign);
      
      // Add spread variation - branches should spread outward, not just upward
      const spreadAmount = isTrunkBranch ? Math.PI / 3 : Math.PI / 4; // More spread for trunk branches
      const spreadAngle = spreadAmount * (0.7 + this.rng.random(0.3));
      
      // Rotate around the outward direction axis
      const qSpread = new THREE.Quaternion().setFromAxisAngle(
        outwardDir,
        spreadAngle + this.rng.random(0.2, -0.2)
      );
      qChild.multiply(qSpread);
      
      // Add some random variation for natural look
      const qRandom = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          this.rng.random(0.15, -0.15),
          this.rng.random(0.15, -0.15),
          this.rng.random(0.15, -0.15)
        )
      );
      qChild.multiply(qRandom);
      
      const childOrientation = new THREE.Euler().setFromQuaternion(qChild);

      const childLength = this.options.branch.length[nextLevel] * (0.7 + this.rng.random(0.3));
      const childRadius = this.options.branch.radius[nextLevel] * (0.8 + this.rng.random(0.2));

      this.branchQueue.push({
        origin: childOrigin,
        orientation: childOrientation,
        length: childLength,
        radius: childRadius,
        level: nextLevel,
        sectionCount: this.options.branch.sections[nextLevel],
        segmentCount: this.options.branch.segments[nextLevel],
      });
    }
  }

  private generateLeaves(origin: THREE.Vector3, orientation: THREE.Euler, branchRadius: number): void {
    const leafCount = Math.floor(2 + this.rng.random(3));
    const leafSize = branchRadius * (2 + this.rng.random(2));

    for (let i = 0; i < leafCount; i++) {
      const offset = new THREE.Vector3(
        this.rng.random(leafSize, -leafSize),
        this.rng.random(leafSize * 0.5, -leafSize * 0.5),
        this.rng.random(leafSize, -leafSize)
      );
      
      const leafPos = origin.clone().add(offset);
      const leafNormal = offset.clone().normalize();

      // Create a simple quad for each leaf
      const startIndex = this.leaves.verts.length / 3;
      const halfSize = leafSize * 0.3;

      // Create a plane perpendicular to the branch direction
      const right = new THREE.Vector3(1, 0, 0).applyEuler(orientation);
      const up = new THREE.Vector3(0, 0, 1).applyEuler(orientation);

      const v1 = leafPos.clone().add(right.clone().multiplyScalar(-halfSize)).add(up.clone().multiplyScalar(-halfSize));
      const v2 = leafPos.clone().add(right.clone().multiplyScalar(halfSize)).add(up.clone().multiplyScalar(-halfSize));
      const v3 = leafPos.clone().add(right.clone().multiplyScalar(halfSize)).add(up.clone().multiplyScalar(halfSize));
      const v4 = leafPos.clone().add(right.clone().multiplyScalar(-halfSize)).add(up.clone().multiplyScalar(halfSize));

      this.leaves.verts.push(
        v1.x, v1.y, v1.z,
        v2.x, v2.y, v2.z,
        v3.x, v3.y, v3.z,
        v4.x, v4.y, v4.z
      );

      this.leaves.normals.push(
        leafNormal.x, leafNormal.y, leafNormal.z,
        leafNormal.x, leafNormal.y, leafNormal.z,
        leafNormal.x, leafNormal.y, leafNormal.z,
        leafNormal.x, leafNormal.y, leafNormal.z
      );

      this.leaves.uvs.push(
        0, 0,
        1, 0,
        1, 1,
        0, 1
      );

      // Two triangles for the quad
      this.leaves.indices.push(
        startIndex, startIndex + 1, startIndex + 2,
        startIndex, startIndex + 2, startIndex + 3
      );
    }
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