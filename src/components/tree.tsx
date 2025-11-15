import * as THREE from "three";
import seedrandom from "seedrandom";

class RNG {
  private rng: () => number;

  constructor(seed?: number) {
    this.rng = seedrandom(seed?.toString());
  }

  next(): number {
    return this.rng();
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
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
  }
}

class Tree {
  options: TreeOptions;
  rng: RNG;
  branchQueue: Branch[];

  constructor(options: TreeOptions) {
    this.options = options;
    this.rng = new RNG(this.options?.seed);
    this.branchQueue = [];
  }

  generate() {

    this.rng = new RNG(this.options?.seed);

    this.branchQueue.push(
      {
        origin: new THREE.Vector3(0, 0, 0),
        orientation: new THREE.Euler(0, 0, 0),
        length: 1,
        radius: 1,
        level: 0,
        sectionCount: 1,
        segmentCount: 1,
      }
    )

  }
}