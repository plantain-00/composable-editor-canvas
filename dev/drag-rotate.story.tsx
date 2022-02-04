import produce from "immer"
import React from "react"
import { RotationBar, useDragRotate } from "../src"

export default () => {
  const [content, setContent] = React.useState({
    x: 200,
    y: 200,
    width: 100,
    height: 100,
    rotate: 0,
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg',
  })
  const [rotate, setRotate] = React.useState<number>()
  const { onStartRotate, dragRotateMask } = useDragRotate(
    (r, e) => {
      if (!e.shiftKey) {
        const snap = Math.round(r / 45) * 45
        if (Math.abs(snap - r) < 5) {
          r = snap
        }
      }
      setRotate(r)
    },
    () => {
      setContent(produce(content, (draft) => {
        draft.rotate = rotate ?? 0
      }))
      setRotate(undefined)
    },
  )

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
          transform: `rotate(${rotate ?? content.rotate}deg)`,
          background: `url(${content.url})`,
          backgroundSize: 'contain',
        }}
      >
        <RotationBar
          scale={1}
          onMouseDown={() => {
            onStartRotate({
              x: content.x + content.width / 2,
              y: content.y + content.height / 2,
            })
          }}
        />
      </div>
      {dragRotateMask}
    </>
  )
}
