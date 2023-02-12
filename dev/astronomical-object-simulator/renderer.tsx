import React from "react"
import { Patch, applyPatches } from 'immer'
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
  previewPatches: Patch[]
  yz: boolean
} & React.HTMLAttributes<HTMLOrSVGElement>) {
  const target: ReactRenderTarget<unknown> = reactSvgRenderTarget
  const children: unknown[] = []
  const contents = props.previewPatches.length > 0 ? applyPatches(props.contents, props.previewPatches) : props.contents
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i]
    if (content) {
      const ContentRender = getContentModel(content)?.render
      if (ContentRender) {
        children.push(ContentRender(content, {
          target,
          transformRadius: w => props.hovering === i || props.selected === i ? w + 1 : w,
          yz: props.yz,
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
      children.push(ContentRender(content, { target, transformRadius: w => w, yz: props.yz }))
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
