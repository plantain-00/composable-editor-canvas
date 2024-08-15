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
      transformOffset: (f, e) => {
        // keep width >= 0
        if (f.width + content.width < 0) {
          f.width = -content.width
          // keep x < content right border(or content center if centeredScaling is true)
          f.x = Math.min(f.x, content.width * (e?.shiftKey ? 0.5 : 1))
        }
        if (f.height + content.height < 0) {
          f.height = -content.height
          f.y = Math.min(f.y, content.height * (e?.shiftKey ? 0.5 : 1))
        }
        return f
      },
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
