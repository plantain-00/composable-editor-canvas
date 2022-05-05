import React from 'react'
import { Ellipse, EllipseEditBar, getSymmetryPoint, Position, rotatePositionByCenter, twoPointLineToGeneralFormLine, useEllipseClickCreate, useEllipseEdit } from '../../src'
import { BaseContent, getAngleSnap, Model } from './model'
import { iteratePolygonLines } from './polygon-model'

export type EllipseContent = BaseContent<'ellipse'> & Ellipse

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
  mirror(content, p1, p2) {
    const line = twoPointLineToGeneralFormLine(p1, p2)
    const p = getSymmetryPoint({ x: content.cx, y: content.cy }, line)
    content.cx = p.x
    content.cy = p.y
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
    content.angle = 2 * angle - (content.angle ?? 0)
  },
  render({ content, stroke, target }) {
    return target.strokeEllipse(content.cx, content.cy, content.rx, content.ry, stroke, content.angle)
  },
  useCreate(type, onEnd, angleSnapEnabled) {
    const [ellipseCreate, setEllipseCreate] = React.useState<Ellipse>()
    const { onEllipseClickCreateClick, onEllipseClickCreateMove, ellipseClickCreateInput } = useEllipseClickCreate(
      type === 'ellipse center' || type === 'ellipse endpoint' ? type : undefined,
      setEllipseCreate,
      (c) => onEnd([{ ...c, type: 'ellipse' }]),
      {
        getAngleSnap: angleSnapEnabled ? getAngleSnap : undefined,
      },
    )
    return {
      input: ellipseClickCreateInput,
      onClick: onEllipseClickCreateClick,
      onMove: onEllipseClickCreateMove,
      updatePreview(contents) {
        if (ellipseCreate) {
          contents.push({ type: 'ellipse', ...ellipseCreate })
        }
      },
    }
  },
  useEdit(onEnd) {
    const [ellipseEditOffset, setEllipseEditOffset] = React.useState<Ellipse & { data?: number }>({ cx: 0, cy: 0, rx: 0, ry: 0 })
    const { onStartEditEllipse, ellipseEditMask } = useEllipseEdit<number>(setEllipseEditOffset, onEnd)
    return {
      mask: ellipseEditMask,
      updatePreview(contents) {
        if (ellipseEditOffset.data !== undefined) {
          const content = contents[ellipseEditOffset.data]
          if (content.type === 'ellipse') {
            content.cx += ellipseEditOffset.cx
            content.cy += ellipseEditOffset.cy
            content.rx += ellipseEditOffset.rx
            content.ry += ellipseEditOffset.ry
          }
        }
      },
      editBar({ content, index }) {
        return <EllipseEditBar cx={content.cx} cy={content.cy} rx={content.rx} ry={content.ry} angle={content.angle} onClick={(e, type, cursor) => onStartEditEllipse(e, { ...content, type, cursor, data: index })} />
      },
    }
  },
  getSnapPoints(content) {
    return [
      { x: content.cx, y: content.cy, type: 'center' },
      { ...rotatePositionByEllipseCenter({ x: content.cx - content.rx, y: content.cy }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx, y: content.cy }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx, y: content.cy - content.ry }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx, y: content.cy + content.ry }, content), type: 'endpoint' },
    ]
  },
  getLines(content) {
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
  },
}

function rotatePositionByEllipseCenter(p: Position, content: Omit<EllipseContent, "type">) {
  return rotatePositionByCenter(p, { x: content.cx, y: content.cy }, -(content.angle ?? 0))
}

const lineSegmentCount = 72
const angleDelta = 360 / lineSegmentCount
