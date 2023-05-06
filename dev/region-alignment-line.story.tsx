import { produce } from "immer"
import React from "react"
import { AlignmentLine, useDragMove, useRegionAlignment } from "../src"
import { defaultContents } from "./story-util"

export default () => {
  const [contents, setContents] = React.useState(defaultContents)
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const { regionAlignmentX, regionAlignmentY, changeOffsetByRegionAlignment, clearRegionAlignments } = useRegionAlignment(10)
  const { offset, onStart, mask, startPosition } = useDragMove<number>(
    () => {
      clearRegionAlignments()
      if (offset.x === 0 && offset.y === 0 && startPosition?.data !== undefined) {
        setSelectedIndex(startPosition.data)
        return
      }
      setContents(produce(contents, (draft) => {
        draft[selectedIndex].x += offset.x
        draft[selectedIndex].y += offset.y
      }))
    },
    {
      transformOffset: (f, e) => {
        if (!e?.shiftKey) {
          changeOffsetByRegionAlignment(f, contents[selectedIndex], contents.filter((_, i) => i !== selectedIndex))
        } else {
          clearRegionAlignments()
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
            width: `${content.width}px`,
            height: `${content.height}px`,
            left: `${content.x + (selectedIndex === i ? offset.x : 0)}px`,
            top: `${content.y + (selectedIndex === i ? offset.y : 0)}px`,
            position: 'absolute',
            boxSizing: 'border-box',
            background: `url(${content.url})`,
            backgroundSize: 'contain',
            border: selectedIndex === i ? '1px solid green' : undefined,
          }}
          onMouseDown={(e) => onStart({ x: e.clientX, y: e.clientY }, { data: i })}
        >
        </div>
      ))}
      <AlignmentLine type='x' value={regionAlignmentX} />
      <AlignmentLine type='y' value={regionAlignmentY} />
      {mask}
    </>
  )
}
