import { produce } from "immer"
import React from "react"
import { metaKeyIfMacElseCtrlKey, ResizeBar, useDragResize, useGlobalKeyDown } from "../src"

export default () => {
  const [content, setContent] = React.useState({
    x: 200,
    y: 200,
    width: 100,
    height: 100,
  })
  const { offset, onStart, mask, resetDragResize } = useDragResize(
    () => setContent(previewContent),
    {
      centeredScaling: (e) => e.shiftKey,
      keepRatio: (e) => metaKeyIfMacElseCtrlKey(e) ? content.width / content.height : undefined,
    },
  )
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      resetDragResize()
    }
  })
  const previewContent = produce(content, (draft) => {
    draft.width += offset.width
    draft.height += offset.height
    draft.x += offset.x
    draft.y += offset.y
  })

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
        <ResizeBar onMouseDown={onStart} />
      </div>
      {mask}
    </>
  )
}
