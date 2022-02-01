import produce from "immer"
import React from "react"
import { AlignmentLine, useDragMove, useRegionAlignment } from "../src"

export default () => {
  const [contents, setContents] = React.useState([
    {
      x: 500,
      y: 100,
      width: 100,
      height: 100,
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg',
    },
    {
      x: 20,
      y: 200,
      width: 300,
      height: 300,
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg',
    },
    {
      x: 200,
      y: 20,
      width: 200,
      height: 200,
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg',
    },
  ])
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const { alignmentX, alignmentY, changeOffsetByAlignment, clearAlignments } = useRegionAlignment(10)
  const [moveOffset, setMoveOffset] = React.useState({ x: 0, y: 0 })
  const { onStartMove, dragMoveMask, dragMoveStartPosition } = useDragMove<number>(
    (f, e) => {
      if (!e.shiftKey) {
        changeOffsetByAlignment(f, contents[selectedIndex], contents.filter((_, i) => i !== selectedIndex))
      } else {
        clearAlignments()
      }
      setMoveOffset(f)
    },
    () => {
      clearAlignments()
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
            height: `${content.width}px`,
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
      <AlignmentLine type='x' value={alignmentX} />
      <AlignmentLine type='y' value={alignmentY} />
      {dragMoveMask}
    </>
  )
}
