import React from "react"
import { getPointsBounding, Nullable, NumberEditor, ObjectEditor, Position, ReactRenderTarget } from "../../src"
import { isBlockReferenceContent } from "./block-reference-model"
import { BaseContent, getGeometriesFromCache, getModel, getSnapPointsFromCache, Model, SnapPoint } from "./model"

export type BlockContent = BaseContent<'block'> & {
  id: number
  contents: Nullable<BaseContent>[]
  base: Position
}

export const blockModel: Model<BlockContent> = {
  type: 'block',
  deletable(content, contents) {
    return !contents.some((c) => c && isBlockReferenceContent(c) && c.refId === content.id)
  },
  explode(content) {
    return content.contents.filter((c): c is BaseContent => !!c)
  },
  render({ content, target, color, strokeWidth, contents }) {
    const children = renderBlockChildren(content, target, strokeWidth, contents, color)
    return target.renderGroup(children)
  },
  getOperatorRenderPosition(content) {
    return content.base
  },
  getSnapPoints: getBlockSnapPoints,
  getGeometries: getBlockGeometries,
  propertyPanel(content, update) {
    return {
      base: <ObjectEditor
        inline
        properties={{
          x: <NumberEditor value={content.base.x} setValue={(v) => update(c => { if (isBlockContent(c)) { c.base.x = v } })} />,
          y: <NumberEditor value={content.base.y} setValue={(v) => update(c => { if (isBlockContent(c)) { c.base.y = v } })} />,
        }}
      />,
    }
  },
}

export function getBlockSnapPoints(content: Omit<BlockContent, 'type' | 'id' | 'base'>, contents: readonly BaseContent[]) {
  return getSnapPointsFromCache(content, () => {
    const result: SnapPoint[] = []
    content.contents.forEach((c) => {
      if (!c) {
        return
      }
      const r = getModel(c.type)?.getSnapPoints?.(c, contents)
      if (r) {
        result.push(...r)
      }
    })
    return result
  })
}

export function renderBlockChildren<V>(block: Omit<BlockContent, 'type' | 'id' | 'base'>, target: ReactRenderTarget<V>, strokeWidth: number, contents: readonly Nullable<BaseContent>[], color: number) {
  const children: (ReturnType<typeof target.renderGroup>)[] = []
  block.contents.forEach((blockContent) => {
    if (!blockContent) {
      return
    }
    const model = getModel(blockContent.type)
    if (model?.render) {
      const ContentRender = model.render
      color = model.getDefaultColor?.(blockContent) ?? color
      children.push(ContentRender({ content: blockContent, color, target, strokeWidth, contents }))
    }
  })
  return children
}

export function getBlockGeometries(content: Omit<BlockContent, "type" | 'id' | 'base'>) {
  return getGeometriesFromCache(content, () => {
    const lines: [Position, Position][] = []
    const points: Position[] = []
    const renderingLines: Position[][] = []
    content.contents.forEach((c) => {
      if (!c) {
        return
      }
      const r = getModel(c.type)?.getGeometries?.(c)
      if (r) {
        lines.push(...r.lines)
        points.push(...r.points)
        if (r.renderingLines) {
          renderingLines.push(...r.renderingLines)
        }
      }
    })
    return {
      lines,
      points,
      bounding: getPointsBounding(points),
      renderingLines,
    }
  })
}

export function isBlockContent(content: BaseContent): content is BlockContent {
  return content.type === 'block'
}
