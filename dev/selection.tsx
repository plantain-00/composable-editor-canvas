import React from "react"
import { ResizeBar, ResizeDirection, RotationBar } from "../src"
import { StyleGuide, Template, TemplateContent, TemplateReferenceContent, TemplateSnapshotContent } from "./model"

export function SelectionRenderer(props: {
  styleGuide: StyleGuide
  scale: number
  selected: number[] | undefined
  offset: { x: number, y: number, width: number, height: number }
  rotate?: number
  onStartMove?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  onStartRotate: (center: { x: number, y: number }) => void
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

export function getSelectedSize(selected: number[] | undefined, styleGuide: StyleGuide) {
  const target = getTargetByPath(selected, styleGuide)
  if (!target) {
    return undefined
  }
  const template = target.template
  if (target.kind === 'content') {
    return getTemplateContentSize(target.content, styleGuide)
  }
  return template
}

export function getSelectedPosition(selected: number[] | undefined, styleGuide: StyleGuide) {
  const target = getTargetByPath(selected, styleGuide)
  if (!target) {
    return undefined
  }
  return target.kind === 'template' ? target.template : target.content
}

export function getTargetByPath(path: number[] | undefined, styleGuide: StyleGuide) {
  if (!path) {
    return undefined
  }
  const [index, ...indexes] = path
  const template = styleGuide.templates[index]
  if (indexes.length === 0) {
    return {
      kind: 'template' as const,
      template,
    }
  }
  const content = getTargetContentByPath(indexes, template, styleGuide, [])
  if (content) {
    return {
      kind: 'content' as const,
      template,
      content: content.content,
      parents: content.parents,
    }
  }
  return undefined
}

function getTargetContentByPath(
  [index, ...indexes]: number[],
  template: Template,
  styleGuide: StyleGuide,
  parents: (TemplateSnapshotContent | TemplateReferenceContent)[],
): {
  content: TemplateContent
  parents: (TemplateSnapshotContent | TemplateReferenceContent)[]
} | undefined {
  const content = template.contents[index]
  if (indexes.length === 0) {
    return {
      content,
      parents,
    }
  }
  if (content.kind === 'snapshot') {
    return getTargetContentByPath(indexes, content.snapshot, styleGuide, [...parents, content])
  }
  if (content.kind === 'reference') {
    const reference = styleGuide.templates.find((t) => t.id === content.id)
    if (!reference) {
      return undefined
    }
    return getTargetContentByPath(indexes, reference, styleGuide, [...parents, content])
  }
  return undefined
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

export function isSamePath(path1: number[] | undefined, path2: number[] | undefined) {
  if (path1 && path2) {
    if (path1.length !== path2.length) {
      return false
    }
    for (let i = 0; i < path1.length; i++) {
      if (path1[i] !== path2[i]) {
        return false
      }
    }
    return true
  }
  return path1 === undefined && path2 === undefined
}
