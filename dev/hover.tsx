import React from "react"
import { StyleGuide } from "./model"
import { getTargetByPath } from "./selection"

export function HoverRenderer(props: {
  styleGuide: StyleGuide
  hovered: number[]
}) {
  const { styleGuide, hovered } = props
  const target = getTargetByPath(hovered, styleGuide)
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
            left: template.x,
            top: template.y,
            width: template.width,
            height: template.height,
            backgroundColor: 'green',
            opacity: 0.1,
          }}
        />
      </>
    )
  }
  const content = target.content
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
          boxSizing: 'border-box',
          left: template.x + content.x,
          top: template.y + content.y,
          width: width,
          height: height,
          backgroundColor: 'green',
          opacity: 0.1,
          transform: `rotate(${content.rotate ?? 0}deg)`,
        }}
      />
    </>
  )
}
