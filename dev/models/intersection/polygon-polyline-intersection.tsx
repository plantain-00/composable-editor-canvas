import { getTwoLinesIntersectionPoint } from "../../../src"
import { iteratePolylineLines, LineContent } from "../line-model"
import { iteratePolygonLines, PolygonContent } from "../polygon-model"

export function* iteratePolygonPolylineIntersectionPoints(content1: PolygonContent, content2: LineContent) {
  for (const line1 of iteratePolygonLines(content1.points)) {
    for (const line2 of iteratePolylineLines(content2.points)) {
      const point = getTwoLinesIntersectionPoint(...line1, ...line2)
      if (point) {
        yield point
      }
    }
  }
}
