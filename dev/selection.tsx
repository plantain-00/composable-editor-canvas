import React from "react"
import { ResizeBar, ResizeDirection, RotationBar } from "../src"
import { Position, StyleGuide } from "./model"
import { getTargetByPath, getTemplateContentSize } from "./util"

export function SelectionRenderer(props: {
  styleGuide: StyleGuide
  scale: number
  selected: number[] | undefined
  offset: { x: number, y: number, width: number, height: number }
  rotate?: number
  onStartMove?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  onStartRotate: (center: Position) => void
  onStartResize: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, direction: ResizeDirection) => void
}) {
  const { styleGuide, scale, selected, onStartMove, offset, rotate, onStartRotate, onStartResize } = props
  const selectedTarget = getTargetByPath(selected, styleGuide)
  if (!selectedTarget) {
    return null
  }
  const template = selectedTarget.template
  if (selectedTarget.kind === 'template') {
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
  const content = selectedTarget.content
  const target = getTemplateContentSize(content, styleGuide)
  if (!target) {
    return null
  }
  const { width, height } = target
  const x = template.x + selectedTarget.parents.reduce((p, c) => p + c.x, 0) + content.x + offset.x
  const y = template.y + selectedTarget.parents.reduce((p, c) => p + c.y, 0) + content.y + offset.y
  return (
    <>
      <div
        style={{
          position: 'absolute',
          boxSizing: 'border-box',
          left: x,
          top: y,
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
          left: x,
          top: y,
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
