import React from 'react'
import { EllipseArc, Position, useEllipseArcEdit, EllipseArcEditBar } from '../../src'
import { angleDelta, ellipseModel, rotatePositionByEllipseCenter } from './ellipse-model'
import { iteratePolylineLines } from './line-model'
import { StrokeBaseContent, defaultStrokeColor, getLinesAndPointsFromCache, Model, getSnapPointsFromCache } from './model'

export type EllipseArcContent = StrokeBaseContent<'ellipse arc'> & EllipseArc

export const ellipseArcModel: Model<EllipseArcContent> = {
  type: 'ellipse arc',
  move: ellipseModel.move,
  rotate: ellipseModel.rotate,
  mirror: ellipseModel.mirror,
  render({ content, color, target, strokeWidth }) {
    const { points } = getEllipseArcLines(content)
    return target.strokePolyline(points, color ?? defaultStrokeColor, content.dashArray, strokeWidth)
  },
  renderIfSelected({ content, color, target }) {
    const { points } = getEllipseArcLines({ ...content, startAngle: content.endAngle, endAngle: content.startAngle + 360 })
    return target.strokePolyline(points, color ?? defaultStrokeColor, [4])
  },
  getOperatorRenderPosition(content) {
    const { points } = getEllipseArcLines(content)
    return points[0]
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
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => {
      const startAngle = content.startAngle / 180 * Math.PI
      const endAngle = content.endAngle / 180 * Math.PI
      const middleAngle = (startAngle + endAngle) / 2
      return [
        { x: content.cx, y: content.cy, type: 'center' },
        { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(startAngle), y: content.cy + content.ry * Math.sin(startAngle) }, content), type: 'endpoint' },
        { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(endAngle), y: content.cy + content.ry * Math.sin(endAngle) }, content), type: 'endpoint' },
        { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(middleAngle), y: content.cy + content.ry * Math.sin(middleAngle) }, content), type: 'midpoint' },
      ]
    })
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
      lines: [Array.from(iteratePolylineLines(points))],
      points,
    }
  })
}
