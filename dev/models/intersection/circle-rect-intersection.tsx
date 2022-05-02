import { getLineSegmentCircleIntersectionPoints } from "../../../src"
import { CircleContent } from "../circle-model"
import { iteratePolylineLines } from "../line-model"
import { getRectPoints, RectContent } from "../rect-model"

export function* iterateCircleRectIntersectionPoints(content1: CircleContent, content2: RectContent) {
  for (const line1 of iteratePolylineLines(getRectPoints(content2))) {
    yield* getLineSegmentCircleIntersectionPoints(...line1, content1)
  }
}
