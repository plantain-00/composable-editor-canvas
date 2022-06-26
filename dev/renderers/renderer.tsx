import { applyPatches, Patch } from "immer"
import React from "react"
import { getColorString, isSelected, ReactRenderTarget, RenderingLinesMerger, useValueChanged, WeakmapCache, WeaksetCache } from "../../src"
import { isLineContent, lineModel } from "../models/line-model"
import { BaseContent, getContentByIndex, getModel } from "../models/model"
import { isPolyLineContent } from "../models/polyline-model"

export function Renderer(props: {
  type?: string
  contents: readonly BaseContent[]
  previewPatches: Patch[]
  assistentContents: readonly BaseContent[]
  selected: readonly number[][]
  othersSelectedContents: readonly { selection: number[], operator: string }[]
  hovering: readonly number[][]
  x: number
  y: number
  scale: number
  width: number
  height: number
  backgroundColor: number
  simplified: boolean
} & React.DOMAttributes<HTMLOrSVGElement>) {
  const scale = props.scale
  useValueChanged(props.scale, (lastScale) => {
    const r = lastScale < scale ? scale / lastScale : lastScale / scale
    if (r < 2) {
      return true
    }
    renderCache.clear()
    return
  })
  useValueChanged(props.type, () => renderCache.clear())
  useValueChanged(props.backgroundColor, () => renderCache.clear())

  const target = rendererCenter[props.type || getAllRendererTypes()[0]]
  if (!target) {
    return null
  }
  const now = Date.now()

  const previewContents = props.previewPatches.length > 0 ? applyPatches(props.contents, props.previewPatches) : props.contents
  const previewContentIndexes = new Set(props.previewPatches.map((p) => p.path[0] as number))
  visibleContents.add(...Array.from(previewContentIndexes).map((index) => previewContents[index]))

  const backgroundColor = getColorString(props.backgroundColor)
  const r = +`0x${backgroundColor.substring(1, 3)}`
  const b = +`0x${backgroundColor.substring(3, 5)}`
  const g = +`0x${backgroundColor.substring(5)}`
  const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2
  const transformColor = (color: number) => {
    if (lightness < 128) {
      return color === 0 ? 0xffffff : color
    }
    return color === 0xffffff ? 0 : color
  }
  let children: unknown[] = []
  const merger = new RenderingLinesMerger(
    (last) => children.push(target.renderPath(last.line, {
      strokeColor: last.strokeColor,
      dashArray: last.dashArray,
      strokeWidth: last.strokeWidth,
    }))
  )

  const renderContent = (content: BaseContent, color: number, strokeWidth: number) => {
    const model = getModel(content.type)
    if (!model) {
      return
    }
    color = transformColor(color)
    if (!isLineContent(content) && !isPolyLineContent(content)) {
      const bounding = model.getCircle?.(content).bounding ?? model.getGeometries?.(content, props.contents).bounding
      if (bounding) {
        const x = bounding.end.x - bounding.start.x
        const y = bounding.end.y - bounding.start.y
        if (x <= strokeWidth || y <= strokeWidth) {
          const ContentRender = lineModel.render
          if (ContentRender) {
            if (props.simplified) {
              merger.push({
                line: [bounding.start, bounding.end],
                strokeColor: color,
                strokeWidth,
              })
            } else {
              merger.flushLast()
              children.push(ContentRender({ content: { points: [bounding.start, bounding.end] }, color, target, strokeWidth, contents: props.contents, scale }))
            }
          }
          return
        }
      }
    }
    if (props.simplified && model.getGeometries) {
      const { renderingLines } = model.getGeometries(content, props.contents)
      if (renderingLines) {
        for (const line of renderingLines) {
          merger.push({
            line,
            strokeColor: color,
            strokeWidth,
          })
        }
      } else {
        const ContentRender = model.render
        if (ContentRender) {
          merger.flushLast()
          children.push(ContentRender({ content, color, target, strokeWidth, contents: props.contents, scale }))
        }
      }
    } else {
      const ContentRender = model.render
      if (ContentRender) {
        merger.flushLast()
        children.push(ContentRender({ content, color, target, strokeWidth, contents: props.contents, scale }))
      }
    }
  }

  const strokeWidth = 1 / scale

  if (props.previewPatches.length === 0 && props.simplified) {
    children = renderCache.get(props.contents, () => {
      props.contents.forEach((content) => {
        const model = getModel(content.type)
        if (!model) {
          return
        }
        renderContent(content, model.getDefaultColor?.(content) ?? 0x000000, strokeWidth)
      })
      return children
    })
  } else {
    previewContents.forEach((content) => {
      if (!visibleContents.has(content)) {
        return
      }
      const model = getModel(content.type)
      if (!model) {
        return
      }
      renderContent(content, model.getDefaultColor?.(content) ?? 0x000000, strokeWidth)
    })
  }

  if (!props.simplified) {
    if (props.othersSelectedContents.length > 0) {
      props.contents.forEach((content, i) => {
        const model = getModel(content.type)
        if (!model) {
          return
        }
        const operators = props.othersSelectedContents.filter((s) => s.selection.includes(i)).map((c) => c.operator)
        if (isSelected([i], props.selected)) {
          operators.unshift('me')
        }
        if (model.getOperatorRenderPosition && operators.length > 0) {
          const renderPosition = model.getOperatorRenderPosition(content, props.contents)
          merger.flushLast()
          children.push(target.renderText(renderPosition.x, renderPosition.y, operators.join(','), 0xff0000, 16, 'monospace'))
        }
      })
    }

    for (const index of props.hovering) {
      const content = getContentByIndex(props.contents, index)
      if (content) {
        renderContent(content, 0x00ff00, strokeWidth * 2)
      }
    }

    for (const index of props.selected) {
      const content = getContentByIndex(props.contents, index)
      if (content) {
        renderContent(content, 0xff0000, strokeWidth * 2)
        const RenderIfSelected = getModel(content.type)?.renderIfSelected
        if (RenderIfSelected) {
          merger.flushLast()
          children.push(RenderIfSelected({ content, color: transformColor(0xff0000), target, strokeWidth, scale }))
        }
      }
    }

    props.assistentContents.forEach((content) => {
      const model = getModel(content.type)
      if (!model) {
        return
      }
      renderContent(content, model.getDefaultColor?.(content) ?? 0x000000, strokeWidth)
    })
  }

  merger.flushLast()
  console.info(Date.now() - now, children.length)

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
    transform: {
      x: props.x,
      y: props.y,
      scale: props.scale,
    },
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

const renderCache = new WeakmapCache<readonly BaseContent[], unknown[]>()
