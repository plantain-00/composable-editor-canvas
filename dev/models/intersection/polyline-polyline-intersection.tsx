import { getTwoLinesIntersectionPoint } from "../../../src"
import { iteratePolylineLines, LineContent } from "../line-model"

export function* iterateTwoPolylinesIntersectionPoints(content1: LineContent, content2: LineContent) {
  for (const line1 of iteratePolylineLines(content1.points)) {
    for (const line2 of iteratePolylineLines(content2.points)) {
      const point = getTwoLinesIntersectionPoint(...line1, ...line2)
      if (point) {
        yield point
      }
    }
  }
}
