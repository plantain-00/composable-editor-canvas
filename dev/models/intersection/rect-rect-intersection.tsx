import { getTwoLinesIntersectionPoint } from "../../../src"
import { iteratePolylineLines } from "../line-model"
import { getRectPoints, RectContent } from "../rect-model"

export function* iterateTwoRectsIntersectionPoints(content1: RectContent, content2: RectContent) {
  for (const line1 of iteratePolylineLines(getRectPoints(content1))) {
    for (const line2 of iteratePolylineLines(getRectPoints(content2))) {
      const point = getTwoLinesIntersectionPoint(...line1, ...line2)
      if (point) {
        yield point
      }
    }
  }
}
