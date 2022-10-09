import { applyPatches, Patch } from "immer"
import React from "react"
import { getColorString, isSelected, Nullable, ReactRenderTarget, RenderingLinesMerger, useValueChanged, WeakmapCache, WeaksetCache } from "../../src"
import { BaseContent, getContentByIndex, getModel } from "../models/model"

export function Renderer(props: {
  type?: string
  contents: readonly Nullable<BaseContent>[]
  previewPatches?: Patch[]
  assistentContents?: readonly BaseContent[]
  selected?: readonly number[][]
  othersSelectedContents?: readonly { selection: number[], operator: string }[]
  hovering?: readonly number[][]
  x: number
  y: number
  scale: number
  width: number
  height: number
  backgroundColor: number
  simplified: boolean
  debug?: boolean
} & React.HTMLAttributes<HTMLOrSVGElement>) {
  const target = rendererCenter[props.type || getAllRendererTypes()[0]]

  const strokeWidthScale = 1 / props.scale
  const renderCache = React.useRef(new WeakmapCache<readonly Nullable<BaseContent>[], unknown[]>())
  useValueChanged(props.type, () => renderCache.current.clear())
  useValueChanged(props.backgroundColor, () => renderCache.current.clear())

  if (!target) {
    return null
  }
  const now = Date.now()

  const previewPatches = props.previewPatches ?? []
  const previewContents = previewPatches.length > 0 ? applyPatches(props.contents, previewPatches) : props.contents
  // type-coverage:ignore-next-line
  const previewContentIndexes = new Set(previewPatches.map((p) => p.path[0] as number))
  visibleContents.add(...Array.from(previewContentIndexes).map((index) => previewContents[index]).filter((s): s is BaseContent => !!s))

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

  if (previewPatches.length === 0 && props.simplified) {
    children = renderCache.current.get(props.contents, () => {
      props.contents.forEach((content) => {
        if (!content) {
          return
        }
        const model = getModel(content.type)
        if (!model) {
          return
        }
        renderContent(content, model.getDefaultColor?.(content) ?? 0x000000, model.getDefaultStrokeWidth?.(content) ?? 1)
      })
      return children
    })
  } else {
    previewContents.forEach((content) => {
      if (!content) {
        return
      }
      if (!visibleContents.has(content)) {
        return
      }
      const model = getModel(content.type)
      if (!model) {
        return
      }
      renderContent(content, model.getDefaultColor?.(content) ?? 0x000000, model.getDefaultStrokeWidth?.(content) ?? 1)
    })
  }

  if (!props.simplified) {
    const selected = props.selected || []
    const othersSelectedContents = props.othersSelectedContents || []
    if (selected.length + othersSelectedContents.length > 0) {
      props.contents.forEach((content, i) => {
        if (!content) {
          return
        }
        const model = getModel(content.type)
        if (!model) {
          return
        }
        const operators = othersSelectedContents.filter((s) => s.selection.includes(i)).map((c) => c.operator)
        if (isSelected([i], selected)) {
          operators.unshift('me')
        }
        if (model.getOperatorRenderPosition && operators.length > 0) {
          const renderPosition = model.getOperatorRenderPosition(content, props.contents)
          merger.flushLast()
          children.push(target.renderText(renderPosition.x, renderPosition.y, operators.join(','), 0xff0000, 16, 'monospace'))
        }
      })
    }

    for (const index of (props.hovering || [])) {
      const content = getContentByIndex(props.contents, index)
      if (content) {
        renderContent(content, 0x00ff00, (getModel(content.type)?.getDefaultStrokeWidth?.(content) ?? 1) + 1)
      }
    }

    for (const index of selected) {
      const content = getContentByIndex(props.contents, index)
      if (content) {
        const strokeWidth = getModel(content.type)?.getDefaultStrokeWidth?.(content) ?? 1
        renderContent(content, 0xff0000, strokeWidth + 1)
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
      renderContent(content, model.getDefaultColor?.(content) ?? 0x000000, getModel(content.type)?.getDefaultStrokeWidth?.(content) ?? 1)
    })
  }

  merger.flushLast()
  if (props.debug) {
    console.info(Date.now() - now, children.length)
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
    backgroundColor: props.backgroundColor,
    debug: props.debug,
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
