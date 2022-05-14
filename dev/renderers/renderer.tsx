import React from "react"
import { ReactRenderTarget } from "../../src"
import { BaseContent, getModel } from "../models/model"

export function Renderer(props: {
  type?: string
  contents: BaseContent[]
  selectedContents: number[]
  othersSelectedContents: { selection: number[], operator: string }[]
  hoveringContent: number
  onClick: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void
  transform?: {
    x: number
    y: number
    scale: number
  }
  width: number
  height: number
}) {
  const target = rendererCenter[props.type || getAllRendererTypes()[0]]
  if (!target) {
    return null
  }
  const children: unknown[] = []
  props.contents.forEach((content, i) => {
    const model = getModel(content.type)
    if (!model) {
      return
    }
    const OperatorRender = model.renderOperator
    let color = 0x00ff00
    const operators = props.othersSelectedContents.filter((s) => s.selection.includes(i)).map((c) => c.operator)
    const selected = props.selectedContents.includes(i)
    if (selected) {
      color = 0xff0000
    } else if (props.hoveringContent === i) {
      color = 0x000000
    } else if (operators.length > 0) {
      color = 0x0000ff
    }
    if (selected) {
      operators.unshift('me')
    }
    if (OperatorRender && operators.length > 0) {
      children.push(OperatorRender({ content, stroke: color, target, text: operators.join(','), fontSize: 16 }))
    }
    const ContentRender = model.render
    if (ContentRender) {
      children.push(ContentRender({ content, stroke: color, target }))
    }
    if (selected) {
      const RenderIfSelected = getModel(content.type)?.renderIfSelected
      if (RenderIfSelected) {
        children.push(RenderIfSelected({ content, stroke: color, target }))
      }
    }
  })
  return target.getResult(children, props.width, props.height, {
    style: {
      position: 'absolute',
      boxSizing: 'border-box',
    },
    onClick: props.onClick,
  }, props.transform)
}

const rendererCenter: Record<string, ReactRenderTarget<unknown>> = {}

export function registerRenderer<T>(renderer: ReactRenderTarget<T>) {
  rendererCenter[renderer.type] = renderer
}

export function getAllRendererTypes() {
  return Object.keys(rendererCenter)
}
