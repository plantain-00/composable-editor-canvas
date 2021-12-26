import React from "react"
import { ResizeBar, ResizeDirection, RotationBar } from "../src"
import { Position, StyleGuide } from "./model"
import { getRotatedCenter, getTargetByPath, getTemplateContentSize, nameSize } from "./util"

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
  const target = getTargetByPath(selected, styleGuide)
  if (!target) {
    return null
  }
  const template = target.template
  if (target.kind === 'template') {
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
        {template.name && <div
          style={{
            position: 'absolute',
            left: template.x + offset.x,
            top: template.y + offset.y - nameSize,
            height: nameSize,
            fontSize: '12px',
            width: template.name.length * nameSize,
            transform: `scale(${1 / scale})`,
            transformOrigin: 'left bottom',
            cursor: 'move',
            pointerEvents: 'auto',
          }}
          onMouseDown={onStartMove}
        />}
      </>
    )
  }
  const content = target.content
  const size = getTemplateContentSize(content, styleGuide)
  if (!size) {
    return null
  }
  const { width, height } = size
  let result = (
    <>
      <div
        style={{
          position: 'absolute',
          boxSizing: 'border-box',
          left: content.x + offset.x,
          top: content.y + offset.y,
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
          left: content.x + offset.x,
          top: content.y + offset.y,
          width: width + offset.width,
          height: height + offset.height,
          transform: `rotate(${rotate ?? content.rotate ?? 0}deg)`,
        }}
      >
        <RotationBar
          scale={scale}
          onMouseDown={(e) => {
            e.stopPropagation()
            onStartRotate(getRotatedCenter(target, styleGuide))
          }}
        />
        <ResizeBar
          scale={scale}
          onMouseDown={onStartResize}
          rotate={(content.rotate ?? 0) + target.parents.reduce((p, c) => p + (c.rotate ?? 0), 0)}
        />
      </div>
    </>
  )
  for (const parent of target.parents) {
    if (parent.kind === 'snapshot') {
      result = (
        <div
          style={{
            position: 'absolute',
            left: parent.x,
            top: parent.y,
            width: parent.snapshot.width,
            height: parent.snapshot.height,
            transform: `rotate(${parent.rotate ?? 0}deg)`,
          }}
        >
          {result}
        </div>
      )
    }
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: template.x,
        top: template.y,
        width: template.width,
        height: template.height,
      }}
    >
      {result}
    </div>
  )
}
