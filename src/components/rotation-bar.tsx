import * as React from "react"

export function RotationBar(props: {
  scale: number
  rotateStickLength?: number
  rotateCircleSize?: number
  onMouseDown: React.MouseEventHandler<HTMLDivElement>
}) {
  const length = (props.rotateStickLength ?? 40) / props.scale
  const border = 1 / props.scale
  const rotateCircleWidth = (props.rotateCircleSize ?? 10) / props.scale
  return (
    <>
      <div
        style={{
          left: `calc(50% - ${border / 2}px)`,
          top: -length + `px`,
          width: Math.max(border, 1) + 'px',
          height: length + 'px',
          position: 'absolute',
          boxSizing: 'border-box',
          backgroundColor: 'green',
        }}
      />
      <div
        style={{
          left: `calc(50% - ${border / 2 + rotateCircleWidth / 2}px)`,
          top: -length - rotateCircleWidth + `px`,
          width: rotateCircleWidth + 'px',
          height: rotateCircleWidth + 'px',
          position: 'absolute',
          border: `${Math.max(border, 1)}px solid green`,
          backgroundColor: 'white',
          borderRadius: rotateCircleWidth / 2 + 'px',
          cursor: 'grab',
          pointerEvents: 'auto',
        }}
        onMouseDown={props.onMouseDown}
      />
    </>
  )
}
