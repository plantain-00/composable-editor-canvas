import React from "react"
import { StyleGuide } from "./model"
import { getTargetByPath, getTemplateContentSize } from "./util"

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
  const size = getTemplateContentSize(content, styleGuide)
  if (!size) {
    return null
  }
  const { width, height } = size
  let result = (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        left: content.x,
        top: content.y,
        width: width,
        height: height,
        backgroundColor: 'green',
        opacity: 0.1,
        transform: `rotate(${content.rotate ?? 0}deg)`,
      }}
    />
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
