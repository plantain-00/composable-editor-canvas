import * as React from "react"

export function DragMask(props: {
  onDragEnd: () => void
  onDragging: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
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
      onMouseLeave={props.onDragEnd}
    >
      {props.children}
    </div>
  )
}
