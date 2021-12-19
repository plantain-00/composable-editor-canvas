import React from "react"
import { ResizeBar, ResizeDirection, RotationBar } from "../src"
import { CanvasSelection, StyleGuide } from "./model"

export function SelectionRenderer(props: {
  styleGuide: StyleGuide
  scale: number
  selected: CanvasSelection
  offset: { x: number, y: number, width: number, height: number }
  rotate?: number
  onStartMove?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  onStartRotate: (center: { x: number, y: number }) => void
  onStartResize: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, direction: ResizeDirection) => void
}) {
  const { styleGuide, scale, selected, onStartMove, offset, rotate, onStartRotate, onStartResize } = props
  const template = styleGuide.templates[selected.templateIndex]
  if (selected.kind === 'template') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            boxSizing: 'border-box',
            left: template.x + offset.x,
            top: template.y + offset.y,
            width: template.width + offset.width,
            height: template.height + offset.height,
            border: `${1 / scale}px solid green`,
            cursor: 'move',
            pointerEvents: 'auto',
          }}
          onMouseDown={onStartMove}
        />
        <div
          style={{
            position: 'absolute',
            boxSizing: 'border-box',
            left: template.x + offset.x,
            top: template.y + offset.y,
            width: template.width + offset.width,
            height: template.height + offset.height,
          }}
        >
          <ResizeBar
            scale={scale}
            onMouseDown={onStartResize}
          />
        </div>
      </>
    )
  }
  const content = template.contents[selected.contentIndex]
  let width: number
  let height: number
  if (content.kind === 'snapshot') {
    width = content.snapshot.width
    height = content.snapshot.height
  } else if (content.kind === 'reference') {
    const reference = styleGuide.templates.find((t) => t.id === content.id)
    if (!reference) {
      return null
    }
    width = reference.width
    height = reference.height
  } else {
    width = content.width
    height = content.height
  }
  return (
    <>
      <div
        style={{
          position: 'absolute',
          boxSizing: 'border-box',
          left: template.x + content.x + offset.x,
          top: template.y + content.y + offset.y,
          width: width + offset.width,
          height: height + offset.height,
          border: `${1 / scale}px solid green`,
          cursor: 'move',
          pointerEvents: 'auto',
          transform: `rotate(${rotate ?? content.rotate ?? 0}deg)`,
        }}
        onMouseDown={onStartMove}
      />
      <div
        style={{
          position: 'absolute',
          boxSizing: 'border-box',
          left: template.x + content.x + offset.x,
          top: template.y + content.y + offset.y,
          width: width + offset.width,
          height: height + offset.height,
          transform: `rotate(${rotate ?? content.rotate ?? 0}deg)`,
        }}
      >
        <RotationBar
          scale={scale}
          onMouseDown={() => {
            onStartRotate({
              x: template.x + content.x + width / 2,
              y: template.y + content.y + height / 2,
            })
          }}
        />
        <ResizeBar
          scale={scale}
          onMouseDown={onStartResize}
        />
      </div>
    </>
  )
}
