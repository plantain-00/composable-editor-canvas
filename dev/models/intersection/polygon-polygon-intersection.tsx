import { getTwoLinesIntersectionPoint } from "../../../src"
import { iteratePolygonLines, PolygonContent } from "../polygon-model"

export function* iterateTwoPolygonsIntersectionPoints(content1: PolygonContent, content2: PolygonContent) {
  for (const line1 of iteratePolygonLines(content1.points)) {
    for (const line2 of iteratePolygonLines(content2.points)) {
      const point = getTwoLinesIntersectionPoint(...line1, ...line2)
      if (point) {
        yield point
      }
    }
  }
}
