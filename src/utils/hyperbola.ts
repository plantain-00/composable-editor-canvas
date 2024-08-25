import { Position } from "./position"
import { and, number } from "./validators"

export interface Hyperbola extends Position {
  // (y + a)^2/a/a = x^2/b/b + 1
  a: number
  b: number
  angle: number
}

export const Hyperbola = /* @__PURE__ */ and(Position, {
  a: number,
  b: number,
  angle: number,
})
