import { Circle } from "./circle";
import { newtonIterate2, newtonIterates } from "./equation-calculater";
import { GeometryLine, getGeometryLineDerivatives } from "./geometry-line";
import { delta2 } from "./math";
import { Matrix2 } from "./matrix";
import { getTwoPointsDistance, Position } from "./position";
import { Tuple2, Vec2 } from "./types";

/**
 * @deprecated
 */
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

export function getCircleTangentToTwoGeometryLinesNearParam(curve1: GeometryLine, curve2: GeometryLine, radius: number, t1: number, t2: number): Position | undefined {
  const derivative1 = getGeometryLineDerivatives(curve1)
  const derivative2 = getGeometryLineDerivatives(curve2)
  const r = radius ** 2
  // (y - y1)/(x - x1)y1'/x1' = -1
  // (y - y2)/(x - x2)y2'/x2' = -1
  // (x - x1)x1' + (y - y1)y1' = 0
  // (x - x2)x2' + (y - y2)y2' = 0
  // x x1' - x1 x1' + y y1' - y1 y1' = 0
  // x x2' - x2 x2' + y y2' - y2 y2' = 0
  // let a1 = x1 x1' + y1 y1', a2 = x2 x2' + y2 y2'
  // x x1' + y y1' = a1
  // x x2' + y y2' = a2
  // x x1' x2' + y y1' x2' = a1 x2'
  // x x1' x2' + y y2' x1' = a2 x1'
  // y(y1' x2' - y2' x1') = a1 x2' - a2 x1'
  // let a5 = a1 x2' - a2 x1', a6 = y1' x2' - y2' x1'
  // y = a5 / a6
  // x x1' y2' + y y1' y2' = a1 y2'
  // x x2' y1' + y y1' y2' = a2 y1'
  // x(x1' y2' - x2' y1') = a1 y2' - a2 y1'
  // let a3 = a1 y2' - a2 y1', a4 = x1' y2' - x2' y1'
  // x = a3 / a4

  // (x - x1)^2 + (y - y1)^2 = r
  // (x - x2)^2 + (y - y2)^2 = r
  // z1 = (x - x1)^2 + (y - y1)^2 - r
  // z2 = (x - x2)^2 + (y - y2)^2 - r

  const getVariables = (p1: Tuple2<Position>, p2: Tuple2<Position>) => {
    const [{ x: x1, y: y1 }, { x: x11, y: y11 }] = p1
    const [{ x: x2, y: y2 }, { x: x21, y: y21 }] = p2
    const a1 = x1 * x11 + y1 * y11, a2 = x2 * x21 + y2 * y21
    const a3 = a1 * y21 - a2 * y11, a4 = x11 * y21 - x21 * y11
    const a5 = a1 * x21 - a2 * x11, a6 = y11 * x21 - y21 * x11
    const x = a3 / a4
    const y = a5 / a6
    return { x, y, a1, a2, a3, a4, a5, a6, x1, y1, x2, y2, x11, y11, x21, y21 }
  }

  const f1 = (t: Vec2): Vec2 => {
    const p1 = derivative1[0](t[0])
    const p2 = derivative2[0](t[1])
    const { x, y, x1, y1, x2, y2 } = getVariables(p1, p2)
    return [
      (x - x1) ** 2 + (y - y1) ** 2 - r,
      (x - x2) ** 2 + (y - y2) ** 2 - r,
    ]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const [p10, p11, { x: x12, y: y12 }] = derivative1[1](t[0])
    const [p20, p21, { x: x22, y: y22 }] = derivative2[1](t[1])
    const { x, y, a1, a2, a3, a4, a5, a6, x1, y1, x2, y2, x11, y11, x21, y21 } = getVariables([p10, p11], [p20, p21])

    // a1' = (x1 x1' + y1 y1')'
    // a1' = x1'^2 + x1 x1'' + y1'^2 + y1 y1''
    // a2' = (x2 x2' + y2 y2')'
    // a2' = x2'^2 + x2 x2'' + y2'^2 + y2 y2''
    const a11 = x11 ** 2 + x1 * x12 + y11 ** 2 + y1 * y12
    const a21 = x21 ** 2 + x2 * x22 + y21 ** 2 + y2 * y22

    // da3/dt1 = a1' y2' - a2 y1''
    // da3/dt2 = a1 y2'' - a2' y1'
    // da4/dt1 = x1'' y2' - x2' y1''
    // da4/dt2 = x1' y2'' - x2'' y1'
    const a31 = a11 * y21 - a2 * y12
    const a32 = a1 * y22 - a21 * y11
    const a41 = x12 * y21 - x21 * y12
    const a42 = x11 * y22 - x22 * y11

    // da5/dt1 = a1' x2' - a2 x1''
    // da5/dt2 = a1 x2'' - a2' x1'
    // da6/dt1 = y1'' x2' - y2' x1''
    // da6/dt2 = y1' x2'' - y2'' x1'
    const a51 = a11 * x21 - a2 * x12
    const a52 = a1 * x22 - a21 * x11
    const a61 = y12 * x21 - y21 * x12
    const a62 = y11 * x22 - y22 * x11

    // x' = (a3/a4)'
    // dx/dt1 = (a4 da3/dt1 - a3 da4/dt1)/a4/a4
    // dx/dt2 = (a4 da3/dt2 - a3 da4/dt2)/a4/a4
    // y' = (a5/a6)'
    // dy/dt1 = (a6 da5/dt1 - a5 da6/dt1)/a6/a6
    // dy/dt2 = (a6 da5/dt2 - a5 da6/dt2)/a6/a6
    const xt1 = (a4 * a31 - a3 * a41) / a4 / a4
    const xt2 = (a4 * a32 - a3 * a42) / a4 / a4
    const yt1 = (a6 * a51 - a5 * a61) / a6 / a6
    const yt2 = (a6 * a52 - a5 * a62) / a6 / a6

    // dz1/dt1 = 2(x - x1)(dx/dt1 - x1') + 2(y - y1)dy/dt1
    // dz1/dt2 = 2(x - x1)dx/dt2 + 2(y - y1)(dy/dt2 - y1')
    // dz2/dt1 = 2(x - x2)dx/dt1 + 2(y - y2)dy/dt1
    // dz2/dt2 = 2(x - x2)(dx/dt2 - x2') + 2(y - y2)(dy/dt2 - y2')
    return [
      2 * (x - x1) * (xt1 - x11) + 2 * (y - y1) * yt1,
      2 * (x - x1) * xt2 + 2 * (y - y1) * (yt2 - y11),
      2 * (x - x2) * xt1 + 2 * (y - y2) * yt1,
      2 * (x - x2) * (xt2 - x21) + 2 * (y - y2) * (yt2 - y21),
    ]
  }
  const result = newtonIterate2([t1, t2], f1, f2, delta2)
  if (!result) return
  const p1 = derivative1[0](result[0])
  const p2 = derivative2[0](result[1])
  return getVariables(p1, p2)
}

export function getCircleTangentToThreeGeometryLinesNearParam(curve1: GeometryLine, curve2: GeometryLine, curve3: GeometryLine, t1: number, t2: number, t3: number): Circle | undefined {
  const derivative1 = getGeometryLineDerivatives(curve1)
  const derivative2 = getGeometryLineDerivatives(curve2)
  const derivative3 = getGeometryLineDerivatives(curve3)
  // (y - y1)/(x - x1)y1'/x1' = -1
  // (y - y2)/(x - x2)y2'/x2' = -1
  // (x - x1)x1' + (y - y1)y1' = 0
  // (x - x2)x2' + (y - y2)y2' = 0
  // x x1' - x1 x1' + y y1' - y1 y1' = 0
  // x x2' - x2 x2' + y y2' - y2 y2' = 0
  // let a1 = x1 x1' + y1 y1', a2 = x2 x2' + y2 y2'
  // x x1' + y y1' = a1
  // x x2' + y y2' = a2
  // x x1' x2' + y y1' x2' = a1 x2'
  // x x1' x2' + y y2' x1' = a2 x1'
  // y(y1' x2' - y2' x1') = a1 x2' - a2 x1'
  // let a5 = a1 x2' - a2 x1', a6 = y1' x2' - y2' x1'
  // y = a5 / a6
  // x x1' y2' + y y1' y2' = a1 y2'
  // x x2' y1' + y y1' y2' = a2 y1'
  // x(x1' y2' - x2' y1') = a1 y2' - a2 y1'
  // let a3 = a1 y2' - a2 y1', a4 = x1' y2' - x2' y1'
  // x = a3 / a4

  // (x - x1)^2 + (y - y1)^2 = (x - x2)^2 + (y - y2)^2 = (x - x3)^2 + (y - y3)^2
  // z1 = (x - x1)^2 + (y - y1)^2 - (x - x3)^2 - (y - y3)^2
  // z2 = (x - x2)^2 + (y - y2)^2 - (x - x3)^2 - (y - y3)^2
  // (y - y3)/(x - x3)y3'/x3' = -1
  // (x - x3)x3' + (y - y3)y3' = 0
  // z3 = (x - x3)x3' + (y - y3)y3'

  const getVariables = (p1: Tuple2<Position>, p2: Tuple2<Position>, p3: Tuple2<Position>) => {
    const [{ x: x1, y: y1 }, { x: x11, y: y11 }] = p1
    const [{ x: x2, y: y2 }, { x: x21, y: y21 }] = p2
    const [{ x: x3, y: y3 }, { x: x31, y: y31 }] = p3
    const a1 = x1 * x11 + y1 * y11, a2 = x2 * x21 + y2 * y21
    const a3 = a1 * y21 - a2 * y11, a4 = x11 * y21 - x21 * y11
    const a5 = a1 * x21 - a2 * x11, a6 = y11 * x21 - y21 * x11
    const x = a3 / a4
    const y = a5 / a6
    return { x, y, a1, a2, a3, a4, a5, a6, x1, y1, x2, y2, x11, y11, x21, y21, x3, y3, x31, y31 }
  }

  const f1 = (t: number[]): number[] => {
    const p1 = derivative1[0](t[0])
    const p2 = derivative2[0](t[1])
    const p3 = derivative3[0](t[2])
    const { x, y, x1, y1, x2, y2, x3, y3, x31, y31 } = getVariables(p1, p2, p3)
    return [
      (x - x1) ** 2 + (y - y1) ** 2 - (x - x3) ** 2 - (y - y3) ** 2,
      (x - x2) ** 2 + (y - y2) ** 2 - (x - x3) ** 2 - (y - y3) ** 2,
      (x - x3) * x31 + (y - y3) * y31,
    ]
  }

  const f2 = (t: number[]): number[][] => {
    const [p10, p11, { x: x12, y: y12 }] = derivative1[1](t[0])
    const [p20, p21, { x: x22, y: y22 }] = derivative2[1](t[1])
    const [p30, p31, { x: x32, y: y32 }] = derivative3[1](t[2])
    const { x, y, a1, a2, a3, a4, a5, a6, x1, y1, x2, y2, x11, y11, x21, y21, x3, y3, x31, y31 } = getVariables([p10, p11], [p20, p21], [p30, p31])

    // a1' = (x1 x1' + y1 y1')'
    // a1' = x1'^2 + x1 x1'' + y1'^2 + y1 y1''
    // a2' = (x2 x2' + y2 y2')'
    // a2' = x2'^2 + x2 x2'' + y2'^2 + y2 y2''
    const a11 = x11 ** 2 + x1 * x12 + y11 ** 2 + y1 * y12
    const a21 = x21 ** 2 + x2 * x22 + y21 ** 2 + y2 * y22

    // da3/dt1 = a1' y2' - a2 y1''
    // da3/dt2 = a1 y2'' - a2' y1'
    // da4/dt1 = x1'' y2' - x2' y1''
    // da4/dt2 = x1' y2'' - x2'' y1'
    const a31 = a11 * y21 - a2 * y12
    const a32 = a1 * y22 - a21 * y11
    const a41 = x12 * y21 - x21 * y12
    const a42 = x11 * y22 - x22 * y11

    // da5/dt1 = a1' x2' - a2 x1''
    // da5/dt2 = a1 x2'' - a2' x1'
    // da6/dt1 = y1'' x2' - y2' x1''
    // da6/dt2 = y1' x2'' - y2'' x1'
    const a51 = a11 * x21 - a2 * x12
    const a52 = a1 * x22 - a21 * x11
    const a61 = y12 * x21 - y21 * x12
    const a62 = y11 * x22 - y22 * x11

    // x' = (a3/a4)'
    // dx/dt1 = (a4 da3/dt1 - a3 da4/dt1)/a4/a4
    // dx/dt2 = (a4 da3/dt2 - a3 da4/dt2)/a4/a4
    // y' = (a5/a6)'
    // dy/dt1 = (a6 da5/dt1 - a5 da6/dt1)/a6/a6
    // dy/dt2 = (a6 da5/dt2 - a5 da6/dt2)/a6/a6
    const xt1 = (a4 * a31 - a3 * a41) / a4 / a4
    const xt2 = (a4 * a32 - a3 * a42) / a4 / a4
    const yt1 = (a6 * a51 - a5 * a61) / a6 / a6
    const yt2 = (a6 * a52 - a5 * a62) / a6 / a6

    // dz1/dt1 = 2(x - x1)(dx/dt1 - x1') + 2(y - y1)dy/dt1 - 2(x - x3)dx/dt1 - 2(y - y3)dy/dt1
    // dz1/dt2 = 2(x - x1)dx/dt2 + 2(y - y1)(dy/dt2 - y1') - 2(x - x3)dx/dt2 - 2(y - y3)dy/dt2
    // dz1/dt3 = 2(x - x3)x3' + 2(y - y3)y3'
    // dz2/dt1 = 2(x - x2)dx/dt1 + 2(y - y2)dy/dt1 - 2(x - x3)dx/dt1 - 2(y - y3)dy/dt1
    // dz2/dt2 = 2(x - x2)(dx/dt2 - x2') + 2(y - y2)(dy/dt2 - y2') - 2(x - x3)dx/dt2 - 2(y - y3)dy/dt2
    // dz2/dt3 = 2(x - x3)x3' + 2(y - y3)y3'
    // dz3/dt1 = dx/dt1 x3' + dy/dt1 y3'
    // dz3/dt2 = dx/dt2 x3' + dy/dt2 y3'
    // dz3/dt3 = -x3' x3' + (x - x3)x3'' - y3' y3' + (y - y3)y3''
    return [
      [
        2 * (x - x1) * (xt1 - x11) + 2 * (y - y1) * yt1 - 2 * (x - x3) * xt1 - 2 * (y - y3) * yt1,
        2 * (x - x1) * xt2 + 2 * (y - y1) * (yt2 - y11) - 2 * (x - x3) * xt2 - 2 * (y - y3) * yt2,
        2 * (x - x3) * x31 + 2 * (y - y3) * y31,
      ],
      [
        2 * (x - x2) * xt1 + 2 * (y - y2) * yt1 - 2 * (x - x3) * xt1 - 2 * (y - y3) * yt1,
        2 * (x - x2) * (xt2 - x21) + 2 * (y - y2) * (yt2 - y21) - 2 * (x - x3) * xt2 - 2 * (y - y3) * yt2,
        2 * (x - x3) * x31 + 2 * (y - y3) * y31,
      ],
      [
        xt1 * x31 + yt1 * y31,
        xt2 * x31 + yt2 * y31,
        -x31 * x31 + (x - x3) * x32 - y31 * y31 + (y - y3) * y32,
      ],
    ]
  }
  const result = newtonIterates([t1, t2, t3], f1, f2, delta2)
  if (!result) return
  const p1 = derivative1[0](result[0])
  const p2 = derivative2[0](result[1])
  const p3 = derivative3[0](result[2])
  const v = getVariables(p1, p2, p3)
  return {
    ...v,
    r: getTwoPointsDistance(v, { x: v.x1, y: v.y1 }),
  }
}
