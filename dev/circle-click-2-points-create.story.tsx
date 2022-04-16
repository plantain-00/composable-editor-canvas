import produce from "immer"
import React from "react"
import { useCircleClickCreate } from "../src"

export default () => {
  const [circle, setCircle] = React.useState<{ x: number, y: number, r: number }>()
  const [contents, setContents] = React.useState<{ x: number, y: number, r: number }[]>([])
  const { onCircleClickCreateClick, onCircleClickCreateMove } = useCircleClickCreate('2 points', setCircle, () => {
    if (circle) {
      setContents(produce(contents, (draft) => {
        draft.push(circle)
      }))
    }
  })

  return (
    <div
      onClick={onCircleClickCreateClick}
      onMouseMove={onCircleClickCreateMove}
      style={{ height: '100%' }}
    >
      {[...contents, circle].map((content, i) => content && (
        <div
          key={i}
          style={{
            width: `${content.r * 2}px`,
            height: `${content.r * 2}px`,
            left: `${content.x - content.r}px`,
            top: `${content.y - content.r}px`,
            borderRadius: `${content.r}px`,
            position: 'absolute',
            border: '1px solid green',
          }}
        >
        </div>
      ))}
    </div>
  )
}
