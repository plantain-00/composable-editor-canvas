import React from 'react'
import { getSymmetryPoint, Position, Region, ResizeBar, rotatePositionByCenter, twoPointLineToGeneralFormLine, useDragResize, useLineClickCreate } from '../../src'
import { BaseContent, getLinesAndPointsFromCache, Model } from './model'
import { iteratePolygonLines, strokePolygon } from './polygon-model'

export type RectContent = BaseContent<'rect'> & Region & {
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
  render({ content, stroke, target }) {
    if (content.dashArray) {
      const { points } = getRectLines(content)
      return strokePolygon(target, points, stroke, content.dashArray)
    }
    return target.strokeRect(content.x - content.width / 2, content.y - content.height / 2, content.width, content.height, stroke, content.angle)
  },
  renderOperator({ content, stroke, target, text, fontSize }) {
    const { points } = getRectLines(content)
    return target.fillText(points[0].x, points[0].y, text, stroke, fontSize)
  },
  useEdit(onEnd, transform2) {
    const [resizeOffset, setResizeOffset] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
    const [info, setInfo] = React.useState<{ angle: number, index: number }>()
    const { onStartResize, dragResizeMask } = useDragResize(setResizeOffset, onEnd, {
      rotate: info?.angle,
      centeredScaling: (e) => e.shiftKey,
      transform2,
    })
    return {
      mask: dragResizeMask,
      updatePreview(contents) {
        if (info) {
          const content = contents[info.index]
          content.x += resizeOffset.x + resizeOffset.width / 2
          content.y += resizeOffset.y + resizeOffset.height / 2
          content.width += resizeOffset.width
          content.height += resizeOffset.height
        }
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
              scale={transform2?.scale}
              onClick={(e, direction) => {
                onStartResize(e, direction)
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
  useCreate(type, onEnd) {
    const [rectCreate, setRectCreate] = React.useState<{ points: Position[] }>()
    const { onLineClickCreateClick, onLineClickCreateMove, lineClickCreateInput } = useLineClickCreate(
      type === 'rect',
      (c) => setRectCreate(c ? { points: c } : undefined),
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
      },
    )
    return {
      input: lineClickCreateInput,
      onClick: onLineClickCreateClick,
      onMove: onLineClickCreateMove,
      updatePreview(contents) {
        if (rectCreate) {
          contents.push({
            type: 'rect',
            x: (rectCreate.points[0].x + rectCreate.points[1].x) / 2,
            y: (rectCreate.points[0].y + rectCreate.points[1].y) / 2,
            width: Math.abs(rectCreate.points[0].x - rectCreate.points[1].x),
            height: Math.abs(rectCreate.points[0].y - rectCreate.points[1].y),
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
