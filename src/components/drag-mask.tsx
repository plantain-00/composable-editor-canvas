import * as React from "react"

export function DragMask(props: {
  onDragEnd: () => void
  onDragging: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void
  ignoreLeavingEvent?: boolean
  style?: React.CSSProperties
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: '0px',
        cursor: 'grabbing',
        ...props.style,
      }}
      onMouseUp={props.onDragEnd}
      onMouseMove={props.onDragging}
      onMouseLeave={props.ignoreLeavingEvent ? undefined : props.onDragEnd}
    >
      {props.children}
    </div>
  )
}
