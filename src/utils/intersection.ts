import { Arc, getTwoGeometryLinesIntersectionPoint, Position } from "./geometry"
import { Nullable } from "./types"

/**
 * @public
 */
export function* iterateIntersectionPoints<T>(
  content1: T,
  content2: T,
  contents: readonly Nullable<T>[],
  getModel: (content: T) => {
    getGeometries?: (content: T, contents: readonly Nullable<T>[]) => { lines: GeometryLine[] },
  } | undefined,
) {
  const model1 = getModel(content1)
  const model2 = getModel(content2)
  if (model1 && model2) {
    if (model1.getGeometries && model2.getGeometries) {
      for (const line1 of model1.getGeometries(content1, contents).lines) {
        for (const line2 of model2.getGeometries(content2, contents).lines) {
          yield* getTwoGeometryLinesIntersectionPoint(line1, line2)
        }
      }
    }
  }
}

export type GeometryLine = [Position, Position] | { type: 'arc', arc: Arc }
