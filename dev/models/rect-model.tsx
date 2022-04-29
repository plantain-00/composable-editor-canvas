import React from 'react'
import { Position, Region, ResizeBar, useDragResize, useLineClickCreate } from '../../src'
import { rotatePositionByCenter } from '../util'
import { BaseContent, Model } from '../model-2'
import { lineModel } from './line-model'

export type RectContent = BaseContent<'rect'> & Region & {
  angle: number
}

export const rectModel: Model<RectContent> = {
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  rotate(content, center, angle) {
    const p = rotatePositionByCenter(content, center, angle)
    content.x = p.x
    content.y = p.y
    content.angle -= angle
  },
  canSelectByPosition(content, position, delta) {
    return lineModel.canSelectByPosition({
      points: getRectPoints(content),
    }, position, delta)
  },
  canSelectByTwoPositions(content, region, partial) {
    return lineModel.canSelectByTwoPositions({
      points: getRectPoints(content),
    }, region, partial)
  },
  renderSvg({ content, stroke }) {
    return <rect stroke={stroke} transform={`rotate(${content.angle},${content.x},${content.y})`} x={content.x - content.width / 2} y={content.y - content.height / 2} width={content.width} height={content.height} />
  },
  renderPixi(content, g) {
    g.angle = content.angle
    g.position.x = content.x
    g.position.y = content.y
    g.drawRect(-content.width / 2, -content.height / 2, content.width, content.height)
  },
  useEdit(onEnd) {
    const [resizeOffset, setResizeOffset] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
    const [info, setInfo] = React.useState<{ angle: number, index: number }>()
    const { onStartResize, dragResizeMask } = useDragResize(setResizeOffset, onEnd, { rotate: info?.angle })
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
      true,
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
}

function getRectPoints(content: Omit<RectContent, "type">) {
  return [
    { x: content.x - content.width / 2, y: content.y - content.height / 2 },
    { x: content.x + content.width / 2, y: content.y - content.height / 2 },
    { x: content.x + content.width / 2, y: content.y + content.height / 2 },
    { x: content.x - content.width / 2, y: content.y + content.height / 2 },
    { x: content.x - content.width / 2, y: content.y - content.height / 2 },
  ].map((p) => rotatePositionByCenter(p, content, -content.angle))
}
