import { Position, ReactRenderTarget } from "../../src"
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
  render({ content, target, color, strokeWidth, contents }) {
    const children = renderBlockChildren(content, target, strokeWidth, contents, color)
    return target.getGroup(children, 0, 0, { x: 0, y: 0 })
  },
  getOperatorRenderPosition(content) {
    return content.base
  },
  getSnapPoints(content, contents) {
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
  },
  getLines: getBlockLines,
}

export function renderBlockChildren<V>(block: Omit<BlockContent, 'type'>, target: ReactRenderTarget<V>, strokeWidth: number, contents: readonly BaseContent[], color?: number) {
  const children: (ReturnType<typeof target.getGroup>)[] = []
  block.contents.forEach((blockContent) => {
    const model = getModel(blockContent.type)
    if (model?.render) {
      const ContentRender = model.render
      children.push(ContentRender({ content: blockContent, color, target, strokeWidth, contents }))
    }
  })
  return children
}

function getBlockLines(content: Omit<BlockContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const result: { lines: [Position, Position][], points: Position[] } = { lines: [], points: [] }
    content.contents.forEach((c) => {
      const r = getModel(c.type)?.getLines?.(c)
      if (r) {
        result.lines.push(...r.lines)
        result.points.push(...r.points)
      }
    })
    return result
  })
}

export function isBlockContent(content: BaseContent): content is BlockContent {
  return content.type === 'block'
}
