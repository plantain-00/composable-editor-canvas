import { getLineSegmentCircleIntersectionPoints } from "../../../src"
import { CircleContent } from "../circle-model"
import { iteratePolylineLines, LineContent } from "../line-model"

export function* iterateCirclePolylineIntersectionPoints(content1: CircleContent, content2: LineContent) {
  for (const line1 of iteratePolylineLines(content2.points)) {
    yield* getLineSegmentCircleIntersectionPoints(...line1, content1)
  }
}
