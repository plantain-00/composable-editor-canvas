import React from 'react'

import { TemplateContent, TemplateTextContent, TemplateImageContent, TemplateColorContent, Template, StyleGuide, Size, CanvasSelection } from './model'

export function StyleGuideRenderer(props: {
  styleGuide: StyleGuide
  x: number
  y: number
  scale: number
  targetSize: Size
  setSelected: React.Dispatch<React.SetStateAction<CanvasSelection | undefined>>
  offset: { x: number, y: number, width: number, height: number }
  rotate?: number
  selected?: CanvasSelection
}) {
  const { x, y, scale, styleGuide, targetSize, setSelected, selected, offset, rotate } = props
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
          index={i}
          setSelected={setSelected}
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
  setSelected: React.Dispatch<React.SetStateAction<CanvasSelection | undefined>>
  offset: { x: number, y: number, width: number, height: number }
  rotate?: number
  selected?: CanvasSelection
  scale: number
}) {
  const { template, index, selected, offset, rotate, setSelected, scale } = props
  return (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        left: template.x + (selected?.kind === 'template' && selected.templateIndex === index ? offset.x : 0),
        top: template.y + (selected?.kind === 'template' && selected.templateIndex === index ? offset.y : 0),
        width: template.width + (selected?.kind === 'template' && selected.templateIndex === index ? offset.width : 0),
        height: template.height + (selected?.kind === 'template' && selected.templateIndex === index ? offset.height : 0),
        clipPath: 'inset(0)',
        border: `${1 / scale}px solid rgb(160, 160, 160)`,
        backgroundColor: 'white',
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
          rotate={selected?.kind === 'content' && selected.templateIndex === index && selected.contentIndex === i ? rotate : undefined}
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
  offset?: { x: number, y: number, width: number, height: number }
  rotate?: number
}) {
  const { content, onClick, offset, rotate } = props
  if (content.kind === 'text') {
    return (
      <TemplateTextContentRenderer
        content={content}
        onClick={onClick}
        offset={offset}
        rotate={rotate}
      />
    )
  }
  if (content.kind === 'image') {
    return (
      <TemplateImageContentRenderer
        content={content}
        onClick={onClick}
        offset={offset}
        rotate={rotate}
      />
    )
  }
  if (content.kind === 'color') {
    return (
      <TemplateColorContentRenderer
        content={content}
        onClick={onClick}
        offset={offset}
        rotate={rotate}
      />
    )
  }
  return null
}

function TemplateTextContentRenderer(props: {
  content: TemplateTextContent
  onClick?: React.MouseEventHandler<HTMLDivElement>
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
      onClick={props.onClick}
    >
      {content.text}
    </div>
  )
}

function TemplateImageContentRenderer(props: {
  content: TemplateImageContent
  onClick?: React.MouseEventHandler<HTMLDivElement>
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
      onClick={props.onClick}
    />
  )
}

function TemplateColorContentRenderer(props: {
  content: TemplateColorContent
  onClick?: React.MouseEventHandler<HTMLDivElement>
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
      onClick={props.onClick}
    />
  )
}
