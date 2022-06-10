import { Circle, getLineSegmentCircleIntersectionPoints, getTwoCircleIntersectionPoints, getTwoLineSegmentsIntersectionPoint, Position } from "./geometry"

/**
 * @public
 */
export function* iterateIntersectionPoints<T>(
  content1: T,
  content2: T,
  contents: readonly T[],
  getModel: (content: T) => {
    getCircle?: (content: T) => { circle: Circle },
    getLines?: (content: T, contents: readonly T[]) => { lines: [Position, Position][] },
  } | undefined,
) {
  const model1 = getModel(content1)
  const model2 = getModel(content2)
  if (model1 && model2) {
    if (model1.getCircle && model2.getCircle) {
      yield* getTwoCircleIntersectionPoints(model1.getCircle(content1).circle, model1.getCircle(content2).circle)
    } else if (model1.getCircle && model2.getLines) {
      const { circle } = model1.getCircle(content1)
      for (const line of model2.getLines(content2, contents).lines) {
        yield* getLineSegmentCircleIntersectionPoints(...line, circle)
      }
    } else if (model1.getLines && model2.getCircle) {
      const { circle } = model2.getCircle(content2)
      for (const line of model1.getLines(content1, contents).lines) {
        yield* getLineSegmentCircleIntersectionPoints(...line, circle)
      }
    } else if (model1.getLines && model2.getLines) {
      for (const line1 of model1.getLines(content1, contents).lines) {
        for (const line2 of model2.getLines(content2, contents).lines) {
          const point = getTwoLineSegmentsIntersectionPoint(...line1, ...line2)
          if (point) {
            yield point
          }
        }
      }
    }
  }
}
