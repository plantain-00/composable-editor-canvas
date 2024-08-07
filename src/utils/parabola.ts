import { Position } from "./position"
import { and, number } from "./validators"

export interface Parabola extends Position {
  p: number
  angle: number
}

export const Parabola = /* @__PURE__ */ and(Position, {
  p: number,
  angle: number,
})

export interface ParabolaSegment extends Parabola {
  t1: number
  t2: number
}

export const ParabolaSegment = /* @__PURE__ */ and(Parabola, {
  t1: number,
  t2: number,
})
