import React from "react"
import { ReactRenderTarget } from "../../src"
import { BaseContent, getModel } from "../models/model"

export function Renderer(props: {
  type?: string
  contents: BaseContent[]
  selectedContents: number[]
  hoveringContent: number
  onClick: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void
}) {
  const target = rendererCenter[props.type || getAllRendererTypes()[0]]
  if (!target) {
    return null
  }
  const children: JSX.Element[] = []
  props.contents.forEach((content, i) => {
    let color = 0x00ff00
    if (props.selectedContents.includes(i)) {
      color = 0xff0000
    } else if (props.hoveringContent === i) {
      color = 0x000000
    }
    const ContentRender = getModel(content.type)?.render
    if (ContentRender) {
      children.push(<ContentRender key={i} content={content} stroke={color} target={target} />)
    }
  })
  return target.getResult(children, 800, 600, {
    style: { position: 'absolute', left: 0, top: 0 },
    onClick: props.onClick,
  })
}

const rendererCenter: Record<string, ReactRenderTarget> = {}

export function registerRenderer(renderer: ReactRenderTarget) {
  rendererCenter[renderer.type] = renderer
}

export function getAllRendererTypes() {
  return Object.keys(rendererCenter)
}
