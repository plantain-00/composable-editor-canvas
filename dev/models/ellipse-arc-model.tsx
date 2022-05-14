import React from 'react'
import { EllipseArc, Position, useEllipseArcClickCreate, useEllipseArcEdit, EllipseArcEditBar } from '../../src'
import { angleDelta, EllipseContent, ellipseModel, rotatePositionByEllipseCenter } from './ellipse-model'
import { iteratePolylineLines, LineContent } from './line-model'
import { BaseContent, getLinesAndPointsFromCache, Model } from './model'
import { PolygonContent } from './polygon-model'

export type EllipseArcContent = BaseContent<'ellipse arc'> & EllipseArc

export const ellipseArcModel: Model<EllipseArcContent> = {
  type: 'ellipse arc',
  move: ellipseModel.move,
  rotate: ellipseModel.rotate,
  mirror: ellipseModel.mirror,
  render({ content, stroke, target }) {
    const { points } = getEllipseArcLines(content)
    return target.strokePolyline(points, stroke, content.dashArray)
  },
  renderOperator({ content, stroke, target, text, fontSize }) {
    const { points } = getEllipseArcLines(content)
    return target.fillText(points[0].x, points[0].y, text, stroke, fontSize)
  },
  useEdit(onEnd, transform2) {
    const [ellipseArcEditOffset, setEllipseArcEditOffset] = React.useState<EllipseArc & { data?: number }>({ cx: 0, cy: 0, rx: 0, ry: 0, startAngle: 0, endAngle: 0 })
    const { onStartEditEllipseArc, ellipseArcEditMask } = useEllipseArcEdit<number>(setEllipseArcEditOffset, onEnd, { transform2 })
    return {
      mask: ellipseArcEditMask,
      updatePreview(contents) {
        if (ellipseArcEditOffset.data !== undefined) {
          const content = contents[ellipseArcEditOffset.data]
          if (content.type === 'ellipse arc') {
            content.cx += ellipseArcEditOffset.cx
            content.cy += ellipseArcEditOffset.cy
            content.startAngle += ellipseArcEditOffset.startAngle
            content.endAngle += ellipseArcEditOffset.endAngle
            if (content.endAngle < content.startAngle) {
              content.endAngle += 360
            } else if (content.endAngle - content.startAngle > 360) {
              content.endAngle -= 360
            }
          }
        }
      },
      editBar({ content, index }) {
        return <EllipseArcEditBar {...content} scale={transform2?.scale} onClick={(e, type, cursor) => onStartEditEllipseArc(e, { ...content, type, cursor, data: index })} />
      },
    }
  },
  useCreate(type, onEnd) {
    const [ellipseArcCreate, setEllipseArcCreate] = React.useState<EllipseArc>()
    const { ellipseCreate, onEllipseArcClickCreateClick, onEllipseArcClickCreateMove, ellipseArcClickCreateInput, startPosition, middlePosition, cursorPosition } = useEllipseArcClickCreate(
      type === 'ellipse arc' ? 'ellipse center' : undefined,
      setEllipseArcCreate,
      (c) => onEnd([{ ...c, type: 'ellipse arc' }]),
    )
    const assistentContents: (LineContent | PolygonContent | EllipseContent)[] = []
    if (startPosition && cursorPosition) {
      if (middlePosition) {
        assistentContents.push({ type: 'polygon', points: [startPosition, middlePosition, cursorPosition], dashArray: [4] })
      } else {
        assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4] })
      }
    }
    if (ellipseArcCreate) {
      assistentContents.push({ type: 'ellipse', ...ellipseArcCreate, dashArray: [4] })
      if (ellipseArcCreate.startAngle !== ellipseArcCreate.endAngle) {
        assistentContents.push(
          {
            type: 'line', points: [
              rotatePositionByEllipseCenter({
                x: ellipseArcCreate.cx + ellipseArcCreate.rx * Math.cos(ellipseArcCreate.startAngle / 180 * Math.PI),
                y: ellipseArcCreate.cy + ellipseArcCreate.ry * Math.sin(ellipseArcCreate.startAngle / 180 * Math.PI)
              }, ellipseArcCreate),
              {
                x: ellipseArcCreate.cx,
                y: ellipseArcCreate.cy
              },
            ],
            dashArray: [4]
          },
          {
            type: 'line', points: [
              {
                x: ellipseArcCreate.cx,
                y: ellipseArcCreate.cy
              },
              rotatePositionByEllipseCenter({
                x: ellipseArcCreate.cx + ellipseArcCreate.rx * Math.cos(ellipseArcCreate.endAngle / 180 * Math.PI),
                y: ellipseArcCreate.cy + ellipseArcCreate.ry * Math.sin(ellipseArcCreate.endAngle / 180 * Math.PI)
              }, ellipseArcCreate),
            ],
            dashArray: [4]
          },
        )
      }
    } else if (ellipseCreate) {
      assistentContents.push({ type: 'ellipse', ...ellipseCreate, dashArray: [4] })
      if (cursorPosition) {
        assistentContents.push({ type: 'line', points: [{ x: ellipseCreate.cx, y: ellipseCreate.cy }, cursorPosition], dashArray: [4] })
      }
    }
    return {
      input: ellipseArcClickCreateInput,
      onClick: onEllipseArcClickCreateClick,
      onMove: onEllipseArcClickCreateMove,
      updatePreview(contents) {
        if (ellipseArcCreate && ellipseArcCreate.startAngle !== ellipseArcCreate.endAngle) {
          contents.push({ type: 'ellipse arc', ...ellipseArcCreate })
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
      { x: content.cx, y: content.cy, type: 'center' },
      { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(startAngle), y: content.cy + content.ry * Math.sin(startAngle) }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(endAngle), y: content.cy + content.ry * Math.sin(endAngle) }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(middleAngle), y: content.cy + content.ry * Math.sin(middleAngle) }, content), type: 'midpoint' },
    ]
  },
  getLines: getEllipseArcLines,
}

function getEllipseArcLines(content: Omit<EllipseArcContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const points: Position[] = []
    const endAngle = content.startAngle > content.endAngle ? content.endAngle + 360 : content.endAngle
    let i = content.startAngle
    for (; i <= endAngle; i += angleDelta) {
      const angle = i * Math.PI / 180
      const x = content.cx + content.rx * Math.cos(angle)
      const y = content.cy + content.ry * Math.sin(angle)
      points.push(rotatePositionByEllipseCenter({ x, y }, content))
    }
    if (i !== endAngle) {
      const angle = endAngle * Math.PI / 180
      const x = content.cx + content.rx * Math.cos(angle)
      const y = content.cy + content.ry * Math.sin(angle)
      points.push(rotatePositionByEllipseCenter({ x, y }, content))
    }
    return {
      lines: Array.from(iteratePolylineLines(points)),
      points,
    }
  })
}
