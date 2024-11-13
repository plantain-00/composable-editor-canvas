import { newtonIterates } from "./equation-calculater";
import { GeometryLine, getGeometryLineDerivatives } from "./geometry-line";
import { delta2 } from "./math";
import { Position } from "./position";

export function getCircleTangentTo2GeometryLinesNearParam(curve1: GeometryLine, curve2: GeometryLine, radius: number, t1: number, t2: number, center: Position): Position | undefined {
  const derivative1 = getGeometryLineDerivatives(curve1)
  const derivative2 = getGeometryLineDerivatives(curve2)
  const r = radius ** 2
  const f1 = (t: number[]): number[] => {
    const x = t[2], y = t[3]
    // (y - y1)/(x - x1)y1'/x1' = -1
    // (y - y2)/(x - x2)y2'/x2' = -1
    // (x - x1)^2 + (y - y1)^2 = r
    // (x - x2)^2 + (y - y2)^2 = r
    // z1 = (x - x1)x1' + (y - y1)y1'
    // z2 = (x - x2)x2' + (y - y2)y2'
    // z3 = (x - x1)^2 + (y - y1)^2 - r
    // z4 = (x - x2)^2 + (y - y2)^2 - r
    const [{ x: x1, y: y1 }, { x: x11, y: y11 }] = derivative1[0](t[0])
    const [{ x: x2, y: y2 }, { x: x21, y: y21 }] = derivative2[0](t[1])
    return [
      (x - x1) * x11 + (y - y1) * y11,
      (x - x2) * x21 + (y - y2) * y21,
      (x - x1) ** 2 + (y - y1) ** 2 - r,
      (x - x2) ** 2 + (y - y2) ** 2 - r,
    ]
  }
  const f2 = (t: number[]): number[][] => {
    const x = t[2], y = t[3]
    const [{ x: x1, y: y1 }, { x: x11, y: y11 }, { x: x12, y: y12 }] = derivative1[1](t[0])
    const [{ x: x2, y: y2 }, { x: x21, y: y21 }, { x: x22, y: y22 }] = derivative2[1](t[1])
    // dz1/dt1 = -x1' x1' + (x - x1)x1'' - y1'y1' + (y - y1)y1''
    // dz1/dt2 = 0
    // dz1/dx = x1'
    // dz1/dy = y1'
    // dz2/dt1 = 0
    // dz2/dt2 = -x2'x2' + (x - x2)x2'' + - y2'y2' + (y - y2)y2''
    // dz2/dx = x2'
    // dz2/dy = y2'
    // dz3/dt1 = 2 x1'(x1 - x) + 2 y1'(y1 - y)
    // dz3/dt2 = 0
    // dz3/dx = 2(x - x1)
    // dz3/dy = 2(y - y1)
    // dz4/dt1 = 0
    // dz4/dt2 = 2 x2'(x2 - x) + 2 y2'(y2 - y)
    // dz4/dx = 2(x - x2)
    // dz4/dy = 2(y - y2)
    return [
      [
        -x11 * x11 + (x - x1) * x12 - y11 * y11 + (y - y1) * y12,
        0,
        x11,
        y11,
      ],
      [
        0,
        -x21 * x21 + (x - x2) * x22 + - y21 * y21 + (y - y2) * y22,
        x21,
        y21,
      ],
      [
        2 * x11 * (x1 - x) + 2 * y11 * (y1 - y),
        0,
        2 * (x - x1),
        2 * (y - y1),
      ],
      [
        0,
        2 * x21 * (x2 - x) + 2 * y21 * (y2 - y),
        2 * (x - x2),
        2 * (y - y2),
      ],
    ]
  }
  const result = newtonIterates([t1, t2, center.x, center.y], f1, f2, delta2)
  if (!result) return
  return { x: result[2], y: result[3] }
}
