import produce from "immer"
import React from "react"
import { PathCommand, reactSvgRenderTarget, usePathClickCreate } from "../src"

export default () => {
  const [contents, setContents] = React.useState<PathCommand[][]>([])
  const { preview, onClick, onMove, input, setInputType } = usePathClickCreate(true, (c) => {
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
        {[...contents, preview].map((content, i) => content && reactSvgRenderTarget.renderPathCommands(content, { strokeColor: 0x00ff00 })(i, 1, 1))}
      </svg>
      {(['line', 'arc', 'bezierCurve', 'quadraticCurve', 'close'] as const).map(m => <button key={m} style={{ position: 'relative' }} onClick={() => setInputType(m)}>{m}</button>)}
      {input}
    </div>
  )
}
