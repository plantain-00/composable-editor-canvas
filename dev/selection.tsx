import React from "react"
import { ResizeBar, ResizeDirection, RotationBar } from "../src"
import { CanvasSelection, StyleGuide, TemplateContent } from "./model"

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
  const target = getTemplateContentSize(content, styleGuide)
  if (!target) {
    return null
  }
  const { width, height } = target
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
          onMouseDown={(e) => {
            e.stopPropagation()
            onStartRotate({
              x: template.x + content.x + width / 2,
              y: template.y + content.y + height / 2,
            })
          }}
        />
        <ResizeBar
          scale={scale}
          onMouseDown={onStartResize}
          rotate={content.rotate}
        />
      </div>
    </>
  )
}

export function getSelectedSize(selected: CanvasSelection | undefined, styleGuide: StyleGuide) {
  if (!selected) {
    return undefined
  }
  const template = styleGuide.templates[selected.templateIndex]
  if (selected.kind === 'content') {
    return getTemplateContentSize(template.contents[selected.contentIndex], styleGuide)
  }
  return template
}

export function getSelectedPosition(selected: CanvasSelection | undefined, styleGuide: StyleGuide) {
  if (!selected) {
    return undefined
  }
  const template = styleGuide.templates[selected.templateIndex]
  if (selected.kind === 'content') {
    return template.contents[selected.contentIndex]
  }
  return template
}

export function getTemplateContentSize(content: TemplateContent, styleGuide: StyleGuide) {
  if (content.kind === 'snapshot') {
    return content.snapshot
  }
  if (content.kind === 'reference') {
    const reference = styleGuide.templates.find((t) => t.id === content.id)
    if (!reference) {
      return undefined
    }
    return reference
  }
  return content
}
