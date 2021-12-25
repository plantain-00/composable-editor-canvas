import React from 'react'

import { TemplateContent, TemplateTextContent, TemplateImageContent, TemplateColorContent, Template, StyleGuide, Size, TemplateReferenceContent, TemplateSnapshotContent } from './model'
import { isSamePath, nameSize } from './util'

export function StyleGuideRenderer(props: {
  styleGuide: StyleGuide
  x: number
  y: number
  scale: number
  targetSize: Size
  onStartSelect: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
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
          path={[i]}
          onStartSelect={onStartSelect}
          selected={selected}
          offset={offset}
          rotate={rotate}
          scale={scale}
          isSelected={isSamePath(selected, [i])}
        />
      ))}
    </div>
  )
}

function TemplateRenderer(props: {
  template: Template
  styleGuide: StyleGuide
  path: number[]
  onStartSelect: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  offset: { x: number, y: number, width: number, height: number }
  rotate?: number
  selected?: number[]
  scale: number
  isSelected: boolean
}) {
  const { template, selected, offset, rotate, onStartSelect, scale } = props
  return (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        left: template.x + (props.isSelected ? offset.x : 0),
        top: template.y + (props.isSelected ? offset.y : 0),
        width: template.width + (props.isSelected ? offset.width : 0),
        height: template.height + (props.isSelected ? offset.height : 0),
        border: `${1 / scale}px solid rgb(160, 160, 160)`,
        backgroundColor: 'white',
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onStartSelect(e)
      }}
    >
      {template.name && <div
        style={{
          position: 'absolute',
          top: `-${nameSize}px`,
          lineHeight: `${nameSize}px`,
          fontSize: '12px',
          width: `${template.name.length * nameSize}px`,
          transform: `scale(${1 / scale})`,
          transformOrigin: 'left bottom',
          cursor: 'pointer',
        }}
      >
        {template.name}
      </div>}
      {template.contents.map((content, i) => (
        <TemplateContentRenderer
          key={i}
          content={content}
          styleGuide={props.styleGuide}
          offset={offset}
          rotate={rotate}
          path={[...props.path, i]}
          selected={selected}
        />
      ))}
    </div>
  )
}

function SymbolRenderer(props: {
  template: Template
  styleGuide: StyleGuide
  path: number[]
  offset?: { x: number, y: number, width: number, height: number }
  rotate?: number
  content: TemplateReferenceContent | TemplateSnapshotContent
  selected?: number[]
  isSelected: boolean
}) {
  const { template, styleGuide, content, offset, rotate } = props
  return (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        left: content.x + (props.isSelected ? offset?.x ?? 0 : 0),
        top: content.y + (props.isSelected ? offset?.y ?? 0 : 0),
        width: template.width + (props.isSelected ? offset?.width ?? 0 : 0),
        height: template.height + (props.isSelected ? offset?.height ?? 0 : 0),
        clipPath: 'inset(0)',
        backgroundColor: 'white',
        transform: `rotate(${(props.isSelected ? rotate : undefined) ?? content.rotate ?? 0}deg)`,
      }}
    >
      {template.contents.map((content, i) => (
        <TemplateContentRenderer
          key={i}
          content={content}
          styleGuide={styleGuide}
          path={[...props.path, i]}
          offset={offset}
          rotate={rotate}
          selected={props.selected}
        />
      ))}
    </div>
  )
}

function TemplateContentRenderer(props: {
  content: TemplateContent
  path: number[]
  offset?: { x: number, y: number, width: number, height: number }
  rotate?: number
  styleGuide: StyleGuide
  selected?: number[]
}) {
  const { content, offset, rotate } = props
  if (content.hidden) {
    return null
  }
  const isSelected = isSamePath(props.selected, props.path)
  if (content.kind === 'text') {
    return (
      <TemplateTextContentRenderer
        content={content}
        offset={isSelected ? offset : undefined}
        rotate={isSelected ? rotate : undefined}
      />
    )
  }
  if (content.kind === 'image') {
    return (
      <TemplateImageContentRenderer
        content={content}
        offset={isSelected ? offset : undefined}
        rotate={isSelected ? rotate : undefined}
      />
    )
  }
  if (content.kind === 'color') {
    return (
      <TemplateColorContentRenderer
        content={content}
        offset={isSelected ? offset : undefined}
        rotate={isSelected ? rotate : undefined}
      />
    )
  }
  if (content.kind === 'reference') {
    const index = props.styleGuide.templates.findIndex((t) => t.id === content.id)
    if (index >= 0) {
      return (
        <SymbolRenderer
          template={props.styleGuide.templates[index]}
          styleGuide={props.styleGuide}
          content={content}
          path={[index]}
          offset={offset}
          rotate={rotate}
          selected={props.selected}
          isSelected={isSelected}
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
        path={props.path}
        offset={offset}
        rotate={rotate}
        selected={props.selected}
        isSelected={isSelected}
      />
    )
  }
  return null
}

function TemplateTextContentRenderer(props: {
  content: TemplateTextContent
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
    >
      {content.text}
    </div>
  )
}

function TemplateImageContentRenderer(props: {
  content: TemplateImageContent
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
    />
  )
}

function TemplateColorContentRenderer(props: {
  content: TemplateColorContent
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
    />
  )
}
