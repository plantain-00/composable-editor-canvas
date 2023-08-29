import { produce } from "immer"
import React from "react"
import { Circle, CircleEditBar, useCircleEdit, useGlobalKeyDown } from "../src"

export default () => {
  const [content, setContent] = React.useState<Circle>({ x: 300, y: 200, r: 100 })
  const { offset, onStart, mask, reset } = useCircleEdit(() => setContent(circle))
  const circle = produce(content, (draft) => {
    draft.x += offset.x
    draft.y += offset.y
    draft.r += offset.r
  })
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      reset()
    }
  })
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
        onMouseDown={(e, type, cursor) => onStart(e, { ...content, type, cursor })}
      />
      {mask}
    </>
  )
}
