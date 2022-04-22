import produce from "immer"
import React from "react"
import { Region, useDragSelect } from "../src"

export default () => {
  const [contents, setContents] = React.useState<Region[]>([])
  const { onStartSelect, dragSelectMask } = useDragSelect<number[] | undefined>((dragSelectStartPosition, dragSelectEndPosition) => {
    if (dragSelectEndPosition) {
      setContents(produce(contents, (draft) => {
        draft.push({
          x: Math.min(dragSelectStartPosition.x, dragSelectEndPosition.x),
          y: Math.min(dragSelectStartPosition.y, dragSelectEndPosition.y),
          width: Math.abs(dragSelectEndPosition.x - dragSelectStartPosition.x),
          height: Math.abs(dragSelectEndPosition.y - dragSelectStartPosition.y),
        })
      }))
    }
  }, (e) => e.shiftKey)

  return (
    <div
      onMouseDown={(e) => onStartSelect(e, undefined)}
      style={{ height: '100%' }}
    >
      {contents.map((content, i) => (
        <div
          key={i}
          style={{
            width: `${content.width}px`,
            height: `${content.height}px`,
            left: `${content.x}px`,
            top: `${content.y}px`,
            position: 'absolute',
            border: '1px solid green',
          }}
        >
        </div>
      ))}
      {dragSelectMask}
    </div>
  )
}
