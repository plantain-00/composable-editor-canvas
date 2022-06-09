import produce from "immer"
import React from "react"
import { Circle, getTwoPointsDistance, Region, useEdit } from "../src"

export default () => {
  const [content, setContent] = React.useState<Circle>({ x: 300, y: 200, r: 100 })
  const { editPoint, updateEditPreview, onEditMove, onEditClick, getEditAssistentContents } = useEdit<Circle>(
    () => setContent(circle),
    (s) => ({
      editPoints: [
        {
          x: s.x,
          y: s.y,
          cursor: 'move',
          update(c, { cursor, start }) {
            c.x += cursor.x - start.x
            c.y += cursor.y - start.y
          }
        },
        { x: s.x - s.r, y: s.y, cursor: 'ew-resize', update(c, { cursor }) { c.r = getTwoPointsDistance(cursor, c) } },
        { x: s.x, y: s.y - s.r, cursor: 'ns-resize', update(c, { cursor }) { c.r = getTwoPointsDistance(cursor, c) } },
        { x: s.x + s.r, y: s.y, cursor: 'ew-resize', update(c, { cursor }) { c.r = getTwoPointsDistance(cursor, c) } },
        { x: s.x, y: s.y + s.r, cursor: 'ns-resize', update(c, { cursor }) { c.r = getTwoPointsDistance(cursor, c) } },
      ],
    }),
  )
  const assistentContents: Region[] = []
  const circle = produce(content, (draft) => {
    updateEditPreview(() => draft)
    assistentContents.push(...getEditAssistentContents(draft, (rect) => rect))
  })

  return (
    <>
      <svg
        viewBox="0 0 800 600"
        width={800}
        height={600}
        xmlns="http://www.w3.org/2000/svg"
        fill='none'
        style={{ position: 'absolute', left: 0, top: 0, cursor: editPoint?.cursor }}
        onMouseMove={(e) => onEditMove({ x: e.clientX, y: e.clientY }, [{ content: circle, path: [0] }])}
        onClick={(e) => editPoint && onEditClick({ x: e.clientX, y: e.clientY })}
      >
        <circle cx={circle.x} cy={circle.y} r={circle.r} stroke='#00ff00' />
        {assistentContents.map((s, i) => <rect key={i} x={s.x - s.width / 2} y={s.y - s.height / 2} width={s.width} height={s.height} stroke='#00ff00' fill='#ffffff' />)}
      </svg>
    </>
  )
}
