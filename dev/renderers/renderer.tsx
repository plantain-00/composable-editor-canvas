import React from "react"
import { getColorString, isSelected, ReactRenderTarget, WeaksetCache } from "../../src"
import { isLineContent, lineModel } from "../models/line-model"
import { BaseContent, getModel } from "../models/model"
import { isPolyLineContent } from "../models/polyline-model"

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
  backgroundColor: number
} & React.DOMAttributes<HTMLOrSVGElement>) {
  const target = rendererCenter[props.type || getAllRendererTypes()[0]]
  if (!target) {
    return null
  }
  const now = Date.now()
  const strokeWidth = 1 / (props.transform?.scale ?? 1)
  const backgroundColor = getColorString(props.backgroundColor)
  const r = +`0x${backgroundColor.substring(1, 3)}`
  const b = +`0x${backgroundColor.substring(3, 5)}`
  const g = +`0x${backgroundColor.substring(5)}`
  const light = (Math.max(r, g, b) + Math.min(r, g, b)) / 2
  const transformColor = (color: number) => {
    if (light < 128) {
      return color === 0 ? 0xffffff : color
    }
    return color === 0xffffff ? 0 : color
  }
  const children: unknown[] = []
  const scale = props.transform?.scale ?? 1
  const fallbackEnabled = visibleContents.size > 1000
  let count = 0
  props.contents.forEach((content, i) => {
    if (!visibleContents.has(content)) {
      return
    }
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
        color = 0x00ff00
      } else if (operators.length > 0) {
        color = 0x0000ff
      } else {
        color = model.getDefaultColor?.(content) ?? 0x000000
      }
      const selectedPart = props.selected.filter((v) => v.length === 2 && v[0] === i)
      if (selectedPart.length > 0) {
        partsStyles.push(...selectedPart.map((s) => ({ index: s[1], color: 0xff0000 })))
        selected = true
      }
      const hoveringPart = props.hovering.find((v) => v.length === 2 && v[0] === i)
      if (hoveringPart) {
        partsStyles.push({ index: hoveringPart[1], color: 0x00ff00 })
      }
    }
    color = transformColor(color)
    if (selected) {
      operators.unshift('me')
    }
    if (model.getOperatorRenderPosition && operators.length > 0) {
      const renderPosition = model.getOperatorRenderPosition(content, props.contents)
      children.push(target.renderText(renderPosition.x, renderPosition.y, operators.join(','), 0xff0000, 16, 'monospace'))
    }
    if (!isLineContent(content) && !isPolyLineContent(content)) {
      const bounding = model.getCircle?.(content).bounding ?? model.getGeometries?.(content, props.contents).bounding
      if (bounding) {
        const x = bounding.end.x - bounding.start.x
        const y = bounding.end.y - bounding.start.y
        if (x <= strokeWidth || y <= strokeWidth) {
          const ContentRender = lineModel.render
          if (ContentRender) {
            const strokeWidth = Math.min(x, y)
            children.push(ContentRender({ content: { points: [bounding.start, bounding.end] }, color, target, strokeWidth, contents: props.contents, partsStyles, scale, fallbackEnabled }))
          }
          return
        }
      }
    }
    count++
    const ContentRender = model.render
    if (ContentRender) {
      children.push(ContentRender({ content, color, target, strokeWidth, contents: props.contents, partsStyles, scale, fallbackEnabled }))
    }
    if (selected) {
      const RenderIfSelected = getModel(content.type)?.renderIfSelected
      if (RenderIfSelected) {
        children.push(RenderIfSelected({ content, color, target, strokeWidth, scale }))
      }
    }
  })
  console.info(Date.now() - now, count)
  return target.renderResult(children, props.width, props.height, {
    attributes: {
      style: {
        position: 'absolute',
        boxSizing: 'border-box',
      },
      onClick: props.onClick,
      onMouseDown: props.onMouseDown,
      onContextMenu: props.onContextMenu,
    },
    transform: props.transform,
    backgroundColor: props.backgroundColor,
  })
}

const rendererCenter: Record<string, ReactRenderTarget<unknown>> = {}

export function registerRenderer<T>(renderer: ReactRenderTarget<T>) {
  rendererCenter[renderer.type] = renderer
}

export function getAllRendererTypes() {
  return Object.keys(rendererCenter)
}

export const visibleContents = new WeaksetCache<BaseContent>()

export const contentVisible = (c: BaseContent) => visibleContents.has(c)
