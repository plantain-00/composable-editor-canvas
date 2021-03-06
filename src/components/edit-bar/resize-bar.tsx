import * as React from "react"
import { allDirections, getResizeCursor, ResizeDirection } from "../.."

/**
 * @public
 */
export function ResizeBar(props: {
  scale?: number
  resizeSize?: number
  directions?: ResizeDirection[]
  rotate?: number
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, direction: ResizeDirection) => void
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, direction: ResizeDirection) => void
}) {
  const { resizeSize } = props
  const scale = props.scale ?? 1
  const width = (resizeSize ?? 5) / scale
  const border = 1 / scale
  const leftTop = width / 2
  const rightBottom = width / 2 - border
  const rotate = props.rotate ?? 0

  const directions = props.directions ?? allDirections
  const bars: { style: React.CSSProperties, direction: ResizeDirection }[] = []
  for (const direction of allDirections) {
    if (directions.includes(direction)) {
      const style: React.CSSProperties = {
        cursor: getResizeCursor(rotate, direction),
      }
      if (direction.includes('left')) {
        style.left = -leftTop + 'px'
      }
      if (direction.includes('right')) {
        style.right = -rightBottom + 'px'
      }
      if (direction.includes('top')) {
        style.top = -leftTop + 'px'
      }
      if (direction.includes('bottom')) {
        style.bottom = -rightBottom + 'px'
      }
      if (direction === 'left' || direction === 'right' || direction === 'center') {
        style.top = `calc(50% - ${leftTop}px)`
      }
      if (direction === 'top' || direction === 'bottom' || direction === 'center') {
        style.left = `calc(50% - ${leftTop}px)`
      }
      bars.push({
        direction: direction,
        style,
      })
    }
  }

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
          onMouseDown={(e) => {
            props.onMouseDown?.(e, s.direction)
          }}
          onClick={(e) => {
            props.onClick?.(e, s.direction)
          }}
        />
      ))}
    </>
  )
}
