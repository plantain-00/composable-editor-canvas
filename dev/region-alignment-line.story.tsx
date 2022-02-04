import produce from "immer"
import React from "react"
import { AlignmentLine, useDragMove, useRegionAlignment } from "../src"
import { defaultContents } from "./story-util"

export default () => {
  const [contents, setContents] = React.useState(defaultContents)
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const { regionAlignmentX, regionAlignmentY, changeOffsetByRegionAlignment, clearRegionAlignments } = useRegionAlignment(10)
  const [moveOffset, setMoveOffset] = React.useState({ x: 0, y: 0 })
  const { onStartMove, dragMoveMask, dragMoveStartPosition } = useDragMove<number>(
    (f, e) => {
      if (!e.shiftKey) {
        changeOffsetByRegionAlignment(f, contents[selectedIndex], contents.filter((_, i) => i !== selectedIndex))
      } else {
        clearRegionAlignments()
      }
      setMoveOffset(f)
    },
    () => {
      clearRegionAlignments()
      if (moveOffset.x === 0 && moveOffset.y === 0 && dragMoveStartPosition?.data !== undefined) {
        setSelectedIndex(dragMoveStartPosition.data)
        return
      }
      setContents(produce(contents, (draft) => {
        draft[selectedIndex].x += moveOffset.x
        draft[selectedIndex].y += moveOffset.y
      }))
      setMoveOffset({ x: 0, y: 0 })
    },
  )
  return (
    <>
      {contents.map((content, i) => (
        <div
          key={i}
          style={{
            width: `${content.width}px`,
            height: `${content.height}px`,
            left: `${content.x + (selectedIndex === i ? moveOffset.x : 0)}px`,
            top: `${content.y + (selectedIndex === i ? moveOffset.y : 0)}px`,
            position: 'absolute',
            boxSizing: 'border-box',
            background: `url(${content.url})`,
            backgroundSize: 'contain',
            border: selectedIndex === i ? '1px solid green' : undefined,
          }}
          onMouseDown={(e) => onStartMove(e, { data: i })}
        >
        </div>
      ))}
      <AlignmentLine type='x' value={regionAlignmentX} />
      <AlignmentLine type='y' value={regionAlignmentY} />
      {dragMoveMask}
    </>
  )
}
