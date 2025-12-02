import * as THREE from "three";
import seedrandom from "seedrandom";

export interface TurtleState {
  position: THREE.Vector3;
  orientation: THREE.Euler;
  length: number;
  radius: number;
  depth: number;
  cumulativeTwist: number; // Track cumulative twist across segments
  cumulativeDistance: number; // Track cumulative distance along trunk for global taper
}

export interface TurtleConfig {
  initialLength: number;
  initialRadius: number;
  lengthScale: number;
  radiusScale: number;
  angleStep: number; // Default rotation angle in radians
  sectionCount: number; // Number of sections per segment
  faceCount: number; // Number of faces around circumference
  taper: number; // Global taper factor (0-1): 1 = goes to point, <1 = stops at initialRadius * (1 - taper)
  twist: number; // Twist amount per segment (rotation around Y axis in radians)
  gnarliness?: number; // Amplitude of random rotation (0-1)
  upForce?: number; // Strength of upward bias (0-1)
  seed?: number; // Seed for RNG
}

export class TurtleInterpreter {
  private config: TurtleConfig;
  private stateStack: TurtleState[] = [];
  private currentState: TurtleState;
  private rng: seedrandom.PRNG;
  private totalTrunkLength: number = 0; // Total length of trunk for global taper calculation
  
  public branches: {
    verts: number[];
    indices: number[];
    normals: number[];
    uvs: number[];
  };

  constructor(config: TurtleConfig) {
    this.config = {
      ...config,
      twist: config.twist ?? 0, // Default twist to 0 if not provided
      gnarliness: config.gnarliness ?? 0,
      upForce: config.upForce ?? 0,
    };
    this.branches = {
      verts: [],
      indices: [],
      normals: [],
      uvs: [],
    };
    
    // Initialize RNG with seed from config
    this.rng = seedrandom(config.seed !== undefined ? String(config.seed) : undefined);
    
    // Initialize turtle at origin, pointing up
    this.currentState = {
      position: new THREE.Vector3(0, 0, 0),
      orientation: new THREE.Euler(0, 0, 0),
      length: config.initialLength,
      radius: config.initialRadius,
      depth: 0,
      cumulativeTwist: 0,
      cumulativeDistance: 0,
    };
  }

  /**
   * Calculate radius at normalized distance t along trunk (0 = base, 1 = tip)
   */
  private radiusAt(t: number): number {
    const baseRadius = this.config.initialRadius;
    const tipRadius = baseRadius * (1 - this.config.taper); // taper=1 → tip=0
    return baseRadius * (1 - t) + tipRadius * t; // Linear interpolation
  }

  /**
   * Extract parameters from a symbol like "F(1.5)" or "T(1.0, 2)"
   */
  private extractParams(symbolStr: string): number[] {
    const match = symbolStr.match(/\(([^)]+)\)/);
    if (!match) return [];
    
    return match[1].split(',').map(p => {
      const val = parseFloat(p.trim());
      return isNaN(val) ? 0 : val;
    });
  }

  /**
   * Draw a branch segment (F command)
   */
  private drawSegment(length: number, radius: number): void {
    const startIndex = this.branches.verts.length / 3;
    const sectionCount = this.config.sectionCount;
    const faceCount = this.config.faceCount;
    const sectionLength = length / sectionCount;
    
    const startPos = this.currentState.position.clone();
    const startOrientation = this.currentState.orientation.clone();
    const startTwist = this.currentState.cumulativeTwist; // Start from accumulated twist
    const startDistance = this.currentState.cumulativeDistance; // Start distance for global taper
    
    // Generate gnarliness rotations for this segment (trunk only)
    let yawJitter = 0;
    let pitchJitter = 0;
    if (this.config.gnarliness && this.config.gnarliness > 0 && this.currentState.depth === 0) {
      const amp = this.config.gnarliness * 0.1; // Scale to ~0-0.1 radians
      yawJitter = (this.rng() - 0.5) * 2 * amp;
      pitchJitter = (this.rng() - 0.5) * 2 * amp;
    }
    
    // Track position along curved path for smooth continuity
    let currentPos = startPos.clone();
    let currentDistance = startDistance;
    
    // Generate vertices for all sections
    for (let i = 0; i <= sectionCount; i++) {
      const tLocal = i / sectionCount; // Local t within segment (0-1)
      
      // Calculate global taper t based on cumulative distance along trunk
      let sectionRadius: number;
      if (this.currentState.depth === 0 && this.totalTrunkLength > 0) {
        // Trunk: use global taper
        const globalT = currentDistance / this.totalTrunkLength;
        sectionRadius = this.radiusAt(globalT);
      } else {
        // Branches: use per-segment taper (for now)
        sectionRadius = radius * (1 - this.config.taper * tLocal);
      }
      
      // Apply twist: rotate around Y axis (roll) as we progress along the branch
      // Twist accumulates: start from previous cumulative twist, add twist for this segment
      const twistAngle = startTwist + this.config.twist * tLocal;
      const twistQuaternion = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        twistAngle
      );
      
      // Apply gnarliness gradually along the segment
      // Create a modified orientation that curves gradually
      const gnarlinessOrientation = startOrientation.clone();
      gnarlinessOrientation.z += yawJitter * tLocal; // Gradually apply yaw
      gnarlinessOrientation.x += pitchJitter * tLocal; // Gradually apply pitch
      
      // Use current position (calculated from previous iteration)
      const sectionPos = currentPos.clone();
      
      // Update current position and distance for next iteration (move forward along curve)
      if (i < sectionCount) {
        // Calculate direction at current point along curve
        const direction = new THREE.Vector3(0, 1, 0).applyEuler(gnarlinessOrientation);
        // Move forward along the curve
        currentPos.add(direction.multiplyScalar(sectionLength));
        // Update cumulative distance for trunk
        if (this.currentState.depth === 0) {
          currentDistance += sectionLength;
        }
      }
      
      // Generate vertices around the circumference
      for (let j = 0; j < faceCount; j++) {
        const angle = (2 * Math.PI * j) / faceCount;
        
        // Create local vertex in XZ plane
        const localVertex = new THREE.Vector3(
          Math.cos(angle) * sectionRadius,
          0,
          Math.sin(angle) * sectionRadius
        );
        
        // Apply twist rotation to local vertex
        localVertex.applyQuaternion(twistQuaternion);
        
        // Transform to world space using gnarliness orientation
        const vertex = localVertex
          .clone()
          .applyEuler(gnarlinessOrientation)
          .add(sectionPos);
        
        // Normal points outward - also apply twist
        const localNormal = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
        localNormal.applyQuaternion(twistQuaternion);
        const normal = localNormal.applyEuler(gnarlinessOrientation);
        
        const uv = new THREE.Vector2(
          j / faceCount,
          i / sectionCount
        );
        
        this.branches.verts.push(vertex.x, vertex.y, vertex.z);
        this.branches.normals.push(normal.x, normal.y, normal.z);
        this.branches.uvs.push(uv.x, uv.y);
      }
    }
    
    // Generate indices with correct winding order (counter-clockwise for front-facing)
    for (let i = 0; i < sectionCount; i++) {
      for (let j = 0; j < faceCount; j++) {
        const current = startIndex + i * faceCount + j;
        const next = startIndex + i * faceCount + ((j + 1) % faceCount);
        const currentNext = startIndex + (i + 1) * faceCount + j;
        const nextNext = startIndex + (i + 1) * faceCount + ((j + 1) % faceCount);
        
        // First triangle - reversed winding order
        this.branches.indices.push(current, currentNext, next);
        // Second triangle - reversed winding order
        this.branches.indices.push(next, currentNext, nextNext);
      }
    }
    
    // Update turtle position to final position along curved path
    this.currentState.position.copy(currentPos);
    
    // Update orientation to match where we ended (with gnarliness)
    const finalOrientation = startOrientation.clone();
    if (this.config.gnarliness && this.config.gnarliness > 0 && this.currentState.depth === 0) {
      finalOrientation.z += yawJitter; // Full gnarliness applied at end
      finalOrientation.x += pitchJitter;
    }
    this.currentState.orientation.copy(finalOrientation);
    
    // Update cumulative distance for trunk
    if (this.currentState.depth === 0) {
      this.currentState.cumulativeDistance = currentDistance;
    }
    
    // Update radius based on global taper for trunk, or per-segment for branches
    if (this.currentState.depth === 0 && this.totalTrunkLength > 0) {
      const globalT = this.currentState.cumulativeDistance / this.totalTrunkLength;
      this.currentState.radius = this.radiusAt(globalT);
    } else {
      // Branches: use per-segment taper
      const endpointRadius = radius * (1 - this.config.taper);
      this.currentState.radius = Math.max(endpointRadius, radius * 0.01); // Ensure minimum radius
    }
    
    // Accumulate twist so next segment continues from where this one ended
    this.currentState.cumulativeTwist += this.config.twist;
  }

  /**
   * Update the configuration (useful when parameters change)
   */
  updateConfig(config: Partial<TurtleConfig>): void {
    this.config = { ...this.config, ...config };
    // Reinitialize RNG if seed changed
    if (config.seed !== undefined) {
      this.rng = seedrandom(String(config.seed));
    }
  }

  /**
   * Measurement pass: Calculate total trunk length without generating geometry
   */
  private measurePath(lSystemString: string): number {
    // Reset state for measurement
    const measureState: TurtleState = {
      position: new THREE.Vector3(0, 0, 0),
      orientation: new THREE.Euler(0, 0, 0),
      length: this.config.initialLength,
      radius: this.config.initialRadius,
      depth: 0,
      cumulativeTwist: 0,
      cumulativeDistance: 0,
    };
    const measureStack: TurtleState[] = [];
    let totalTrunkLength = 0;

    let i = 0;
    while (i < lSystemString.length) {
      const char = lSystemString[i];

      switch (char) {
        case 'F': {
          // Forward command - might have parameters F(length) or just F
          let length = measureState.length;

          // Check if there are parameters
          if (i + 1 < lSystemString.length && lSystemString[i + 1] === '(') {
            // Parse F(params)
            let j = i + 2;
            let paramStr = '';
            while (j < lSystemString.length && lSystemString[j] !== ')') {
              paramStr += lSystemString[j];
              j++;
            }

            const params = this.extractParams(lSystemString.substring(i, j + 1));
            if (params.length > 0) {
              length = params[0];
              // Note: radius parameter ignored in measurement pass
            }

            i = j + 1;
          } else {
            i++;
          }

          // Track trunk length (depth === 0)
          if (measureState.depth === 0) {
            totalTrunkLength += length;
            measureState.cumulativeDistance += length;
          }

          // Move forward
          const forward = new THREE.Vector3(0, 1, 0)
            .applyEuler(measureState.orientation)
            .multiplyScalar(length);
          measureState.position.add(forward);

          break;
        }

        case '+': {
          // Rotate around Z axis (yaw)
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          measureState.orientation.z += angle;
          break;
        }

        case '-': {
          // Rotate around Z axis (yaw) - opposite direction
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          measureState.orientation.z -= angle;
          break;
        }

        case '&': {
          // Pitch down
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          measureState.orientation.x += angle;
          break;
        }

        case '^': {
          // Pitch up
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          measureState.orientation.x -= angle;
          break;
        }

        case '\\': {
          // Roll right
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          measureState.orientation.y += angle;
          break;
        }

        case '/': {
          // Roll left
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          measureState.orientation.y -= angle;
          break;
        }

        case '[': {
          // Push current state onto stack
          measureStack.push({
            position: measureState.position.clone(),
            orientation: measureState.orientation.clone(),
            length: measureState.length,
            radius: measureState.radius,
            depth: measureState.depth,
            cumulativeTwist: measureState.cumulativeTwist,
            cumulativeDistance: measureState.cumulativeDistance,
          });

          // Scale down for next level
          measureState.length *= this.config.lengthScale;
          measureState.radius *= this.config.radiusScale;
          measureState.depth++;

          i++;
          break;
        }

        case ']': {
          // Pop state from stack
          if (measureStack.length > 0) {
            const savedState = measureStack.pop()!;
            measureState.position = savedState.position;
            measureState.orientation = savedState.orientation;
            measureState.length = savedState.length;
            measureState.radius = savedState.radius;
            measureState.depth = savedState.depth;
            measureState.cumulativeTwist = savedState.cumulativeTwist;
            measureState.cumulativeDistance = savedState.cumulativeDistance;
          }
          i++;
          break;
        }

        default: {
          // Skip unknown characters
          i++;
          break;
        }
      }
    }

    return totalTrunkLength;
  }

  /**
   * Interpret an L-system string and generate geometry
   */
  interpret(lSystemString: string): void {
    // Pass 1: Measure total trunk length for global taper
    this.totalTrunkLength = this.measurePath(lSystemString);
    
    // Pass 2: Generate geometry with global taper
    // Reset state
    this.branches = {
      verts: [],
      indices: [],
      normals: [],
      uvs: [],
    };
    
    this.currentState = {
      position: new THREE.Vector3(0, 0, 0),
      orientation: new THREE.Euler(0, 0, 0),
      length: this.config.initialLength,
      radius: this.config.initialRadius,
      depth: 0,
      cumulativeTwist: 0,
      cumulativeDistance: 0,
    };
    
    this.stateStack = [];
    
    let i = 0;
    while (i < lSystemString.length) {
      const char = lSystemString[i];
      
      switch (char) {
        case 'F': {
          // Forward command - might have parameters F(length) or just F
          let length = this.currentState.length;
          let radius = this.currentState.radius;
          
          // Check if there are parameters
          if (i + 1 < lSystemString.length && lSystemString[i + 1] === '(') {
            // Parse F(params)
            let j = i + 2;
            let paramStr = '';
            while (j < lSystemString.length && lSystemString[j] !== ')') {
              paramStr += lSystemString[j];
              j++;
            }
            
            const params = this.extractParams(lSystemString.substring(i, j + 1));
            if (params.length > 0) {
              length = params[0];
              if (params.length > 1) {
                radius = params[1];
              }
            }
            
            i = j + 1;
          } else {
            i++;
          }
          
          // Apply force (branches only, depth > 0)
          // Note: Gnarliness is now applied inside drawSegment() for smooth continuity
          if (this.config.upForce && this.config.upForce > 0 && this.currentState.depth > 0) {
            const forward = new THREE.Vector3(0, 1, 0).applyEuler(this.currentState.orientation);
            const up = new THREE.Vector3(0, 1, 0);
            
            // Optionally scale force by radius (thinner branches = stronger force)
            const forceHere = this.config.upForce * (1 - radius / this.config.initialRadius);
            
            // Lerp toward up
            const blendedForward = forward.clone().lerp(up, forceHere).normalize();
            
            // Calculate rotation needed to go from current forward to blended forward
            const quaternion = new THREE.Quaternion().setFromUnitVectors(forward, blendedForward);
            
            // Apply rotation to current orientation
            const currentQuaternion = new THREE.Quaternion().setFromEuler(this.currentState.orientation);
            currentQuaternion.multiply(quaternion);
            
            // Convert back to Euler
            const newEuler = new THREE.Euler().setFromQuaternion(currentQuaternion);
            this.currentState.orientation.x = newEuler.x;
            this.currentState.orientation.y = newEuler.y;
            this.currentState.orientation.z = newEuler.z;
          }
          
          this.drawSegment(length, radius);
          break;
        }
        
        case '+': {
          // Rotate around Z axis (yaw) - may have angle parameter like +0.4
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            // Parse angle parameter
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          this.currentState.orientation.z += angle;
          break;
        }
        
        case '-': {
          // Rotate around Z axis (yaw) - opposite direction - may have angle parameter like -0.4
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            // Parse angle parameter
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          this.currentState.orientation.z -= angle;
          break;
        }
        
        case '&': {
          // Pitch down - may have angle parameter
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          this.currentState.orientation.x += angle;
          break;
        }
        
        case '^': {
          // Pitch up - may have angle parameter
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          this.currentState.orientation.x -= angle;
          break;
        }
        
        case '\\': {
          // Roll right - may have angle parameter
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          this.currentState.orientation.y += angle;
          break;
        }
        
        case '/': {
          // Roll left - may have angle parameter
          let angle = this.config.angleStep;
          if (i + 1 < lSystemString.length && /[\d.]/.test(lSystemString[i + 1])) {
            let j = i + 1;
            let angleStr = '';
            while (j < lSystemString.length && /[\d.]/.test(lSystemString[j])) {
              angleStr += lSystemString[j];
              j++;
            }
            const parsedAngle = parseFloat(angleStr);
            if (!isNaN(parsedAngle)) {
              angle = parsedAngle;
            }
            i = j;
          } else {
            i++;
          }
          this.currentState.orientation.y -= angle;
          break;
        }
        
        case '[': {
          // Push current state onto stack
          this.stateStack.push({
            position: this.currentState.position.clone(),
            orientation: this.currentState.orientation.clone(),
            length: this.currentState.length,
            radius: this.currentState.radius,
            depth: this.currentState.depth,
            cumulativeTwist: this.currentState.cumulativeTwist,
            cumulativeDistance: this.currentState.cumulativeDistance,
          });
          
          // Scale down for next level
          this.currentState.length *= this.config.lengthScale;
          this.currentState.radius *= this.config.radiusScale;
          this.currentState.depth++;
          
          i++;
          break;
        }
        
        case ']': {
          // Pop state from stack
          if (this.stateStack.length > 0) {
            const savedState = this.stateStack.pop()!;
            this.currentState = {
              position: savedState.position,
              orientation: savedState.orientation,
              length: savedState.length,
              radius: savedState.radius,
              depth: savedState.depth,
              cumulativeTwist: savedState.cumulativeTwist,
              cumulativeDistance: savedState.cumulativeDistance,
            };
          }
          i++;
          break;
        }
        
        default: {
          // Skip unknown characters (might be parametric symbols that were already expanded)
          i++;
          break;
        }
      }
    }
  }

  /**
   * Create Three.js geometry from the interpreted branches
   */
  createGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.branches.verts, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.branches.normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.branches.uvs, 2));
    geometry.setIndex(this.branches.indices);
    
    return geometry;
  }
}

