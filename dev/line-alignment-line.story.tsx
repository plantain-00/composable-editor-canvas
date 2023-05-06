import { produce } from "immer"
import React from "react"
import { AlignmentLine, ResizeBar, useDragResize, useLineAlignment } from "../src"
import { defaultContents } from "./story-util"

export default () => {
  const [contents, setContents] = React.useState(defaultContents)
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const { lineAlignmentX, lineAlignmentY, changeOffsetByLineAlignment, clearLineAlignments } = useLineAlignment(10)
  const { offset, onStart, mask } = useDragResize(
    () => {
      clearLineAlignments()
      setContents(produce(contents, (draft) => {
        draft[selectedIndex].x += offset.x
        draft[selectedIndex].y += offset.y
        draft[selectedIndex].width += offset.width
        draft[selectedIndex].height += offset.height
      }))
    },
    {
      centeredScaling: (e) => e.shiftKey,
      transformOffset: (f, e, direction) => {
        if (!e?.metaKey && direction) {
          const target = contents[selectedIndex]
          const xLines = contents.filter((t) => t !== target).map((t) => [t.x, t.x + t.width]).flat()
          const yLines = contents.filter((t) => t !== target).map((t) => [t.y, t.y + t.height]).flat()
          changeOffsetByLineAlignment(f, direction, target, xLines, yLines)
        } else {
          clearLineAlignments()
        }
        return f
      },
    }
  )
  return (
    <>
      {contents.map((content, i) => (
        <div
          key={i}
          style={{
            width: `${content.width + (selectedIndex === i ? offset.width : 0)}px`,
            height: `${content.height + (selectedIndex === i ? offset.height : 0)}px`,
            left: `${content.x + (selectedIndex === i ? offset.x : 0)}px`,
            top: `${content.y + (selectedIndex === i ? offset.y : 0)}px`,
            position: 'absolute',
            boxSizing: 'border-box',
            border: selectedIndex === i ? '1px solid green' : undefined,
          }}
          onClick={() => setSelectedIndex(i)}
        >
          <img src={content.url} style={{ objectFit: 'fill', width: '100%', height: '100%' }} />
          {selectedIndex === i && <ResizeBar onMouseDown={onStart} />}
        </div>
      ))}
      <AlignmentLine type='x' value={lineAlignmentX} />
      <AlignmentLine type='y' value={lineAlignmentY} />
      {mask}
    </>
  )
}
