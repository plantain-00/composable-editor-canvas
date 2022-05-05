import * as React from "react"
import { getResizeCursor, rotatePositionByCenter } from "../utils"

export function EllipseEditBar(props: {
  cx: number,
  cy: number
  rx: number
  ry: number
  angle?: number
  scale?: number
  resizeSize?: number
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'major axis' | 'minor axis', cursor: React.CSSProperties['cursor']) => void
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'major axis' | 'minor axis', cursor: React.CSSProperties['cursor']) => void
}) {
  const scale = props.scale ?? 1
  const width = (props.resizeSize ?? 5) / scale
  const border = 1 / scale

  const bars: { style: React.CSSProperties, type: 'center' | 'major axis' | 'minor axis' }[] = [
    {
      type: 'center',
      style: {
        left: (props.cx - width / 2) + 'px',
        top: (props.cy - width / 2) + 'px',
        cursor: 'move',
      },
    },
  ]
  const center = { x: props.cx, y: props.cy }
  const rotate = -(props.angle ?? 0)
  const left = rotatePositionByCenter({ x: props.cx - props.rx, y: props.cy }, center, rotate)
  bars.push({
    type: 'major axis',
    style: {
      left: (left.x - width / 2) + 'px',
      top: (left.y - width / 2) + 'px',
      cursor: getResizeCursor(-rotate, 'left'),
    },
  })
  const right = rotatePositionByCenter({ x: props.cx + props.rx, y: props.cy }, center, rotate)
  bars.push({
    type: 'major axis',
    style: {
      left: (right.x - width / 2) + 'px',
      top: (right.y - width / 2) + 'px',
      cursor: getResizeCursor(-rotate, 'right'),
    },
  })
  const top = rotatePositionByCenter({ x: props.cx, y: props.cy - props.ry }, center, rotate)
  bars.push({
    type: 'minor axis',
    style: {
      left: (top.x - width / 2) + 'px',
      top: (top.y - width / 2) + 'px',
      cursor: getResizeCursor(-rotate, 'top'),
    },
  })
  const bottom = rotatePositionByCenter({ x: props.cx, y: props.cy + props.ry }, center, rotate)
  bars.push({
    type: 'minor axis',
    style: {
      left: (bottom.x - width / 2) + 'px',
      top: (bottom.y - width / 2) + 'px',
      cursor: getResizeCursor(-rotate, 'bottom'),
    },
  })

  return (
    <>
      {bars.map((s, i) => (
        <div
          key={i}
          style={{
            width: width + 'px',
            height: width + 'px',
            border: `${border}px solid green`,
            position: 'absolute',
            backgroundColor: 'white',
            boxSizing: 'border-box',
            pointerEvents: 'auto',
            ...s.style,
          }}
          onMouseDown={(e) => props.onMouseDown?.(e, s.type, s.style.cursor)}
          onClick={(e) => props.onClick?.(e, s.type, s.style.cursor)}
        />
      ))}
    </>
  )
}
