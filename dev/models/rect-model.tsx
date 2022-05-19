import React from 'react'
import { getSymmetryPoint, Region, ResizeBar, rotatePositionByCenter, twoPointLineToGeneralFormLine, useDragResize, useLineClickCreate } from '../../src'
import { StrokeBaseContent, defaultStrokeColor, getLinesAndPointsFromCache, Model } from './model'
import { iteratePolygonLines, strokePolygon } from './polygon-model'

export type RectContent = StrokeBaseContent<'rect'> & Region & {
  angle: number
}

export const rectModel: Model<RectContent> = {
  type: 'rect',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  rotate(content, center, angle) {
    const p = rotatePositionByCenter(content, center, -angle)
    content.x = p.x
    content.y = p.y
    content.angle += angle
  },
  explode(content) {
    const { lines } = getRectLines(content)
    return lines.map((line) => ({ type: 'line', points: line }))
  },
  mirror(content, p1, p2) {
    const line = twoPointLineToGeneralFormLine(p1, p2)
    const p = getSymmetryPoint(content, line)
    content.x = p.x
    content.y = p.y
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
    content.angle = 2 * angle - content.angle
  },
  render({ content, color, target, strokeWidth }) {
    if (content.dashArray) {
      const { points } = getRectLines(content)
      return strokePolygon(target, points, color ?? defaultStrokeColor, content.dashArray, strokeWidth)
    }
    return target.strokeRect(content.x - content.width / 2, content.y - content.height / 2, content.width, content.height, color ?? defaultStrokeColor, content.angle, strokeWidth)
  },
  getOperatorRenderPosition(content) {
    const { points } = getRectLines(content)
    return points[0]
  },
  useEdit(onEnd, transform, getAngleSnap, scale) {
    const [info, setInfo] = React.useState<{ angle: number, index: number }>()
    const { offset, onStart, mask, startPosition, cursorPosition } = useDragResize(onEnd, {
      rotate: info?.angle,
      centeredScaling: (e) => e.shiftKey,
      transform,
      getAngleSnap,
    })
    return {
      mask,
      updatePreview(contents) {
        if (info) {
          const content = contents[info.index]
          const assistentContents = startPosition && cursorPosition ? [{ type: 'line', dashArray: [4], points: [{ x: startPosition.x, y: startPosition.y }, cursorPosition] }] : undefined
          content.x += offset.x + offset.width / 2
          content.y += offset.y + offset.height / 2
          content.width += offset.width
          content.height += offset.height
          return { assistentContents }
        }
        return {}
      },
      editBar({ content, index }) {
        return (
          <div
            style={{
              left: content.x - content.width / 2,
              top: content.y - content.height / 2,
              width: content.width,
              height: content.height,
              position: 'absolute',
              transform: `rotate(${content.angle}deg)`,
              pointerEvents: 'none',
            }}
          >
            <ResizeBar
              rotate={content.angle}
              scale={scale}
              onClick={(e, direction) => {
                onStart(e, direction)
                setInfo({
                  angle: content.angle,
                  index,
                })
              }}
            />
          </div>
        )
      },
    }
  },
  useCreate(type, onEnd, getAngleSnap) {
    const { line, onClick, onMove, input } = useLineClickCreate(
      type === 'rect',
      (c) => {
        onEnd([
          {
            type: 'rect',
            x: (c[0].x + c[1].x) / 2,
            y: (c[0].y + c[1].y) / 2,
            width: Math.abs(c[0].x - c[1].x),
            height: Math.abs(c[0].y - c[1].y),
            angle: 0,
          },
        ])
      },
      {
        once: true,
        getAngleSnap,
      },
    )
    return {
      input,
      onClick,
      onMove,
      updatePreview(contents) {
        if (line) {
          contents.push({
            type: 'rect',
            x: (line[0].x + line[1].x) / 2,
            y: (line[0].y + line[1].y) / 2,
            width: Math.abs(line[0].x - line[1].x),
            height: Math.abs(line[0].y - line[1].y),
            angle: 0,
          })
        }
      },
    }
  },
  getSnapPoints(content) {
    const { points, lines } = getRectLines(content)
    return [
      { x: content.x, y: content.y, type: 'center' },
      ...points.map((p) => ({ ...p, type: 'endpoint' as const })),
      ...lines.map(([start, end]) => ({
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        type: 'midpoint' as const,
      })),
    ]
  },
  getLines: getRectLines,
}

function getRectLines(content: Omit<RectContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const points = [
      { x: content.x - content.width / 2, y: content.y - content.height / 2 },
      { x: content.x + content.width / 2, y: content.y - content.height / 2 },
      { x: content.x + content.width / 2, y: content.y + content.height / 2 },
      { x: content.x - content.width / 2, y: content.y + content.height / 2 },
    ].map((p) => rotatePositionByCenter(p, content, -content.angle))
    return {
      lines: Array.from(iteratePolygonLines(points)),
      points,
    }
  })
}
