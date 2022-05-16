import React from 'react'
import { Arc, CircleArcEditBar, getSymmetryPoint, Position, rotatePositionByCenter, twoPointLineToGeneralFormLine, useCircleArcClickCreate, useCircleArcEdit } from '../../src'
import { CircleContent } from './circle-model'
import { angleDelta } from './ellipse-model'
import { iteratePolylineLines, LineContent } from './line-model'
import { BaseContent, getLinesAndPointsFromCache, Model } from './model'
import { PolygonContent } from './polygon-model'

export type ArcContent = BaseContent<'arc'> & Arc

export const arcModel: Model<ArcContent> = {
  type: 'arc',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  rotate(content, center, angle) {
    const p = rotatePositionByCenter(content, center, -angle)
    content.x = p.x
    content.y = p.y
    content.startAngle += angle
    content.endAngle += angle
  },
  mirror(content, p1, p2) {
    const line = twoPointLineToGeneralFormLine(p1, p2)
    const p = getSymmetryPoint(content, line)
    content.x = p.x
    content.y = p.y
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
    const startAngle = 2 * angle - content.endAngle
    const endAngle = 2 * angle - content.startAngle
    content.startAngle = startAngle
    content.endAngle = endAngle
  },
  render({ content, stroke, target }) {
    if (content.dashArray) {
      const { points } = getArcLines(content)
      return target.strokePolyline(points, stroke, content.dashArray)
    }
    return target.strokeArc(content.x, content.y, content.r, content.startAngle, content.endAngle, stroke)
  },
  renderOperator({ content, stroke, target, text, fontSize }) {
    const { points } = getArcLines(content)
    return target.fillText(points[0].x, points[0].y, text, stroke, fontSize)
  },
  useEdit(onEnd, transform, getAngleSnap, scale) {
    const { offset, onStart, mask, cursorPosition } = useCircleArcEdit<number>(onEnd, {
      transform,
      getAngleSnap,
    })
    return {
      mask,
      updatePreview(contents) {
        if (offset.data !== undefined) {
          const content = contents[offset.data]
          const assistentContents = [{ type: 'line', dashArray: [4], points: [{ x: content.x, y: content.y }, cursorPosition] }]
          if (content.type === 'arc') {
            content.x += offset.x
            content.y += offset.y
            content.r += offset.r
            content.startAngle += offset.startAngle
            content.endAngle += offset.endAngle
            if (content.endAngle < content.startAngle) {
              content.endAngle += 360
            } else if (content.endAngle - content.startAngle > 360) {
              content.endAngle -= 360
            }
          }
          return { assistentContents }
        }
        return {}
      },
      editBar({ content, index }) {
        return <CircleArcEditBar {...content} scale={scale} onClick={(e, type, cursor) => onStart(e, { ...content, type, cursor, data: index })} />
      },
    }
  },
  useCreate(type, onEnd, getAngleSnap) {
    const { circle, arc, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = useCircleArcClickCreate(
      type === 'circle arc' ? 'center radius' : undefined,
      (c) => onEnd([{ ...c, type: 'arc' }]),
      {
        getAngleSnap,
      },
    )
    const assistentContents: (LineContent | PolygonContent | CircleContent)[] = []
    if (startPosition && cursorPosition) {
      if (middlePosition) {
        assistentContents.push({ type: 'polygon', points: [startPosition, middlePosition, cursorPosition], dashArray: [4] })
      } else {
        assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4] })
      }
    }
    if (arc) {
      assistentContents.push({ type: 'circle', ...arc, dashArray: [4] })
      if (arc.startAngle !== arc.endAngle) {
        assistentContents.push(
          {
            type: 'line', points: [
              {
                x: arc.x + arc.r * Math.cos(arc.startAngle / 180 * Math.PI),
                y: arc.y + arc.r * Math.sin(arc.startAngle / 180 * Math.PI)
              },
              {
                x: arc.x,
                y: arc.y
              },
            ],
            dashArray: [4]
          },
          {
            type: 'line', points: [
              {
                x: arc.x,
                y: arc.y
              },
              {
                x: arc.x + arc.r * Math.cos(arc.endAngle / 180 * Math.PI),
                y: arc.y + arc.r * Math.sin(arc.endAngle / 180 * Math.PI)
              },
            ],
            dashArray: [4]
          },
        )
      }
      if (cursorPosition) {
        assistentContents.push({ type: 'line', points: [arc, cursorPosition], dashArray: [4] })
      }
    }
    if (circle) {
      assistentContents.push({ type: 'circle', ...circle, dashArray: [4] })
      if (cursorPosition) {
        assistentContents.push({ type: 'line', points: [circle, cursorPosition], dashArray: [4] })
      }
    }
    return {
      input,
      onClick,
      onMove,
      updatePreview(contents) {
        if (arc && arc.startAngle !== arc.endAngle) {
          contents.push({ type: 'arc', ...arc })
        }
      },
      assistentContents,
    }
  },
  getSnapPoints(content) {
    const startAngle = content.startAngle / 180 * Math.PI
    const endAngle = content.endAngle / 180 * Math.PI
    const middleAngle = (startAngle + endAngle) / 2
    return [
      { x: content.x, y: content.y, type: 'center' },
      { x: content.x + content.r * Math.cos(startAngle), y: content.y + content.r * Math.sin(startAngle), type: 'endpoint' },
      { x: content.x + content.r * Math.cos(endAngle), y: content.y + content.r * Math.sin(endAngle), type: 'endpoint' },
      { x: content.x + content.r * Math.cos(middleAngle), y: content.y + content.r * Math.sin(middleAngle), type: 'midpoint' },
    ]
  },
  getLines: getArcLines,
}

export function getArcLines(content: Omit<ArcContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const points: Position[] = []
    const endAngle = content.startAngle > content.endAngle ? content.endAngle + 360 : content.endAngle
    let i = content.startAngle
    for (; i <= endAngle; i += angleDelta) {
      const angle = i * Math.PI / 180
      points.push({
        x: content.x + content.r * Math.cos(angle),
        y: content.y + content.r * Math.sin(angle),
      })
    }
    if (i !== endAngle) {
      const angle = endAngle * Math.PI / 180
      points.push({
        x: content.x + content.r * Math.cos(angle),
        y: content.y + content.r * Math.sin(angle),
      })
    }
    return {
      lines: Array.from(iteratePolylineLines(points)),
      points,
    }
  })
}
