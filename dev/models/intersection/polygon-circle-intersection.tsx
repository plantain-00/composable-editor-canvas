import { getLineSegmentCircleIntersectionPoints } from "../../../src"
import { CircleContent } from "../circle-model"
import { iteratePolygonLines, PolygonContent } from "../polygon-model"

export function* iteratePolygonCircleIntersectionPoints(content1: PolygonContent, content2: CircleContent) {
  for (const line1 of iteratePolygonLines(content1.points)) {
    yield* getLineSegmentCircleIntersectionPoints(...line1, content2)
  }
}
