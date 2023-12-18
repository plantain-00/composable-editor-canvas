import { getPolygonFromTwoPointsFormRegion, getTwoPointsFormRegion, largerThan, pointInPolygon, Position, TwoPointsFormRegion } from "./geometry"
import { GeometryLine, geometryLineInPolygon, geometryLineIntersectWithPolygon } from "./intersection"
import { getPointAndGeometryLineMinimumDistance } from "./perpendicular"
import { Nullable } from "./types"
import { maxItems, minItems, number } from "./validators"

/**
 * @public
 */
export function getContentByClickPosition<T>(
  contents: readonly Nullable<T>[],
  position: Position,
  contentSelectable: (path: ContentPath) => boolean,
  getModel: (content: T) => {
    getGeometries?: (content: T, contents: readonly Nullable<T>[]) => {
      lines: GeometryLine[]
      regions?: {
        points: Position[]
      }[]
    },
    canSelectPart?: boolean,
  } | undefined,
  part = false,
  contentVisible?: (content: T) => boolean,
  indexes = contents.map((_, i) => i),
  delta = 3,
): ContentPath | undefined {
  for (let j = indexes.length - 1; j >= 0; j--) {
    const i = indexes[j]
    const content = contents[i]
    if (!content) {
      continue
    }
    if (contentVisible && !contentVisible(content)) {
      continue
    }
    const model = getModel(content)
    if (model?.getGeometries) {
      const { lines, regions } = model.getGeometries(content, contents)
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j]
        const minDistance = getPointAndGeometryLineMinimumDistance(position, line)
        if (minDistance <= delta) {
          if (part && model.canSelectPart && contentSelectable([i, j])) {
            return [i, j]
          }
          if (contentSelectable([i])) {
            return [i]
          }
        }
      }
      if (regions) {
        for (let j = 0; j < regions.length; j++) {
          if (pointInPolygon(position, regions[j].points)) {
            if (part && model.canSelectPart && contentSelectable([i, j])) {
              return [i, j + lines.length]
            }
            if (contentSelectable([i])) {
              return [i]
            }
          }
        }
      }
    }
  }
  return undefined
}

/**
 * @public
 */
export function getContentsByClickTwoPositions<T>(
  contents: readonly Nullable<T>[],
  startPosition: Position,
  endPosition: Position,
  getModel: (content: T) => {
    getGeometries?: (content: T, contents: readonly Nullable<T>[]) => {
      lines: GeometryLine[]
      bounding?: TwoPointsFormRegion
      regions?: {
        points: Position[]
        lines: GeometryLine[]
      }[]
    },
  } | undefined,
  contentSelectable?: (index: number[]) => boolean,
  contentVisible?: (content: T) => boolean,
) {
  const region = getTwoPointsFormRegion(startPosition, endPosition)
  const partial = largerThan(startPosition.x, endPosition.x)
  return getContentsByRegion(contents, getPolygonFromTwoPointsFormRegion(region), partial, false, getModel, contentSelectable, contentVisible)
}

export function getContentsByRegion<T>(
  contents: readonly Nullable<T>[],
  polygon: Position[],
  partial: boolean,
  rotated: boolean,
  getModel: (content: T) => {
    getGeometries?: (content: T, contents: readonly Nullable<T>[]) => {
      lines: GeometryLine[]
      bounding?: TwoPointsFormRegion
      regions?: {
        points: Position[]
        lines: GeometryLine[]
      }[]
    },
  } | undefined,
  contentSelectable?: (index: ContentPath) => boolean,
  contentVisible?: (content: T) => boolean,
) {
  const result: ContentPath[] = []
  contents.forEach((content, i) => {
    if (!content) {
      return
    }
    if (contentVisible && !contentVisible(content)) {
      return
    }
    if (!contentSelectable || contentSelectable([i])) {
      const model = getModel(content)
      if (model?.getGeometries) {
        const { lines, bounding, regions } = model.getGeometries(content, contents)
        if (rotated
          ? lines.every(line => geometryLineInPolygon(line, polygon))
          && (!regions || regions.every(r => r.points.every(p => pointInPolygon(p, polygon))))
          : bounding && pointInPolygon(bounding.start, polygon) && pointInPolygon(bounding.end, polygon)) {
          result.push([i])
        } else if (partial) {
          for (const line of lines) {
            if (geometryLineIntersectWithPolygon(line, polygon)) {
              result.push([i])
              return
            }
          }
          if (regions) {
            for (const r of regions) {
              for (const line of r.lines) {
                if (geometryLineIntersectWithPolygon(line, polygon)) {
                  result.push([i])
                  return
                }
              }
            }
          }
        }
      }
    }
  })
  return result
}

export type ContentPath = [number] | [number, number]

export const ContentPath = /* @__PURE__ */ minItems(1, /* @__PURE__ */ maxItems(2, [number]))
