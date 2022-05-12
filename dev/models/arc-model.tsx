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
  useEdit(onEnd) {
    const [circleEditOffset, setCircleEditOffset] = React.useState<Arc & { data?: number }>({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: 0 })
    const { onStartEditCircle, circleEditMask } = useCircleArcEdit<number>(setCircleEditOffset, onEnd)
    return {
      mask: circleEditMask,
      updatePreview(contents) {
        if (circleEditOffset.data !== undefined) {
          const content = contents[circleEditOffset.data]
          if (content.type === 'arc') {
            content.x += circleEditOffset.x
            content.y += circleEditOffset.y
            content.r += circleEditOffset.r
            content.startAngle += circleEditOffset.startAngle
            content.endAngle += circleEditOffset.endAngle
            if (content.endAngle < content.startAngle) {
              content.endAngle += 360
            } else if (content.endAngle - content.startAngle > 360) {
              content.endAngle -= 360
            }
          }
        }
      },
      editBar({ content, index }) {
        return <CircleArcEditBar {...content} onClick={(e, type, cursor) => onStartEditCircle(e, { ...content, type, cursor, data: index })} />
      },
    }
  },
  useCreate(type, onEnd) {
    const [circleArcCreate, setCircleArcCreate] = React.useState<Arc>()
    const { circleCreate, onCircleArcClickCreateClick, onCircleArcClickCreateMove, circleArcClickCreateInput, startPosition, middlePosition, cursorPosition } = useCircleArcClickCreate(
      type === 'circle arc' ? 'center radius' : undefined,
      setCircleArcCreate,
      (c) => onEnd([{ ...c, type: 'arc' }]),
    )
    const assistentContents: (LineContent | PolygonContent | CircleContent)[] = []
    if (startPosition && cursorPosition) {
      if (middlePosition) {
        assistentContents.push({ type: 'polygon', points: [startPosition, middlePosition, cursorPosition], dashArray: [4] })
      } else {
        assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4] })
      }
    }
    if (circleArcCreate) {
      assistentContents.push({ type: 'circle', ...circleArcCreate, dashArray: [4] })
      if (circleArcCreate.startAngle !== circleArcCreate.endAngle) {
        assistentContents.push(
          {
            type: 'line', points: [
              {
                x: circleArcCreate.x + circleArcCreate.r * Math.cos(circleArcCreate.startAngle / 180 * Math.PI),
                y: circleArcCreate.y + circleArcCreate.r * Math.sin(circleArcCreate.startAngle / 180 * Math.PI)
              },
              {
                x: circleArcCreate.x,
                y: circleArcCreate.y
              },
            ],
            dashArray: [4]
          },
          {
            type: 'line', points: [
              {
                x: circleArcCreate.x,
                y: circleArcCreate.y
              },
              {
                x: circleArcCreate.x + circleArcCreate.r * Math.cos(circleArcCreate.endAngle / 180 * Math.PI),
                y: circleArcCreate.y + circleArcCreate.r * Math.sin(circleArcCreate.endAngle / 180 * Math.PI)
              },
            ],
            dashArray: [4]
          },
        )
      }
    } else if (circleCreate) {
      assistentContents.push({ type: 'circle', ...circleCreate, dashArray: [4] })
      if (cursorPosition) {
        assistentContents.push({ type: 'line', points: [circleCreate, cursorPosition], dashArray: [4] })
      }
    }
    return {
      input: circleArcClickCreateInput,
      onClick: onCircleArcClickCreateClick,
      onMove: onCircleArcClickCreateMove,
      updatePreview(contents) {
        if (circleArcCreate && circleArcCreate.startAngle !== circleArcCreate.endAngle) {
          contents.push({ type: 'arc', ...circleArcCreate })
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
