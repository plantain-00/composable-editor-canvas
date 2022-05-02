import { Position } from "../../../src"
import { BaseContent } from "../model"

const intersectionCenter: {
  type1: string
  type2: string
  iterateIntersectionPoints(content1: BaseContent, content2: BaseContent): Generator<Position, void, unknown>
}[] = []

export function registerIntersection<T1 extends BaseContent, T2 extends BaseContent>(
  type1: T1['type'],
  type2: T2['type'],
  iterateIntersectionPoints: (content1: T1, content2: T2) => Generator<Position, void, unknown>,
) {
  intersectionCenter.push({ type1, type2, iterateIntersectionPoints })
}

export function* iterateIntersectionPoints(content1: BaseContent, content2: BaseContent) {
  let intersection = intersectionCenter.find((t) => t.type1 === content1.type && t.type2 === content2.type)
  if (intersection) {
    for (const p of intersection.iterateIntersectionPoints(content1, content2)) {
      yield { ...p, type: 'intersection' as const }
    }
  } else if (content1.type !== content2.type) {
    intersection = intersectionCenter.find((t) => t.type1 === content2.type && t.type2 === content1.type)
    if (intersection) {
      for (const p of intersection.iterateIntersectionPoints(content2, content1)) {
        yield { ...p, type: 'intersection' as const }
      }
    }
  }
}
