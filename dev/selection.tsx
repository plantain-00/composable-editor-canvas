import React from "react"
import { RotationBar } from "../src"
import { CanvasSelection, StyleGuide } from "./model"

export function SelectionRenderer(props: {
  styleGuide: StyleGuide
  scale: number
  selected: CanvasSelection
  offset: { x: number, y: number }
  rotate?: number
  onStartMove?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  onStartRotate: (center: { x: number, y: number }) => void
}) {
  const { styleGuide, scale, selected, onStartMove, offset, rotate, onStartRotate } = props
  const template = styleGuide.templates[selected.templateIndex]
  if (selected.kind === 'template') {
    return (
      <div
        style={{
          position: 'absolute',
          left: template.x + offset.x,
          top: template.y + offset.y,
          width: template.width,
          height: template.height,
          border: `${1 / scale}px solid green`,
          cursor: 'grab',
          pointerEvents: 'auto',
        }}
        onMouseDown={onStartMove}
      />
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
          left: template.x + content.x + offset.x,
          top: template.y + content.y + offset.y,
          width,
          height,
          border: `${1 / scale}px solid green`,
          cursor: 'grab',
          pointerEvents: 'auto',
          transform: `rotate(${rotate ?? content.rotate ?? 0}deg)`,
        }}
        onMouseDown={onStartMove}
      />
      <div
        style={{
          position: 'absolute',
          left: template.x + content.x + offset.x,
          top: template.y + content.y + offset.y,
          width,
          height,
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
      </div>
    </>
  )
}
