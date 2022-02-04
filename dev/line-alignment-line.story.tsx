import produce from "immer"
import React from "react"
import { AlignmentLine, ResizeBar, useDragResize, useLineAlignment } from "../src"
import { defaultContents } from "./story-util"

export default () => {
  const [contents, setContents] = React.useState(defaultContents)
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const { lineAlignmentX, lineAlignmentY, changeOffsetByLineAlignment, clearLineAlignments } = useLineAlignment(10)
  const [resizeOffset, setResizeOffset] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
  const { onStartResize, dragResizeMask } = useDragResize(
    (f, e, direction) => {
      if (!e.metaKey) {
        const target = contents[selectedIndex]
        const xLines = contents.filter((t) => t !== target).map((t) => [t.x, t.x + t.width]).flat()
        const yLines = contents.filter((t) => t !== target).map((t) => [t.y, t.y + t.height]).flat()
        changeOffsetByLineAlignment(f, direction, target, xLines, yLines)
      } else {
        clearLineAlignments()
      }
      setResizeOffset(f)
    },
    () => {
      clearLineAlignments()
      setContents(produce(contents, (draft) => {
        draft[selectedIndex].x += resizeOffset.x
        draft[selectedIndex].y += resizeOffset.y
        draft[selectedIndex].width += resizeOffset.width
        draft[selectedIndex].height += resizeOffset.height
      }))
      setResizeOffset({ x: 0, y: 0, width: 0, height: 0 })
    },
    {
      centeredScaling: (e) => e.shiftKey,
    }
  )
  return (
    <>
      {contents.map((content, i) => (
        <div
          key={i}
          style={{
            width: `${content.width + (selectedIndex === i ? resizeOffset.width : 0)}px`,
            height: `${content.height + (selectedIndex === i ? resizeOffset.height : 0)}px`,
            left: `${content.x + (selectedIndex === i ? resizeOffset.x : 0)}px`,
            top: `${content.y + (selectedIndex === i ? resizeOffset.y : 0)}px`,
            position: 'absolute',
            boxSizing: 'border-box',
            border: selectedIndex === i ? '1px solid green' : undefined,
          }}
          onClick={() => setSelectedIndex(i)}
        >
          <img src={content.url} style={{ objectFit: 'fill', width: '100%', height: '100%' }} />
          {selectedIndex === i && <ResizeBar
            scale={1}
            onMouseDown={onStartResize}
          />}
        </div>
      ))}
      <AlignmentLine type='x' value={lineAlignmentX} />
      <AlignmentLine type='y' value={lineAlignmentY} />
      {dragResizeMask}
    </>
  )
}
