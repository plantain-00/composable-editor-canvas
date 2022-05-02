import { getTwoLinesIntersectionPoint } from "../../../src"
import { iteratePolylineLines, LineContent } from "../line-model"
import { getRectPoints, RectContent } from "../rect-model"

export function* iterateRectPolylineIntersectionPoints(content1: RectContent, content2: LineContent) {
  for (const line1 of iteratePolylineLines(content2.points)) {
    for (const line2 of iteratePolylineLines(getRectPoints(content1))) {
      const point = getTwoLinesIntersectionPoint(...line1, ...line2)
      if (point) {
        yield point
      }
    }
  }
}
