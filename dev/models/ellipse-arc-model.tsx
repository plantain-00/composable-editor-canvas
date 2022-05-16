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
  useEdit(onEnd, transform, getAngleSnap, scale) {
    const { offset, onStart, mask, cursorPosition } = useEllipseArcEdit<number>(onEnd, {
      transform,
      getAngleSnap,
    })
    return {
      mask,
      updatePreview(contents) {
        if (offset.data !== undefined) {
          const content = contents[offset.data]
          const assistentContents = [{ type: 'line', dashArray: [4], points: [{ x: content.cx, y: content.cy }, cursorPosition] }]
          if (content.type === 'ellipse arc') {
            content.cx += offset.cx
            content.cy += offset.cy
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
        return <EllipseArcEditBar {...content} scale={scale} onClick={(e, type, cursor) => onStart(e, { ...content, type, cursor, data: index })} />
      },
    }
  },
  useCreate(type, onEnd, getAngleSnap) {
    const { ellipse, ellipseArc, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = useEllipseArcClickCreate(
      type === 'ellipse arc' ? 'ellipse center' : undefined,
      (c) => onEnd([{ ...c, type: 'ellipse arc' }]),
      {
        getAngleSnap,
      },
    )
    const assistentContents: (LineContent | PolygonContent | EllipseContent)[] = []
    if (startPosition && cursorPosition) {
      if (middlePosition) {
        assistentContents.push({ type: 'line', points: [startPosition, middlePosition], dashArray: [4] })
        const center = type === 'ellipse arc'
          ? startPosition
          : { x: (startPosition.x + middlePosition.x) / 2, y: (startPosition.y + middlePosition.y) / 2 }
        assistentContents.push({ type: 'line', points: [center, cursorPosition], dashArray: [4] })
      } else {
        assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4] })
      }
    }
    if (ellipseArc) {
      assistentContents.push({ type: 'ellipse', ...ellipseArc, dashArray: [4] })
      if (ellipseArc.startAngle !== ellipseArc.endAngle) {
        assistentContents.push(
          {
            type: 'line', points: [
              rotatePositionByEllipseCenter({
                x: ellipseArc.cx + ellipseArc.rx * Math.cos(ellipseArc.startAngle / 180 * Math.PI),
                y: ellipseArc.cy + ellipseArc.ry * Math.sin(ellipseArc.startAngle / 180 * Math.PI)
              }, ellipseArc),
              {
                x: ellipseArc.cx,
                y: ellipseArc.cy
              },
            ],
            dashArray: [4]
          },
          {
            type: 'line', points: [
              {
                x: ellipseArc.cx,
                y: ellipseArc.cy
              },
              rotatePositionByEllipseCenter({
                x: ellipseArc.cx + ellipseArc.rx * Math.cos(ellipseArc.endAngle / 180 * Math.PI),
                y: ellipseArc.cy + ellipseArc.ry * Math.sin(ellipseArc.endAngle / 180 * Math.PI)
              }, ellipseArc),
            ],
            dashArray: [4]
          },
        )
      }
      if (cursorPosition) {
        assistentContents.push({ type: 'line', points: [{ x: ellipseArc.cx, y: ellipseArc.cy }, cursorPosition], dashArray: [4] })
      }
    } else if (ellipse) {
      assistentContents.push({ type: 'ellipse', ...ellipse, dashArray: [4] })
      if (cursorPosition) {
        assistentContents.push({ type: 'line', points: [{ x: ellipse.cx, y: ellipse.cy }, cursorPosition], dashArray: [4] })
      }
    }
    return {
      input,
      onClick,
      onMove,
      updatePreview(contents) {
        if (ellipseArc && ellipseArc.startAngle !== ellipseArc.endAngle) {
          contents.push({ type: 'ellipse arc', ...ellipseArc })
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
