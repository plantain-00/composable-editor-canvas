import * as React from "react"

export function CircleEditBar(props: {
  x: number,
  y: number
  radius: number
  scale?: number
  resizeSize?: number
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'edge', cursor: React.CSSProperties['cursor']) => void
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'edge', cursor: React.CSSProperties['cursor']) => void
}) {
  const scale = props.scale ?? 1
  const width = (props.resizeSize ?? 5) / scale
  const border = 1 / scale
  const x = props.x - width / 2
  const y = props.y - width / 2

  const bars: { style: React.CSSProperties, type: 'center' | 'edge' }[] = [
    {
      type: 'center',
      style: {
        left: x + 'px',
        top: y + 'px',
        cursor: 'move',
      },
    },
    {
      type: 'edge',
      style: {
        left: (x - props.radius) + 'px',
        top: y + 'px',
        cursor: 'ew-resize',
      },
    },
    {
      type: 'edge',
      style: {
        left: x + 'px',
        top: (y - props.radius) + 'px',
        cursor: 'ns-resize',
      },
    },
    {
      type: 'edge',
      style: {
        left: (x + props.radius) + 'px',
        top: y + 'px',
        cursor: 'ew-resize',
      },
    },
    {
      type: 'edge',
      style: {
        left: x + 'px',
        top: (y + props.radius) + 'px',
        cursor: 'ns-resize',
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
