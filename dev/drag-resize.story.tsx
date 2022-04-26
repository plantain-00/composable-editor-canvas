import produce from "immer"
import React from "react"
import { ResizeBar, useDragResize } from "../src"

export default () => {
  const [content, setContent] = React.useState({
    x: 200,
    y: 200,
    width: 100,
    height: 100,
  })
  const [resizeOffset, setResizeOffset] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
  const previewContent = produce(content, (draft) => {
    draft.width += resizeOffset.width
    draft.height += resizeOffset.height
    draft.x += resizeOffset.x
    draft.y += resizeOffset.y
  })
  const { onStartResize, dragResizeMask } = useDragResize(
    setResizeOffset,
    () => setContent(previewContent),
    {
      centeredScaling: (e) => e.shiftKey,
      keepRatio: (e) => e.metaKey ? content.width / content.height : undefined,
    },
  )

  return (
    <>
      <div
        style={{
          width: `${previewContent.width}px`,
          height: `${previewContent.height}px`,
          left: `${previewContent.x}px`,
          top: `${previewContent.y}px`,
          boxSizing: 'border-box',
          position: 'absolute',
          background: 'radial-gradient(50% 50% at 50% 50%, red 0%, white 100%)',
        }}
      >
        <ResizeBar
          scale={1}
          onMouseDown={onStartResize}
        />
      </div>
      {dragResizeMask}
    </>
  )
}
