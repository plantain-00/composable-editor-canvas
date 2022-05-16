import React from 'react'
import { getSymmetryPoint, PolylineEditBar, Position, ReactRenderTarget, rotatePositionByCenter, twoPointLineToGeneralFormLine, usePolygonClickCreate, usePolylineEdit } from '../../src'
import { iteratePolylineLines, LineContent } from './line-model'
import { BaseContent, getLinesAndPointsFromCache, Model } from './model'

export type PolygonContent = BaseContent<'polygon'> & {
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
    return lines.map((line) => ({ type: 'line', points: line }))
  },
  render({ content, stroke, target }) {
    return strokePolygon(target, content.points, stroke, content.dashArray)
  },
  renderOperator({ content, stroke, target, text, fontSize }) {
    return target.fillText(content.points[0].x, content.points[0].y, text, stroke, fontSize)
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
          <>
            <button onClick={startSetSides} style={{ position: 'relative' }}>set sides</button>
            <button onClick={() => setCreateType(createType === 'edge' ? 'point' : 'edge')} style={{ position: 'relative' }}>{createType}</button>
          </>
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
    const { points, lines } = getPolygonLines(content)
    return [
      ...points.map((p) => ({ ...p, type: 'endpoint' as const })),
      ...lines.map(([start, end]) => ({
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        type: 'midpoint' as const,
      })),
    ]
  },
  getLines: getPolygonLines,
}

function getPolygonLines(content: Omit<PolygonContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    return {
      lines: Array.from(iteratePolygonLines(content.points)),
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
) {
  return target.strokePolyline([...points, points[0]], stroke, dashArray)
}
