import { produce } from "immer"
import React from "react"
import { RotationBar, useDragRotate, useGlobalKeyDown } from "../src"

export default () => {
  const [content, setContent] = React.useState({
    x: 200,
    y: 200,
    width: 100,
    height: 100,
    rotate: 0,
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg',
  })
  const { offset, onStart, mask, resetDragRotate } = useDragRotate(
    () => setContent(previewContent),
    {
      transformOffset: (r, e) => {
        if (e && r !== undefined && !e.shiftKey) {
          const snap = Math.round(r / 45) * 45
          if (Math.abs(snap - r) < 5) {
            r = snap
          }
        }
        return r
      },
    }
  )
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      resetDragRotate()
    }
  })
  const previewContent = produce(content, (draft) => {
    if (offset?.angle !== undefined) {
      draft.rotate = offset.angle
    }
  })

  return (
    <>
      <div
        style={{
          width: `${content.width}px`,
          height: `${content.width}px`,
          left: `${content.x}px`,
          top: `${content.y}px`,
          boxSizing: 'border-box',
          position: 'absolute',
          transform: `rotate(${previewContent.rotate}deg)`,
          background: `url(${content.url})`,
          backgroundSize: 'contain',
        }}
      >
        <RotationBar onMouseDown={() => onStart({ x: content.x + content.width / 2, y: content.y + content.height / 2 })} />
      </div>
      {mask}
    </>
  )
}
