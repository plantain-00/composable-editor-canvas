import * as React from "react"
import { Position } from "../../utils"

export function EditBar<T = void>(props: {
  positions: EditBarPosition<T>[]
  scale?: number
  resizeSize?: number
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: T, cursor: React.CSSProperties['cursor']) => void
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: T, cursor: React.CSSProperties['cursor']) => void
}) {
  const scale = props.scale ?? 1
  const width = (props.resizeSize ?? 5) / scale
  const border = 1 / scale

  return (
    <>
      {props.positions.map((p, i) => (
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
            left: (p.x - width / 2) + 'px',
            top: (p.y - width / 2) + 'px',
            cursor: p.cursor,
          }}
          onMouseDown={(e) => props.onMouseDown?.(e, p.data, p.cursor)}
          onClick={(e) => props.onClick?.(e, p.data, p.cursor)}
        />
      ))}
    </>
  )
}

export type EditBarPosition<T> = Position & { cursor?: React.CSSProperties['cursor'], data: T }
