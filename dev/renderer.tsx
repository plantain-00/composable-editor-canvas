import React from 'react'

import { TemplateContent, TemplateTextContent, TemplateImageContent, TemplateColorContent, Template, StyleGuide, Size, TemplateReferenceContent, TemplateSnapshotContent } from './model'
import { getTargetByPath } from './selection'

export function StyleGuideRenderer(props: {
  styleGuide: StyleGuide
  x: number
  y: number
  scale: number
  targetSize: Size
  onStartSelect: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: number[]) => void
  offset: { x: number, y: number, width: number, height: number }
  rotate?: number
  selected?: number[]
}) {
  const { x, y, scale, styleGuide, targetSize, onStartSelect, selected, offset, rotate } = props
  return (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        width: targetSize.width,
        height: targetSize.height,
      }}
    >
      {styleGuide.templates.map((template, i) => (
        <TemplateRenderer
          key={template.id}
          template={template}
          styleGuide={styleGuide}
          index={i}
          onStartSelect={onStartSelect}
          selected={selected}
          offset={offset}
          rotate={rotate}
          scale={scale}
        />
      ))}
    </div>
  )
}

function TemplateRenderer(props: {
  template: Template
  index: number
  onStartSelect: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: number[]) => void
  offset: { x: number, y: number, width: number, height: number }
  rotate?: number
  selected?: number[]
  scale: number
  styleGuide: StyleGuide
}) {
  const { template, index, selected, offset, rotate, onStartSelect, scale } = props
  const selectedTarget = getTargetByPath(selected, props.styleGuide)
  return (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        left: template.x + (selectedTarget?.kind === 'template' && selectedTarget.template === template ? offset.x : 0),
        top: template.y + (selectedTarget?.kind === 'template' && selectedTarget.template === template ? offset.y : 0),
        width: template.width + (selectedTarget?.kind === 'template' && selectedTarget.template === template ? offset.width : 0),
        height: template.height + (selectedTarget?.kind === 'template' && selectedTarget.template === template ? offset.height : 0),
        clipPath: 'inset(0)',
        border: `${1 / scale}px solid rgb(160, 160, 160)`,
        backgroundColor: 'white',
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onStartSelect(e, [index])
      }}
    >
      {template.contents.map((content, i) => (
        <TemplateContentRenderer
          key={i}
          content={content}
          styleGuide={props.styleGuide}
          offset={selectedTarget?.kind === 'content' && selectedTarget.content === content ? offset : undefined}
          rotate={selectedTarget?.kind === 'content' && selectedTarget.content === content ? rotate : undefined}
          path={[index, i]}
          onStartSelect={props.onStartSelect}
        />
      ))}
    </div>
  )
}

function SymbolRenderer(props: {
  template: Template
  styleGuide: StyleGuide
  path: number[]
  onStartSelect: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: number[]) => void
  offset?: { x: number, y: number, width: number, height: number }
  rotate?: number
  content: TemplateReferenceContent | TemplateSnapshotContent
}) {
  const { template, styleGuide, content, offset, rotate } = props
  return (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        left: content.x + (offset?.x ?? 0),
        top: content.y + (offset?.y ?? 0),
        width: template.width + (offset?.width ?? 0),
        height: template.height + (offset?.height ?? 0),
        clipPath: 'inset(0)',
        backgroundColor: 'white',
        transform: `rotate(${rotate ?? content.rotate ?? 0}deg)`,
      }}
    >
      {template.contents.map((content, i) => (
        <TemplateContentRenderer
          key={i}
          content={content}
          styleGuide={styleGuide}
          path={[...props.path, i]}
          onStartSelect={props.onStartSelect}
        />
      ))}
    </div>
  )
}

function TemplateContentRenderer(props: {
  content: TemplateContent
  path: number[]
  onStartSelect: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: number[]) => void
  offset?: { x: number, y: number, width: number, height: number }
  rotate?: number
  styleGuide: StyleGuide
}) {
  const { content, offset, rotate } = props
  if (content.hidden) {
    return null
  }
  if (content.kind === 'text') {
    return (
      <TemplateTextContentRenderer
        content={content}
        onStartSelect={props.onStartSelect}
        path={props.path}
        offset={offset}
        rotate={rotate}
      />
    )
  }
  if (content.kind === 'image') {
    return (
      <TemplateImageContentRenderer
        content={content}
        onStartSelect={props.onStartSelect}
        path={props.path}
        offset={offset}
        rotate={rotate}
      />
    )
  }
  if (content.kind === 'color') {
    return (
      <TemplateColorContentRenderer
        content={content}
        onStartSelect={props.onStartSelect}
        path={props.path}
        offset={offset}
        rotate={rotate}
      />
    )
  }
  if (content.kind === 'reference') {
    const reference = props.styleGuide.templates.find((t) => t.id === content.id)
    if (reference) {
      return (
        <SymbolRenderer
          template={reference}
          styleGuide={props.styleGuide}
          content={content}
          onStartSelect={props.onStartSelect}
          path={props.path}
          offset={offset}
          rotate={rotate}
        />
      )
    }
  }
  if (content.kind === 'snapshot') {
    return (
      <SymbolRenderer
        template={content.snapshot}
        styleGuide={props.styleGuide}
        content={content}
        onStartSelect={props.onStartSelect}
        path={props.path}
        offset={offset}
        rotate={rotate}
      />
    )
  }
  return null
}

function TemplateTextContentRenderer(props: {
  content: TemplateTextContent
  path: number[]
  onStartSelect: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: number[]) => void
  offset?: { x: number, y: number, width: number, height: number }
  rotate?: number
}) {
  const { content, offset, rotate } = props
  return (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        left: content.x + (offset?.x ?? 0),
        top: content.y + (offset?.y ?? 0),
        width: content.width + (offset?.width ?? 0),
        height: content.height + (offset?.height ?? 0),
        color: content.color,
        fontSize: content.fontSize,
        fontFamily: content.fontFamily,
        transform: `rotate(${rotate ?? content.rotate ?? 0}deg)`,
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        props.onStartSelect(e, props.path)
      }}
    >
      {content.text}
    </div>
  )
}

function TemplateImageContentRenderer(props: {
  content: TemplateImageContent
  path: number[]
  onStartSelect: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: number[]) => void
  offset?: { x: number, y: number, width: number, height: number }
  rotate?: number
}) {
  const { content, offset, rotate } = props
  return (
    <img
      src={content.url}
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        left: content.x + (offset?.x ?? 0),
        top: content.y + (offset?.y ?? 0),
        width: content.width + (offset?.width ?? 0),
        height: content.height + (offset?.height ?? 0),
        transform: `rotate(${rotate ?? content.rotate ?? 0}deg)`,
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        props.onStartSelect(e, props.path)
      }}
    />
  )
}

function TemplateColorContentRenderer(props: {
  content: TemplateColorContent
  path: number[]
  onStartSelect: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: number[]) => void
  offset?: { x: number, y: number, width: number, height: number }
  rotate?: number
}) {
  const { content, offset, rotate } = props
  return (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        left: content.x + (offset?.x ?? 0),
        top: content.y + (offset?.y ?? 0),
        width: content.width + (offset?.width ?? 0),
        height: content.height + (offset?.height ?? 0),
        backgroundColor: content.color,
        transform: `rotate(${rotate ?? content.rotate ?? 0}deg)`,
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        props.onStartSelect(e, props.path)
      }}
    />
  )
}
