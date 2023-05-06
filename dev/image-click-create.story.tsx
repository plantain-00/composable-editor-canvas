import { produce } from "immer"
import React from "react"
import { Image, useImageClickCreate } from "../src"

export default () => {
  const [contents, setContents] = React.useState<Image[]>([])
  const { image, onClick, onMove, input } = useImageClickCreate(true, (c) => {
    setContents(produce(contents, (draft) => {
      draft.push(c)
    }))
  })

  return (
    <div style={{ height: '100%' }}>
      <svg
        viewBox="0 0 800 600"
        width={800}
        height={600}
        xmlns="http://www.w3.org/2000/svg"
        fill='none'
        style={{ position: 'absolute', left: 0, top: 0 }}
        onClick={(e) => onClick({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => onMove({ x: e.clientX, y: e.clientY })}
      >
        {[...contents, image].map((content, i) => content && <image
          key={i}
          href={content.url}
          x={content.x}
          y={content.y}
          width={content.width}
          height={content.height}
        />)}
      </svg>
      {input}
    </div>
  )
}
