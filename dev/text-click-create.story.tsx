import { produce } from "immer"
import React from "react"
import { getColorString, Text, useGlobalKeyDown, useTextClickCreate } from "../src"

export default () => {
  const [contents, setContents] = React.useState<Text[]>([])
  const { text, onClick, onMove, input, reset } = useTextClickCreate(true, (c) => {
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
        {[...contents, text].map((content, i) => content && <text
          key={i}
          x={content.x}
          y={content.y}
          style={{
            fill: getColorString(content.color),
            fontSize: `${content.fontSize}px`,
            fontFamily: content.fontFamily,
          }}
        >{content.text}</text>)}
      </svg>
      {input}
    </div>
  )
}
