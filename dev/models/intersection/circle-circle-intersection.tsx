import { getTwoCircleIntersectionPoints } from "../../../src"
import { CircleContent } from "../circle-model"

export function* iterateTwoCirclesIntersectionPoints(content1: CircleContent, content2: CircleContent) {
  yield* getTwoCircleIntersectionPoints(content1, content2)
}
