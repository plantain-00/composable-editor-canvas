import produce from "immer"
import React from "react"
import { Circle, useCircleClickCreate } from "../src"

export default () => {
  const [circle, setCircle] = React.useState<Circle>()
  const [contents, setContents] = React.useState<Circle[]>([])
  const { onCircleClickCreateClick, onCircleClickCreateMove } = useCircleClickCreate('3 points', setCircle, (c) => {
    setContents(produce(contents, (draft) => {
      draft.push(c)
    }))
  })

  return (
    <div
      onClick={(e) => onCircleClickCreateClick({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => onCircleClickCreateMove({ x: e.clientX, y: e.clientY })}
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
            border: '1px solid #00ff00',
          }}
        >
        </div>
      ))}
    </div>
  )
}
