import { produce } from "immer"
import React from "react"
import { Circle, useCircleClickCreate, useGlobalKeyDown } from "../src"

export default () => {
  const [contents, setContents] = React.useState<Circle[]>([])
  const { circle, onClick, onMove, input, reset } = useCircleClickCreate('center radius', (c) => {
    setContents(produce(contents, (draft) => {
      draft.push(c)
    }))
  })
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      reset()
    }
  })

  return (
    <div
      onClick={(e) => onClick({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => onMove({ x: e.clientX, y: e.clientY })}
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
      {input}
    </div>
  )
}
