import { produce } from "immer"
import React from "react"
import { Ellipse, EllipseEditBar, useEllipseEdit, useGlobalKeyDown } from "../src"

export default () => {
  const [content, setContent] = React.useState<Ellipse>({ cx: 200, cy: 200, rx: 100, ry: 150, angle: 45 })
  const { offset, onStart, mask, reset } = useEllipseEdit(() => setContent(ellipse))
  const ellipse = produce(content, (draft) => {
    if (offset) {
      draft.cx += offset.cx
      draft.cy += offset.cy
      draft.rx += offset.rx
      draft.ry += offset.ry
    }
  })
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      reset()
    }
  })
  return (
    <>
      <svg
        viewBox="0 0 800 600"
        width={800}
        height={600}
        xmlns="http://www.w3.org/2000/svg"
        fill='none'
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <ellipse
          stroke='#00ff00'
          cx={ellipse.cx}
          cy={ellipse.cy}
          rx={ellipse.rx}
          ry={ellipse.ry}
          transform={ellipse.angle ? `rotate(${ellipse.angle},${ellipse.cx},${ellipse.cy})` : undefined}
        />
      </svg>
      <EllipseEditBar
        {...ellipse}
        onMouseDown={(e, type, cursor) => onStart(e, { ...ellipse, type, cursor })}
      />
      {mask}
    </>
  )
}
