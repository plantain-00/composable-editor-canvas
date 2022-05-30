import React from 'react'
import { Ellipse, EllipseEditBar, getEllipseAngle, getSymmetryPoint, Position, rotatePositionByCenter, useEllipseEdit } from '../../src'
import { EllipseArcContent } from './ellipse-arc-model'
import { StrokeBaseContent, defaultStrokeColor, getLinesAndPointsFromCache, Model, getSnapPointsFromCache } from './model'
import { iteratePolygonLines, strokePolygon } from './polygon-model'

export type EllipseContent = StrokeBaseContent<'ellipse'> & Ellipse

export const ellipseModel: Model<EllipseContent> = {
  type: 'ellipse',
  move(content, offset) {
    content.cx += offset.x
    content.cy += offset.y
  },
  rotate(content, center, angle) {
    const p = rotatePositionByCenter({ x: content.cx, y: content.cy }, center, -angle)
    content.cx = p.x
    content.cy = p.y
    content.angle = (content.angle ?? 0) + angle
  },
  mirror(content, line, angle) {
    const p = getSymmetryPoint({ x: content.cx, y: content.cy }, line)
    content.cx = p.x
    content.cy = p.y
    content.angle = 2 * angle - (content.angle ?? 0)
  },
  break(content, points) {
    if (points.length < 2) {
      return
    }
    const angles = points.map((p) => getEllipseAngle(p, content))
    angles.sort((a, b) => a - b)
    return angles.map((a, i) => ({
      ...content,
      type: 'ellipse arc',
      startAngle: a,
      endAngle: i === angles.length - 1 ? angles[0] + 360 : angles[i + 1],
    }) as EllipseArcContent)
  },
  render({ content, color, target, strokeWidth }) {
    if (content.dashArray) {
      const { points } = getEllipseLines(content)
      return strokePolygon(target, points, color ?? defaultStrokeColor, content.dashArray, strokeWidth)
    }
    return target.strokeEllipse(content.cx, content.cy, content.rx, content.ry, color ?? defaultStrokeColor, content.angle, strokeWidth)
  },
  getOperatorRenderPosition(content) {
    return { x: content.cx, y: content.cy }
  },
  useEdit(onEnd, transform, getAngleSnap, scale) {
    const { offset, onStart, mask, cursorPosition } = useEllipseEdit<number>(onEnd, {
      transform,
      getAngleSnap,
    })
    return {
      mask,
      updatePreview(contents) {
        if (offset.data !== undefined) {
          const content = contents[offset.data]
          const assistentContents = [{ type: 'line', dashArray: [4], points: [{ x: content.cx, y: content.cy }, cursorPosition] }]
          if (content.type === 'ellipse') {
            content.cx += offset.cx
            content.cy += offset.cy
            content.rx += offset.rx
            content.ry += offset.ry
          }
          return { assistentContents }
        }
        return {}
      },
      editBar({ content, index }) {
        return <EllipseEditBar scale={scale} cx={content.cx} cy={content.cy} rx={content.rx} ry={content.ry} angle={content.angle} onClick={(e, type, cursor) => onStart(e, { ...content, type, cursor, data: index })} />
      },
    }
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => [
      { x: content.cx, y: content.cy, type: 'center' },
      { ...rotatePositionByEllipseCenter({ x: content.cx - content.rx, y: content.cy }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx, y: content.cy }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx, y: content.cy - content.ry }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx, y: content.cy + content.ry }, content), type: 'endpoint' },
    ])
  },
  getLines: getEllipseLines,
}

function getEllipseLines(content: Omit<EllipseContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const points: Position[] = []
    for (let i = 0; i < lineSegmentCount; i++) {
      const angle = angleDelta * i * Math.PI / 180
      const x = content.cx + content.rx * Math.cos(angle)
      const y = content.cy + content.ry * Math.sin(angle)
      points.push(rotatePositionByEllipseCenter({ x, y }, content))
    }
    return {
      lines: Array.from(iteratePolygonLines(points)),
      points,
    }
  })
}

export function rotatePositionByEllipseCenter(p: Position, content: Omit<EllipseContent, "type">) {
  return rotatePositionByCenter(p, { x: content.cx, y: content.cy }, -(content.angle ?? 0))
}

const lineSegmentCount = 72
export const angleDelta = 360 / lineSegmentCount
