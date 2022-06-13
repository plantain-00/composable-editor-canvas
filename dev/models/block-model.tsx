import { getPointsBounding, Position, ReactRenderTarget } from "../../src"
import { isBlockReferenceContent } from "./block-reference-model"
import { BaseContent, getLinesAndPointsFromCache, getModel, getSnapPointsFromCache, Model, SnapPoint } from "./model"

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
  render({ content, target, color, strokeWidth, contents }) {
    const children = renderBlockChildren(content, target, strokeWidth, contents, color)
    return target.renderGroup(children)
  },
  getOperatorRenderPosition(content) {
    return content.base
  },
  getSnapPoints: getBlockSnapPoints,
  getLines: getBlockLines,
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

export function renderBlockChildren<V>(block: Omit<BlockContent, 'type' | 'id' | 'base'>, target: ReactRenderTarget<V>, strokeWidth: number, contents: readonly BaseContent[], color: number) {
  const children: (ReturnType<typeof target.renderGroup>)[] = []
  block.contents.forEach((blockContent) => {
    const model = getModel(blockContent.type)
    if (model?.render) {
      const ContentRender = model.render
      children.push(ContentRender({ content: blockContent, color, target, strokeWidth, contents, partsStyles: [] }))
    }
  })
  return children
}

export function getBlockLines(content: Omit<BlockContent, "type" | 'id' | 'base'>) {
  return getLinesAndPointsFromCache(content, () => {
    const lines: [Position, Position][] = []
    const points: Position[] = []
    content.contents.forEach((c) => {
      const r = getModel(c.type)?.getLines?.(c)
      if (r) {
        lines.push(...r.lines)
        points.push(...r.points)
      }
    })
    return {
      lines,
      points,
      bounding: getPointsBounding(points),
    }
  })
}

export function isBlockContent(content: BaseContent): content is BlockContent {
  return content.type === 'block'
}
