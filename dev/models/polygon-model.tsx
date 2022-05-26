import React from 'react'
import { getSymmetryPoint, PolylineEditBar, Position, ReactRenderTarget, rotatePositionByCenter, twoPointLineToGeneralFormLine, usePolygonClickCreate, usePolylineEdit } from '../../src'
import { iteratePolylineLines, LineContent } from './line-model'
import { StrokeBaseContent, defaultStrokeColor, getLinesAndPointsFromCache, Model, getSnapPointsFromCache } from './model'
import { strokePolyline } from './polyline-model'

export type PolygonContent = StrokeBaseContent<'polygon'> & {
  points: Position[]
}

export const polygonModel: Model<PolygonContent> = {
  type: 'polygon',
  move(content, offset) {
    for (const point of content.points) {
      point.x += offset.x
      point.y += offset.y
    }
  },
  rotate(content, center, angle) {
    content.points = content.points.map((p) => rotatePositionByCenter(p, center, -angle))
  },
  mirror(content, p1, p2) {
    const line = twoPointLineToGeneralFormLine(p1, p2)
    content.points = content.points.map((p) => getSymmetryPoint(p, line))
  },
  explode(content) {
    const { lines } = getPolygonLines(content)
    return lines.map((line) => ({ type: 'line', points: line[0] } as LineContent))
  },
  render({ content, color, target, strokeWidth, partsStyles }) {
    return strokePolygon(target, content.points, color ?? defaultStrokeColor, content.dashArray, strokeWidth, partsStyles)
  },
  getOperatorRenderPosition(content) {
    return content.points[0]
  },
  useEdit(onEnd, transform, getAngleSnap, scale) {
    const { offset, onStart, mask, dragStartPosition, cursorPosition } = usePolylineEdit<number>(onEnd, {
      transform,
      getAngleSnap,
    })
    return {
      mask,
      updatePreview(contents) {
        if (offset?.data !== undefined) {
          const content = contents[offset.data]
          const assistentContents = dragStartPosition ? [{ type: 'line', dashArray: [4], points: [{ x: dragStartPosition.x, y: dragStartPosition.y }, cursorPosition] }] : undefined
          for (const pointIndex of offset.pointIndexes) {
            content.points[pointIndex].x += offset.x
            content.points[pointIndex].y += offset.y
          }
          return { assistentContents }
        }
        return {}
      },
      editBar({ content, index }) {
        return <PolylineEditBar scale={scale} points={content.points} isPolygon onClick={(e, pointIndexes) => onStart(e, pointIndexes, index)} />
      },
    }
  },
  useCreate(type, onEnd, getAngleSnap) {
    const [createType, setCreateType] = React.useState<'point' | 'edge'>('point')
    const { polygon, onClick, onMove, input, startSetSides, startPosition, cursorPosition } = usePolygonClickCreate(
      type === 'polygon',
      (c) => onEnd([{ points: c, type: 'polygon' }]),
      {
        getAngleSnap,
        toEdge: createType === 'edge',
        setSidesKey: 'S',
        switchTypeKey: 'T',
        switchType: () => setCreateType(createType === 'edge' ? 'point' : 'edge'),
      },
    )
    let assistentContents: LineContent[] | undefined
    if (startPosition && cursorPosition) {
      assistentContents = [{ type: 'line', points: [startPosition, cursorPosition], dashArray: [4] }]
    }
    return {
      input,
      subcommand: type === 'polygon'
        ? (
          <span>
            <button onClick={startSetSides} style={{ position: 'relative' }}>set sides(S)</button>
            <button onClick={() => setCreateType(createType === 'edge' ? 'point' : 'edge')} style={{ position: 'relative' }}>{createType}(T)</button>
          </span>
        )
        : undefined,
      onClick,
      onMove,
      updatePreview(contents) {
        if (polygon) {
          contents.push({ points: polygon, type: 'polygon' })
        }
      },
      assistentContents,
    }
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => {
      const { points, lines } = getPolygonLines(content)
      return [
        ...points.map((p) => ({ ...p, type: 'endpoint' as const })),
        ...lines.map(([[start, end]]) => ({
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
          type: 'midpoint' as const,
        })),
      ]
    })
  },
  getLines: getPolygonLines,
}

function getPolygonLines(content: Omit<PolygonContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    return {
      lines: Array.from(iteratePolygonLines(content.points)).map((n) => [n]),
      points: content.points,
    }
  })
}

export function* iteratePolygonLines(points: Position[]) {
  yield* iteratePolylineLines(points)
  yield [points[points.length - 1], points[0]] as [Position, Position]
}

export function strokePolygon<T>(
  target: ReactRenderTarget<T>,
  points: Position[],
  stroke: number,
  dashArray?: number[],
  strokeWidth?: number,
  partsStyles: readonly { index: number, color: number }[] = [],
) {
  return strokePolyline(target, [...points, points[0]], stroke, dashArray, strokeWidth, partsStyles)
}
