import React from 'react'

import { TemplateContent, TemplateTextContent, TemplateImageContent, TemplateColorContent, Template, StyleGuide, Size, CanvasSelection } from './model'

export function StyleGuideRenderer(props: {
  styleGuide: StyleGuide
  x: number
  y: number
  scale: number
  targetSize: Size
  setSelected: React.Dispatch<React.SetStateAction<CanvasSelection | undefined>>
  offset: { x: number, y: number }
  selected?: CanvasSelection
}) {
  const { x, y, scale, styleGuide, targetSize, setSelected, selected, offset } = props
  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        width: targetSize.width,
        height: targetSize.height,
      }}
    >
      {styleGuide.templates.map((template, i) => (
        <TemplateRenderer
          key={template.id}
          template={template}
          index={i}
          setSelected={setSelected}
          selected={selected}
          offset={offset}
          scale={scale}
        />
      ))}
    </div>
  )
}

function TemplateRenderer(props: {
  template: Template
  index: number
  setSelected: React.Dispatch<React.SetStateAction<CanvasSelection | undefined>>
  offset: { x: number, y: number }
  selected?: CanvasSelection
  scale: number
}) {
  const { template, index, selected, offset, setSelected, scale } = props
  return (
    <div
      style={{
        position: 'absolute',
        left: template.x + (selected?.kind === 'template' && selected.templateIndex === index ? offset.x : 0),
        top: template.y + (selected?.kind === 'template' && selected.templateIndex === index ? offset.y : 0),
        width: template.width,
        height: template.height,
        clipPath: 'inset(0)',
        border: `${1 / scale}px solid rgb(160, 160, 160)`,
      }}
      onClick={() => {
        setSelected({
          kind: 'template',
          templateIndex: index,
        })
      }}
    >
      {template.contents.map((content, i) => (
        <TemplateContentRenderer
          key={i}
          content={content}
          offset={selected?.kind === 'content' && selected.templateIndex === index && selected.contentIndex === i ? offset : undefined}
          onClick={(e) => {
            e.stopPropagation()
            setSelected({
              kind: 'content',
              templateIndex: index,
              contentIndex: i,
            })
          }}
        />
      ))}
    </div>
  )
}

function TemplateContentRenderer(props: {
  content: TemplateContent
  onClick?: React.MouseEventHandler<HTMLDivElement>
  offset?: { x: number, y: number }
}) {
  const { content, onClick, offset } = props
  if (content.kind === 'text') {
    return (
      <TemplateTextContentRenderer
        content={content}
        onClick={onClick}
        offset={offset}
      />
    )
  }
  if (content.kind === 'image') {
    return (
      <TemplateImageContentRenderer
        content={content}
        onClick={onClick}
        offset={offset}
      />
    )
  }
  if (content.kind === 'color') {
    return (
      <TemplateColorContentRenderer
        content={content}
        onClick={onClick}
        offset={offset}
      />
    )
  }
  return null
}

function TemplateTextContentRenderer(props: {
  content: TemplateTextContent
  onClick?: React.MouseEventHandler<HTMLDivElement>
  offset?: { x: number, y: number }
}) {
  const { content, offset } = props
  return (
    <div
      style={{
        position: 'absolute',
        left: content.x + (offset?.x ?? 0),
        top: content.y + (offset?.y ?? 0),
        width: content.width,
        height: content.height,
        color: content.color,
        fontSize: content.fontSize,
        fontFamily: content.fontFamily,
      }}
      onClick={props.onClick}
    >
      {content.text}
    </div>
  )
}

function TemplateImageContentRenderer(props: {
  content: TemplateImageContent
  onClick?: React.MouseEventHandler<HTMLDivElement>
  offset?: { x: number, y: number }
}) {
  const { content, offset } = props
  return (
    <img
      src={content.url}
      style={{
        position: 'absolute',
        left: content.x + (offset?.x ?? 0),
        top: content.y + (offset?.y ?? 0),
        width: content.width,
        height: content.height,
      }}
      onClick={props.onClick}
    />
  )
}

function TemplateColorContentRenderer(props: {
  content: TemplateColorContent
  onClick?: React.MouseEventHandler<HTMLDivElement>
  offset?: { x: number, y: number }
}) {
  const { content, offset } = props
  return (
    <div
      style={{
        position: 'absolute',
        left: content.x + (offset?.x ?? 0),
        top: content.y + (offset?.y ?? 0),
        width: content.width,
        height: content.height,
        backgroundColor: content.color,
      }}
      onClick={props.onClick}
    />
  )
}
