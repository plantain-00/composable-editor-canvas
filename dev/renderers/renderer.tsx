import { applyPatches, Patch } from "immer"
import React from "react"
import { getColorString, isSelected, ReactRenderTarget, RenderingLinesMerger, useValueChanged, WeakmapCache, WeaksetCache } from "../../src"
import { BaseContent, getContentByIndex, getModel } from "../models/model"

export function Renderer(props: {
  type?: string
  contents: readonly BaseContent[]
  previewPatches?: Patch[]
  assistentContents?: readonly BaseContent[]
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
  const target = rendererCenter[props.type || getAllRendererTypes()[0]]

  const strokeWidthScale = props.simplified ? 1 : 1 / props.scale
  useValueChanged(props.type, () => renderCache.clear())
  useValueChanged(props.backgroundColor, () => renderCache.clear())

  if (!target) {
    return null
  }
  const now = Date.now()

  const previewPatches = props.previewPatches ?? []
  const previewContents = previewPatches.length > 0 ? applyPatches(props.contents, previewPatches) : props.contents
  // type-coverage:ignore-next-line
  const previewContentIndexes = new Set(previewPatches.map((p) => p.path[0] as number))
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
    if ((props.simplified || target.type === 'webgl') && model.getGeometries) {
      const { renderingLines, regions } = model.getGeometries(content, props.contents)
      if (renderingLines && !regions) {
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
          children.push(ContentRender({ content, color, target, strokeWidth, contents: props.contents }))
        }
      }
    } else {
      const ContentRender = model.render
      if (ContentRender) {
        merger.flushLast()
        children.push(ContentRender({ content, color, target, strokeWidth, contents: props.contents }))
      }
    }
  }

  const strokeWidth = 1

  if (previewPatches.length === 0 && props.simplified) {
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
          children.push(RenderIfSelected({ content, color: transformColor(0xff0000), target, strokeWidth }))
        }
      }
    }

    props.assistentContents?.forEach((content) => {
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
    debug: true,
    strokeWidthScale,
  })
}

export const MemoizedRenderer = React.memo(Renderer)

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
