import { getPointsBounding, Position, ReactRenderTarget } from "../../src"
import { isBlockReferenceContent } from "./block-reference-model"
import { BaseContent, getGeometriesFromCache, getModel, getSnapPointsFromCache, Model, SnapPoint } from "./model"

export type BlockContent = BaseContent<'block'> & {
  id: number
  contents: BaseContent[]
  base: Position
}

export const blockModel: Model<BlockContent> = {
  type: 'block',
  deletable(content, contents) {
    return !contents.some((c) => isBlockReferenceContent(c) && c.id === content.id)
  },
  explode(content) {
    return content.contents
  },
  render({ content, target, color, strokeWidth, contents, scale }) {
    const children = renderBlockChildren(content, target, strokeWidth, contents, color, scale)
    return target.renderGroup(children)
  },
  getOperatorRenderPosition(content) {
    return content.base
  },
  getSnapPoints: getBlockSnapPoints,
  getGeometries: getBlockGeometries,
}

export function getBlockSnapPoints(content: Omit<BlockContent, 'type' | 'id' | 'base'>, contents: readonly BaseContent[]) {
  return getSnapPointsFromCache(content, () => {
    const result: SnapPoint[] = []
    content.contents.forEach((c) => {
      const r = getModel(c.type)?.getSnapPoints?.(c, contents)
      if (r) {
        result.push(...r)
      }
    })
    return result
  })
}

export function renderBlockChildren<V>(block: Omit<BlockContent, 'type' | 'id' | 'base'>, target: ReactRenderTarget<V>, strokeWidth: number, contents: readonly BaseContent[], color: number, scale: number) {
  const children: (ReturnType<typeof target.renderGroup>)[] = []
  block.contents.forEach((blockContent) => {
    const model = getModel(blockContent.type)
    if (model?.render) {
      const ContentRender = model.render
      children.push(ContentRender({ content: blockContent, color, target, strokeWidth, contents, scale }))
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
