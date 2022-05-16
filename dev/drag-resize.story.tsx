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
  const { offset, onStart, mask } = useDragResize(
    () => setContent(previewContent),
    {
      centeredScaling: (e) => e.shiftKey,
      keepRatio: (e) => e.metaKey ? content.width / content.height : undefined,
    },
  )
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
        <ResizeBar
          scale={1}
          onMouseDown={onStart}
        />
      </div>
      {mask}
    </>
  )
}
