import { applyPatches, Patch } from "immer"
import React from "react"
import { Debug, getColorString, isSelected, Nullable, Pattern, ReactRenderTarget, Merger, useValueChanged, WeakmapCache, Position, isSamePath, WeakmapMapCache, ContentPath } from "../../src"
import { BaseContent, defaultStrokeColor, defaultOpacity, FillFields, getContentByIndex, getContentModel, getDefaultStrokeWidth, getSortedContents, getViewportMatrix, hasFill, isStrokeContent, isViewportContent, StrokeFields } from "./model"

export function Renderer(props: {
  type?: string
  contents: readonly Nullable<BaseContent>[]
  previewPatches?: Patch[]
  assistentContents?: readonly BaseContent[]
  selected?: readonly ContentPath[]
  othersSelectedContents?: readonly { selection: number[], operator: string }[]
  hovering?: readonly ContentPath[]
  active?: number
  activeViewportIndex?: number
  x: number
  y: number
  scale: number
  rotate?: number
  width: number
  height: number
  backgroundColor: number
  debug?: boolean
  printMode?: boolean
  performanceMode?: boolean
  operatorVisible?: boolean
  time: number
} & React.HTMLAttributes<HTMLOrSVGElement>) {
  const debug = new Debug(props.debug)
  const target = rendererCenter[props.type || getAllRendererTypes()[0]]

  const strokeWidthScale = props.printMode ? 0 : 1 / props.scale
  const renderCache = React.useRef(new WeakmapMapCache<readonly Nullable<BaseContent>[], number, unknown[]>())
  useValueChanged(props.type, () => renderCache.current.clear())
  useValueChanged(props.backgroundColor, () => renderCache.current.clear())

  const fillPatternCache = React.useRef(new WeakmapCache<object, Pattern<unknown>>())
  useValueChanged(target, () => fillPatternCache.current.clear())

  if (!target) {
    return null
  }

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
  const getStrokeColor = (content: StrokeFields & FillFields): number | undefined => {
    if (content.strokeColor !== undefined) {
      return content.trueStrokeColor ? content.strokeColor : transformColor(content.strokeColor)
    }
    return hasFill(content) ? undefined : defaultStrokeColor
  }
  const getFillColor = (content: FillFields) => {
    return content.fillColor !== undefined ? transformColor(content.fillColor) : undefined
  }
  const getFillPattern = (content: FillFields): Pattern<unknown> | undefined => {
    if (content.fillPattern === undefined) {
      return
    }
    const fillPattern = content.fillPattern
    return fillPatternCache.current.get(fillPattern, () => ({
      width: fillPattern.width,
      height: fillPattern.height,
      pattern: () => target.renderPath(fillPattern.lines, {
        strokeColor: (fillPattern.strokeColor !== undefined ? transformColor(fillPattern.strokeColor) : undefined) ?? defaultStrokeColor,
        strokeOpacity: fillPattern.strokeOpacity,
        lineCap: 'square'
      })
    }))
  }

  debug.mark('before contents')
  let children: unknown[] = []
  const merger = new Merger<{
    line: Position[]
    strokeColor: number
    dashArray?: number[]
    strokeWidth: number
    strokeOpacity: number
  }, Position[]>(
    (last) => children.push(target.renderPath(last.target, {
      strokeColor: last.type.strokeColor,
      dashArray: last.type.dashArray,
      strokeWidth: last.type.strokeWidth,
      strokeOpacity: last.type.strokeOpacity,
    })),
    (a, b) => a.strokeColor === b.strokeColor &&
      a.strokeWidth === b.strokeWidth &&
      a.strokeOpacity === b.strokeOpacity &&
      isSamePath(a.dashArray, b.dashArray),
    a => a.line,
  )
  const previewPatches = props.previewPatches ?? []
  const previewContents = previewPatches.length > 0 && !props.performanceMode ? applyPatches(props.contents, previewPatches) : props.contents
  const sortedContents = getSortedContents(previewContents).contents
  const commonProps = {
    transformColor,
    target,
    getStrokeColor,
    getFillColor,
    getFillPattern,
    time: props.time,
    contents: previewContents,
  }
  children = renderCache.current.get(sortedContents, props.time, () => {
    sortedContents.forEach((content) => {
      if (!content || content.visible === false) {
        return
      }
      const model = getContentModel(content)
      if (!model) {
        return
      }
      if (target.type !== 'svg' && model.getGeometries) {
        const { renderingLines, regions } = model.getGeometries(content, props.contents)
        if (renderingLines && !regions) {
          const strokeWidth = (isStrokeContent(content) ? content.strokeWidth : undefined) ?? getDefaultStrokeWidth(content)
          let strokeColor = (isStrokeContent(content) ? content.strokeColor : undefined) ?? defaultStrokeColor
          strokeColor = transformColor(strokeColor)
          const strokeOpacity = (isStrokeContent(content) ? content.strokeOpacity : undefined) ?? defaultOpacity
          for (const line of renderingLines) {
            merger.push({
              line,
              strokeColor,
              strokeWidth,
              strokeOpacity,
            })
          }
        } else {
          const ContentRender = model.render
          if (ContentRender) {
            merger.flushLast()
            children.push(ContentRender(content, { transformStrokeWidth: w => w, ...commonProps }))
          }
        }
      } else {
        const ContentRender = model.render
        if (ContentRender) {
          merger.flushLast()
          children.push(ContentRender(content, { transformStrokeWidth: w => w, ...commonProps }))
        }
      }
    })
    return children
  })
  merger.flushLast()

  debug.mark('before assistent contents')
  const assistentContentsChildren: unknown[] = []
  const assistentContentsChildren2: unknown[] = []

  if (props.performanceMode) {
    // type-coverage:ignore-next-line
    const previewContentIndexes = new Set(previewPatches.map((p) => p.path[0] as number))
    const newContents: BaseContent[] = []
    for (const index of previewContentIndexes) {
      const patches = previewPatches.filter(p => p.path[0] === index)
      if (patches.length > 0) {
        const content = props.contents[index]
        if (content) {
          newContents.push(applyPatches(content, patches.map(p => ({ ...p, path: p.path.slice(1) }))))
        } else {
          patches.forEach(p => {
            // type-coverage:ignore-next-line
            if (p.op === 'add' && p.value) {
              // type-coverage:ignore-next-line
              newContents.push(p.value)
            }
          })
        }
      }
    }
    let newAssistentContentsChildren: unknown[] = []
    newContents.forEach(content => {
      const ContentRender = getContentModel(content)?.render
      if (ContentRender) {
        newAssistentContentsChildren.push(ContentRender(content, { transformStrokeWidth: w => w, ...commonProps, isAssistence: true }))
      }
    })
    if (newAssistentContentsChildren.length > 0 && props.activeViewportIndex !== undefined) {
      const p = previewContents[props.activeViewportIndex]
      if (p && isViewportContent(p)) {
        newAssistentContentsChildren = [target.renderGroup(newAssistentContentsChildren, { matrix: getViewportMatrix(p) })]
      }
    }
    assistentContentsChildren.push(...newAssistentContentsChildren)
  }

  if (props.operatorVisible !== false) {
    const selected = props.selected || []
    const othersSelectedContents = props.othersSelectedContents || []
    if (selected.length + othersSelectedContents.length > 0) {
      props.contents.forEach((content, i) => {
        if (!content) {
          return
        }
        const model = getContentModel(content)
        if (!model) {
          return
        }
        const operators = othersSelectedContents.filter((s) => s.selection.includes(i)).map((c) => c.operator)
        if (isSelected([i], selected)) {
          operators.unshift('me')
        }
        if (model.getOperatorRenderPosition && operators.length > 0) {
          const renderPosition = model.getOperatorRenderPosition(content, props.contents)
          assistentContentsChildren2.push(target.renderText(renderPosition.x, renderPosition.y, operators.join(','), 0xff0000, 16, 'monospace'))
        }
      })
    }
  }

  for (const index of (props.hovering || [])) {
    const content = getContentByIndex(previewContents, index)
    if (content) {
      const ContentRender = getContentModel(content)?.render
      if (ContentRender) {
        assistentContentsChildren2.push(ContentRender(content, { transformStrokeWidth: w => w + 4, ...commonProps, isHoveringOrSelected: true }))
        assistentContentsChildren2.push(ContentRender(content, { transformStrokeWidth: w => w + 2, ...commonProps, isHoveringOrSelected: true }))
        assistentContentsChildren2.push(ContentRender(content, { transformStrokeWidth: w => w, ...commonProps, isHoveringOrSelected: true }))
      }
    }
  }

  for (const index of (props.selected || [])) {
    const content = getContentByIndex(previewContents, index)
    if (content) {
      const strokeWidth = (isStrokeContent(content) ? content.strokeWidth : undefined) ?? getDefaultStrokeWidth(content)
      const model = getContentModel(content)
      const ContentRender = model?.render
      if (ContentRender) {
        assistentContentsChildren2.push(ContentRender(content, { transformStrokeWidth: w => w + 4, ...commonProps, isHoveringOrSelected: true }))
        assistentContentsChildren2.push(ContentRender(content, { transformStrokeWidth: w => w + 2, ...commonProps, isHoveringOrSelected: true }))
        assistentContentsChildren2.push(ContentRender(content, { transformStrokeWidth: w => w, ...commonProps, isHoveringOrSelected: true }))
      }
      const RenderIfSelected = model?.renderIfSelected
      if (RenderIfSelected) {
        assistentContentsChildren2.push(RenderIfSelected(content, { color: transformColor(0xff0000), target, strokeWidth, contents: props.contents }))
      }
    }
  }

  if (props.activeViewportIndex !== undefined) {
    const content = previewContents[props.activeViewportIndex]
    if (content) {
      const ContentRender = getContentModel(content)?.render
      if (ContentRender) {
        assistentContentsChildren.push(ContentRender(content, { transformStrokeWidth: w => w + 4, ...commonProps, isHoveringOrSelected: true }))
        assistentContentsChildren.push(ContentRender(content, { transformStrokeWidth: w => w + 2, ...commonProps, isHoveringOrSelected: true }))
      }
    }
  } else if (props.active !== undefined) {
    const content = previewContents[props.active]
    if (content) {
      const ContentRender = getContentModel(content)?.render
      if (ContentRender) {
        assistentContentsChildren.push(ContentRender(content, { transformStrokeWidth: w => w + 1, ...commonProps, isHoveringOrSelected: true }))
      }
    }
  }

  props.assistentContents?.forEach((content) => {
    const ContentRender = getContentModel(content)?.render
    if (ContentRender) {
      assistentContentsChildren2.push(ContentRender(content, { transformStrokeWidth: w => w, ...commonProps, isAssistence: true }))
    }
  })
  if (assistentContentsChildren2.length > 0) {
    const activeContent = props.activeViewportIndex !== undefined ? previewContents[props.activeViewportIndex] : undefined
    if (activeContent && isViewportContent(activeContent)) {
      assistentContentsChildren.push(target.renderGroup(assistentContentsChildren2, {
        matrix: getViewportMatrix(activeContent),
      }))
    } else {
      assistentContentsChildren.push(...assistentContentsChildren2)
    }
  }

  const result = assistentContentsChildren.length === 0 ? children : [...children, ...assistentContentsChildren]
  if (props.debug) {
    console.info(debug.print())
  }

  return target.renderResult(result, props.width, props.height, {
    attributes: {
      style: {
        position: 'absolute',
        boxSizing: 'border-box',
        ...props.style,
      },
      onClick: props.onClick,
      onMouseDown: props.onMouseDown,
      onMouseUp: props.onMouseUp,
      onContextMenu: props.onContextMenu,
      onDoubleClick: props.onDoubleClick,
    },
    transform: {
      x: props.x,
      y: props.y,
      scale: props.scale,
      rotate: props.rotate,
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
