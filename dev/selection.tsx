import React from "react"
import { CanvasSelection, StyleGuide } from "./model"

export function SelectionRenderer(props: {
  styleGuide: StyleGuide
  scale: number
  selected: CanvasSelection
  offset: { x: number, y: number }
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}) {
  const { styleGuide, scale, selected, onMouseDown, offset } = props
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
        onMouseDown={onMouseDown}
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
      }}
      onMouseDown={onMouseDown}
    />
  )
}
