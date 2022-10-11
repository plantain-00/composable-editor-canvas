import React from "react"
import { getPointsBounding, Nullable, NumberEditor, ObjectEditor, Position, ReactRenderTarget } from "../../src"
import { isBlockReferenceContent } from "./block-reference-model"
import { isGroupContent } from "./group-model"
import { BaseContent, getGeometriesFromCache, getModel, getSnapPointsFromCache, Model, SnapPoint } from "./model"

export type BlockContent = BaseContent<'block'> & {
  contents: Nullable<BaseContent>[]
  base: Position
}

export const blockModel: Model<BlockContent> = {
  type: 'block',
  deletable(content, contents) {
    return !blockIsReferenced(getBlockIndex(content, contents), contents)
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

export function getBlockIndex(content: Omit<BlockContent, "type">, contents: readonly Nullable<BaseContent>[]) {
  return contents.findIndex(c => c && isBlockContent(c) && content === c)
}

export function* iterateAllContents(contents: readonly Nullable<BaseContent>[]): Generator<BaseContent, void, unknown> {
  for (const content of contents) {
    if (!content) {
      continue
    }
    yield content
    if (isBlockContent(content) || isGroupContent(content)) {
      yield* iterateAllContents(content.contents)
    }
  }
}

function blockIsReferenced(id: number, contents: readonly Nullable<BaseContent>[]): boolean {
  for (const content of iterateAllContents(contents)) {
    if (isBlockReferenceContent(content) && content.refId === id) {
      return true
    }
  }
  return false
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
