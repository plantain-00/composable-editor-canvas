import { Position } from "./position";
import { angleToRadian } from "./radian";
import { Vec3 } from "./types";

/**
 * @public
 */
export const m3 = {
  projection(width: number, height: number): Matrix {
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
  },
  identity(): Matrix {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
  },
  translation(tx: number, ty: number): Matrix {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
  },
  rotation(angleInRadians: number): Matrix {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    return [
      c, -s, 0,
      s, c, 0,
      0, 0, 1,
    ];
  },
  scaling(sx: number, sy: number): Matrix {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ]
  },
  multiply(a: Matrix, b: Matrix): Matrix {
    return [
      b[0] * a[0] + b[1] * a[3] + b[2] * a[6],
      b[0] * a[1] + b[1] * a[4] + b[2] * a[7],
      b[0] * a[2] + b[1] * a[5] + b[2] * a[8],
      b[3] * a[0] + b[4] * a[3] + b[5] * a[6],
      b[3] * a[1] + b[4] * a[4] + b[5] * a[7],
      b[3] * a[2] + b[4] * a[5] + b[5] * a[8],
      b[6] * a[0] + b[7] * a[3] + b[8] * a[6],
      b[6] * a[1] + b[7] * a[4] + b[8] * a[7],
      b[6] * a[2] + b[7] * a[5] + b[8] * a[8],
    ]
  },
  multiplyVec3(a: Matrix, b: Vec3): Vec3 {
    return [
      b[0] * a[0] + b[1] * a[3] + b[2] * a[6],
      b[0] * a[1] + b[1] * a[4] + b[2] * a[7],
      b[0] * a[2] + b[1] * a[5] + b[2] * a[8],
    ];
  },
  inverse([a0, a1, a2, a3, a4, a5, a6, a7, a8]: Matrix): Matrix {
    // F1: b0 a0 + b1 a3 + b2 a6 - 1 = 0
    // F2: b0 a1 + b1 a4 + b2 a7 = 0
    // F3: b0 a2 + b1 a5 + b2 a8 = 0
    // F1*a7-F2*a6=F4: (a0 a7 - a1 a6) b0 + (a3 a7 - a4 a6) b1 - a7 = 0
    // F1*a8-F3*a6=F5: (a0 a8 - a2 a6) b0 + (a3 a8 - a5 a6) b1 - a8 = 0
    // F4*(a3 a8 - a5 a6)-F5*(a3 a7 - a4 a6), group by b0: (-a2 a4 a6 + a1 a5 a6 + a2 a3 a7 - a0 a5 a7 - a1 a3 a8 + a0 a4 a8) b0 + a5 a7 - a4 a8 = 0
    const c1 = a4 * a8 - a5 * a7, c3 = a1 * a5 - a2 * a4, c5 = a2 * a7 - a1 * a8
    // c = -a2 a4 a6 + a1 a5 a6 + a2 a3 a7 - a0 a5 a7 - a1 a3 a8 + a0 a4 a8
    const c = c3 * a6 + a3 * c5 + a0 * c1
    // b0 = -(a5 a7 - a4 a8) / c
    const b0 = c1 / c
    // F4*c replace b0, /(a4 a6 - a3 a7) group by b1: (a2 a4 a6 - a1 a5 a6 - a2 a3 a7 + a0 a5 a7 + a1 a3 a8 - a0 a4 a8) b1 + a2 a7 - a1 a8 = 0
    // b1 = (a2 a7 - a1 a8) / c
    const b1 = c5 / c
    // F1*c replace b0,b1, /a6, group by b2: (-a2 a4 a6 + a1 a5 a6 + a2 a3 a7 - a0 a5 a7 - a1 a3 a8 + a0 a4 a8) b2 + a2 a4 - a1 a5 = 0
    // b2 = (a1 a5 - a2 a4) / c
    const b2 = c3 / c

    // F1: b3 a0 + b4 a3 + b5 a6 = 0
    // F2: b3 a1 + b4 a4 + b5 a7 - 1 = 0
    // F3: b3 a2 + b4 a5 + b5 a8 = 0
    // F1*a7-F2*a6=F4: (-a1 a6 + a0 a7) b3 + (a3 a7 - a4 a6) b4 + a6 = 0
    // F1*a8-F3*a6=F5: (-a2 a6 + a0 a8) b3 + (a3 a8 - a5 a6) b4 = 0
    // F4*(a3 a8 - a5 a6)-F5*(a3 a7 - a4 a6), /a6, group by b3: (-a2 a4 a6 + a1 a5 a6 + a2 a3 a7 + -a0 a5 a7 + -a1 a3 a8 + a0 a4 a8) b3 + -a5 a6 + a3 a8 = 0
    // b3 = (a5 a6 - a3 a8) / c
    const b3 = (a5 * a6 - a3 * a8) / c
    // F4*c replace b3, /(a4 a6 - a3 a7) group by b4: -a2 a6 + a0 a8 + -b4 c = 0
    // b4 = (-a2 a6 + a0 a8) / c
    const b4 = (-a2 * a6 + a0 * a8) / c
    // F1*c replace b3,b4, /a6, group by b5: -a2 a3 + a0 a5 + b5 c = 0
    // b5 = (a2 a3 - a0 a5) / c
    const b5 = (a2 * a3 - a0 * a5) / c

    // F1: b6 a0 + b7 a3 + b8 a6 = 0
    // F2: b6 a1 + b7 a4 + b8 a7 = 0
    // F3: b6 a2 + b7 a5 + b8 a8 - 1 = 0
    // F1*a7-F2*a6=F4: (-a1 a6 + a0 a7) b6 + (-a4 a6 + a3 a7) b7 = 0
    // F1*a8-F3*a6=F5: (-a2 a6 + a0 a8) b6 + (-a5 a6 + a3 a8) b7 + a6 = 0
    // F4*(a3 a8 - a5 a6)-F5*(a3 a7 - a4 a6), /a6, group by b6: (-a2 a4 a6 + a1 a5 a6 + a2 a3 a7 + -a0 a5 a7 + -a1 a3 a8 + a0 a4 a8) b6 + a4 a6 + -a3 a7 = 0
    // b6 = (a3 a7 - a4 a6) / c
    const b6 = (a3 * a7 - a4 * a6) / c
    // F4*c replace b6, /(a4 a6 - a3 a7) group by b7: -c b7 + a1 a6 + -a0 a7 = 0
    // b7 = (a1 a6 + -a0 a7) / c
    const b7 = (a1 * a6 - a0 * a7) / c
    // F1*c replace b6,b7, /a6, group by b5: c b8 + a1 a3 + -a0 a4 = 0
    // b8 = (a0 a4 - a1 a3) / c
    const b8 = (a0 * a4 - a1 * a3) / c

    return [b0, b1, b2, b3, b4, b5, b6, b7, b8]
  },
  getTransform(m: Matrix) {
    return [m[0], m[1], m[3], m[4], m[6], m[7]] as const
  },
  getTransformInit(m: Matrix) {
    return {
      a: m[0],
      b: m[1],
      c: m[3],
      d: m[4],
      e: m[6],
      f: m[7],
    }
  },
};

export type Matrix = readonly [number, number, number, number, number, number, number, number, number]

export function getRenderOptionsMatrix(
  options?: Partial<{
    translate: Position
    base: Position
    angle: number
    rotation: number
    matrix: Matrix
  }>,
) {
  if (!options) return
  let matrix = m3.identity()
  if (options.translate) {
    matrix = m3.multiply(matrix, m3.translation(options.translate.x, options.translate.y))
  }
  if (options.base && (options.angle || options.rotation)) {
    matrix = m3.multiply(matrix, m3.translation(options.base.x, options.base.y))
    if (options.angle) {
      matrix = m3.multiply(matrix, m3.rotation(-angleToRadian(options.angle)))
    } else if (options.rotation) {
      matrix = m3.multiply(matrix, m3.rotation(-options.rotation))
    }
    matrix = m3.multiply(matrix, m3.translation(-options.base.x, -options.base.y))
  }
  if (options.matrix) {
    matrix = m3.multiply(matrix, options.matrix)
  }
  return matrix
}

export function multiplyMatrix(a: Matrix | undefined, b: Matrix | undefined) {
  if (a === undefined) return b
  if (b === undefined) return a
  return m3.multiply(a, b)
}
