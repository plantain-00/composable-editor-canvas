import { getTwoLinesIntersectionPoint } from "../../../src"
import { iteratePolylineLines } from "../line-model"
import { iteratePolygonLines, PolygonContent } from "../polygon-model"
import { getRectPoints, RectContent } from "../rect-model"

export function* iteratePolygonRectIntersectionPoints(content1: PolygonContent, content2: RectContent) {
  for (const line1 of iteratePolylineLines(getRectPoints(content2))) {
    for (const line2 of iteratePolygonLines(content1.points)) {
      const point = getTwoLinesIntersectionPoint(...line1, ...line2)
      if (point) {
        yield point
      }
    }
  }
}
