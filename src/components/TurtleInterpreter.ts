import * as THREE from "three";

export interface TurtleState {
  position: THREE.Vector3;
  orientation: THREE.Euler;
  length: number;
  radius: number;
  depth: number;
  cumulativeTwist: number; // Track cumulative twist across segments
}

export interface TurtleConfig {
  initialLength: number;
  initialRadius: number;
  lengthScale: number;
  radiusScale: number;
  angleStep: number; // Default rotation angle in radians
  sectionCount: number; // Number of sections per segment
  faceCount: number; // Number of faces around circumference
  taper: number; // Taper factor per segment
  twist: number; // Twist amount per segment (rotation around Y axis in radians)
}

export class TurtleInterpreter {
  private config: TurtleConfig;
  private stateStack: TurtleState[] = [];
  private currentState: TurtleState;
  
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
    };
    this.branches = {
      verts: [],
      indices: [],
      normals: [],
      uvs: [],
    };
    
    // Initialize turtle at origin, pointing up
    this.currentState = {
      position: new THREE.Vector3(0, 0, 0),
      orientation: new THREE.Euler(0, 0, 0),
      length: config.initialLength,
      radius: config.initialRadius,
      depth: 0,
      cumulativeTwist: 0,
    };
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
    
    // Generate vertices for all sections
    for (let i = 0; i <= sectionCount; i++) {
      const t = i / sectionCount;
      const sectionRadius = radius * (1 - this.config.taper * t);
      
      // Apply twist: rotate around Y axis (roll) as we progress along the branch
      // Twist accumulates: start from previous cumulative twist, add twist for this segment
      const twistAngle = startTwist + this.config.twist * t;
      const twistQuaternion = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        twistAngle
      );
      
      // Calculate position along the branch
      const forward = new THREE.Vector3(0, 1, 0)
        .applyEuler(startOrientation)
        .multiplyScalar(sectionLength * i);
      
      const sectionPos = startPos.clone().add(forward);
      
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
        
        // Transform to world space
        const vertex = localVertex
          .clone()
          .applyEuler(startOrientation)
          .add(sectionPos);
        
        // Normal points outward - also apply twist
        const localNormal = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
        localNormal.applyQuaternion(twistQuaternion);
        const normal = localNormal.applyEuler(startOrientation);
        
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
    
    // Move turtle forward
    const forward = new THREE.Vector3(0, 1, 0)
      .applyEuler(this.currentState.orientation)
      .multiplyScalar(length);
    this.currentState.position.add(forward);
    
    // Update radius to the endpoint radius (after taper) so next segment continues from here
    const endpointRadius = radius * (1 - this.config.taper);
    this.currentState.radius = Math.max(endpointRadius, radius * 0.01); // Ensure minimum radius
    
    // Accumulate twist so next segment continues from where this one ended
    this.currentState.cumulativeTwist += this.config.twist;
  }

  /**
   * Update the configuration (useful when parameters change)
   */
  updateConfig(config: Partial<TurtleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Interpret an L-system string and generate geometry
   */
  interpret(lSystemString: string): void {
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

