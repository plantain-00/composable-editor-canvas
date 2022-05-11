import * as React from "react"
import { getResizeCursor } from "../utils"

export function CircleArcEditBar(props: {
  x: number,
  y: number
  r: number
  startAngle: number
  endAngle: number
  scale?: number
  resizeSize?: number
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'start angle' | 'end angle' | 'radius', cursor: React.CSSProperties['cursor']) => void
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'start angle' | 'end angle' | 'radius', cursor: React.CSSProperties['cursor']) => void
}) {
  const scale = props.scale ?? 1
  const width = (props.resizeSize ?? 5) / scale
  const border = 1 / scale
  const x = props.x - width / 2
  const y = props.y - width / 2
  const startAngle = props.startAngle / 180 * Math.PI
  const endAngle = props.endAngle / 180 * Math.PI
  const middleAngle = (startAngle + endAngle) / 2

  const bars: { style: React.CSSProperties, type: 'center' | 'start angle' | 'end angle' | 'radius' }[] = [
    {
      type: 'center',
      style: {
        left: x + 'px',
        top: y + 'px',
        cursor: 'move',
      },
    },
    {
      type: 'start angle',
      style: {
        left: (x + props.r * Math.cos(startAngle)) + 'px',
        top: (y + props.r * Math.sin(startAngle)) + 'px',
        cursor: getResizeCursor(props.startAngle, 'top'),
      },
    },
    {
      type: 'end angle',
      style: {
        left: (x + props.r * Math.cos(endAngle)) + 'px',
        top: (y + props.r * Math.sin(endAngle)) + 'px',
        cursor: getResizeCursor(props.endAngle, 'top'),
      },
    },
    {
      type: 'radius',
      style: {
        left: (x + props.r * Math.cos(middleAngle)) + 'px',
        top: (y + props.r * Math.sin(middleAngle)) + 'px',
        cursor: getResizeCursor((props.startAngle + props.endAngle) / 2, 'right'),
      },
    },
  ]

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
