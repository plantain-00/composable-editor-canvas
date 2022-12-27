import React from "react"
import { Nullable, ReactRenderTarget, reactSvgRenderTarget } from "../../src"
import { BaseContent, getContentModel } from "./model"

export function Renderer(props: {
  contents: readonly Nullable<BaseContent>[]
  x: number
  y: number
  scale: number
  width: number
  height: number
  assistentContents: readonly BaseContent[]
  hovering?: number
  selected?: number
} & React.HTMLAttributes<HTMLOrSVGElement>) {
  const target: ReactRenderTarget<unknown> = reactSvgRenderTarget
  const children: unknown[] = []
  for (let i = 0; i < props.contents.length; i++) {
    const content = props.contents[i]
    if (content) {
      const ContentRender = getContentModel(content)?.render
      if (ContentRender) {
        children.push(ContentRender(content, {
          target,
          transformStrokeWidth: w => props.hovering === i || props.selected === i ? w + 1 : w,
          contents: props.contents,
        }))
      }
    }
  }
  for (const content of props.assistentContents) {
    if (!content) {
      continue
    }
    const ContentRender = getContentModel(content)?.render
    if (ContentRender) {
      children.push(ContentRender(content, { target, transformStrokeWidth: w => w, contents: props.contents }))
    }
  }

  return target.renderResult(children, props.width, props.height, {
    attributes: {
      style: {
        position: 'absolute',
        boxSizing: 'border-box',
        ...props.style,
      },
      onClick: props.onClick,
      onMouseDown: props.onMouseDown,
      onContextMenu: props.onContextMenu,
    },
    transform: {
      x: props.x,
      y: props.y,
      scale: props.scale,
    },
  })
}
