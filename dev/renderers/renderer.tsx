import React from "react"
import { isSelected, ReactRenderTarget } from "../../src"
import { BaseContent, getModel } from "../models/model"

export function Renderer(props: {
  type?: string
  contents: readonly BaseContent[]
  selected: readonly number[][]
  othersSelectedContents: readonly { selection: number[], operator: string }[]
  hovering: readonly number[][]
  transform?: {
    x: number
    y: number
    scale: number
  }
  width: number
  height: number
} & React.DOMAttributes<HTMLOrSVGElement>) {
  const target = rendererCenter[props.type || getAllRendererTypes()[0]]
  if (!target) {
    return null
  }
  const strokeWidth = 1 / (props.transform?.scale ?? 1)
  const children: unknown[] = []
  props.contents.forEach((content, i) => {
    const model = getModel(content.type)
    if (!model) {
      return
    }
    let color: number | undefined
    const partsStyles: { index: number, color: number }[] = []
    const operators = props.othersSelectedContents.filter((s) => s.selection.includes(i)).map((c) => c.operator)
    let selected = false
    if (isSelected([i], props.selected)) {
      color = 0xff0000
      selected = true
    } else {
      if (isSelected([i], props.hovering)) {
        color = 0x000000
      } else if (operators.length > 0) {
        color = 0x0000ff
      }
      const selectedPart = props.selected.filter((v) => v.length === 2 && v[0] === i)
      if (selectedPart.length > 0) {
        partsStyles.push(...selectedPart.map((s) => ({ index: s[1], color: 0xff0000 })))
        selected = true
      }
      const hoveringPart = props.hovering.find((v) => v.length === 2 && v[0] === i)
      if (hoveringPart) {
        partsStyles.push({ index: hoveringPart[1], color: 0x000000 })
      }
    }
    if (selected) {
      operators.unshift('me')
    }
    if (model.getOperatorRenderPosition && operators.length > 0) {
      const renderPosition = model.getOperatorRenderPosition(content, props.contents)
      children.push(target.renderText(renderPosition.x, renderPosition.y, operators.join(','), 0xff0000, 16))
    }
    const ContentRender = model.render
    if (ContentRender) {
      children.push(ContentRender({ content, color, target, strokeWidth, contents: props.contents, partsStyles }))
    }
    if (selected) {
      const RenderIfSelected = getModel(content.type)?.renderIfSelected
      if (RenderIfSelected) {
        children.push(RenderIfSelected({ content, color, target, strokeWidth }))
      }
    }
  })
  return target.renderResult(children, props.width, props.height, {
    style: {
      position: 'absolute',
      boxSizing: 'border-box',
    },
    onClick: props.onClick,
    onMouseDown: props.onMouseDown,
  }, props.transform)
}

const rendererCenter: Record<string, ReactRenderTarget<unknown>> = {}

export function registerRenderer<T>(renderer: ReactRenderTarget<T>) {
  rendererCenter[renderer.type] = renderer
}

export function getAllRendererTypes() {
  return Object.keys(rendererCenter)
}
