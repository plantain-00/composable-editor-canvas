import produce from "immer"
import { getSymmetryPoint, Position, rotatePositionByCenter, twoPointLineToGeneralFormLine, WeakmapCache2 } from "../../src"
import { BaseContent, getModel, Model, SnapPoint } from "./model"

export type BlockContent = BaseContent<'block'> & {
  id: number
  contents: BaseContent[]
  base: Position
}

export type BlockReferenceContent = BaseContent<'block reference'> & Position & {
  id: number
  angle: number
}

export const blockReferenceModel: Model<BlockReferenceContent> = {
  type: 'block reference',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  rotate(content, center, angle, contents) {
    const block = getBlock(content.id, contents)
    if (block) {
      const p = rotatePositionByCenter({ x: content.x + block.base.x, y: content.y + block.base.y }, center, -angle)
      content.x = p.x - block.base.x
      content.y = p.y - block.base.y
      content.angle += angle
    }
  },
  explode(content, contents) {
    const block = getBlock(content.id, contents)
    if (block) {
      const result: BaseContent[] = []
      block.contents.forEach((c) => {
        const extracted = extractContentInBlockReference(c, content, block, contents)
        if (extracted) {
          result.push(extracted)
        }
      })
      return result
    }
    return []
  },
  mirror(content, p1, p2, contents) {
    const block = getBlock(content.id, contents)
    if (block) {
      const line = twoPointLineToGeneralFormLine(p1, p2)
      const p = getSymmetryPoint({ x: content.x + block.base.x, y: content.y + block.base.y }, line)
      content.x = p.x - block.base.x
      content.y = p.y - block.base.y
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
      content.angle = 2 * angle - content.angle
    }
  },
  render({ content, target, color, strokeWidth, contents }) {
    const block = getBlock(content.id, contents)
    if (block) {
      const children: (ReturnType<typeof target.getGroup>)[] = []
      block.contents.forEach((blockContent) => {
        const model = getModel(blockContent.type)
        if (model?.render) {
          const ContentRender = model.render
          children.push(ContentRender({ content: blockContent, color, target, strokeWidth, contents }))
        }
      })
      return target.getGroup(children, content.x, content.y, block.base, content.angle)
    }
    return target.getEmpty()
  },
  getOperatorRenderPosition(content, contents) {
    const block = getBlock(content.id, contents)
    if (block) {
      return { x: content.x + block.base.x, y: content.y + block.base.y }
    }
    return content
  },
  getSnapPoints(content, contents) {
    const block = getBlock(content.id, contents)
    if (block) {
      return blockSnapPointsCache.get(block, content, () => {
        const result: SnapPoint[] = []
        block.contents.forEach((c) => {
          const model = getModel(c.type)
          const extracted = extractContentInBlockReference(c, content, block, contents)
          if (extracted) {
            const r = model?.getSnapPoints?.(extracted, contents)
            if (r) {
              result.push(...r)
            }
          }
        })
        return result
      })
    }
    return []
  },
  getLines: getBlockReferenceLines,
}

function extractContentInBlockReference(
  target: BaseContent,
  content: Omit<BlockReferenceContent, "type">,
  block: BlockContent,
  contents: readonly BaseContent[],
) {
  const model = getModel(target.type)
  if (!model) {
    return undefined
  }
  return produce(target, (draft) => {
    model.rotate?.(draft, block.base, content.angle, contents)
    model.move?.(draft, content)
  })
}

function getBlock(id: number, contents: readonly BaseContent[]) {
  return (contents as BlockContent[]).find((c) => c.type === 'block' && c.id === id)
}

function getBlockReferenceLines(content: Omit<BlockReferenceContent, "type">, contents: readonly BaseContent[]) {
  const block = getBlock(content.id, contents)
  if (block) {
    return blockLinesCache.get(block, content, () => {
      const result: { lines: [Position, Position][], points: Position[] } = { lines: [], points: [] }
      block.contents.forEach((c) => {
        const extracted = extractContentInBlockReference(c, content, block, contents)
        if (extracted) {
          const r = getModel(c.type)?.getLines?.(extracted)
          if (r) {
            result.lines.push(...r.lines)
            result.points.push(...r.points)
          }
        }
      })
      return result
    })
  }
  return { lines: [], points: [] }
}

const blockLinesCache = new WeakmapCache2<Omit<BlockContent, 'type'>, Omit<BlockReferenceContent, "type">, { lines: [Position, Position][], points: Position[] }>()
const blockSnapPointsCache = new WeakmapCache2<Omit<BlockContent, 'type'>, Omit<BlockReferenceContent, "type">, SnapPoint[]>()
