import produce from "immer"
import React from "react"
import { Circle, CircleEditBar, useCircleEdit } from "../src"

export default () => {
  const [content, setContent] = React.useState({
    x: 300,
    y: 200,
    r: 100,
  })
  const [circleEditOffset, setCircleEditOffset] = React.useState<Circle>({ x: 0, y: 0, r: 0 })
  const circle = produce(content, (draft) => {
    draft.x += circleEditOffset.x
    draft.y += circleEditOffset.y
    draft.r += circleEditOffset.r
  })
  const { onStartEditCircle, circleEditMask } = useCircleEdit(setCircleEditOffset, () => setContent(circle))

  return (
    <>
      <div
        style={{
          width: `${circle.r * 2}px`,
          height: `${circle.r * 2}px`,
          left: `${circle.x - circle.r}px`,
          top: `${circle.y - circle.r}px`,
          borderRadius: `${circle.r}px`,
          position: 'absolute',
          border: '1px solid #00ff00',
        }}
      >
      </div>
      <CircleEditBar
        x={circle.x}
        y={circle.y}
        radius={circle.r}
        onMouseDown={(e, type, cursor) => onStartEditCircle(e, { ...content, type, cursor })}
      />
      {circleEditMask}
    </>
  )
}
