import produce from "immer"
import { getPointsBounding, getSymmetryPoint, Position, rotatePositionByCenter, TwoPointsFormRegion, WeakmapCache2 } from "../../src"
import { BlockContent, isBlockContent, renderBlockChildren } from "./block-model"
import { LineContent } from "./line-model"
import { BaseContent, getEditPointsFromCache, getModel, Model, SnapPoint } from "./model"

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
  mirror(content, line, angle, contents) {
    const block = getBlock(content.id, contents)
    if (block) {
      const p = getSymmetryPoint({ x: content.x + block.base.x, y: content.y + block.base.y }, line)
      content.x = p.x - block.base.x
      content.y = p.y - block.base.y
      content.angle = 2 * angle - content.angle
    }
  },
  render({ content, target, color, strokeWidth, contents }) {
    const block = getBlock(content.id, contents)
    if (block) {
      const children = renderBlockChildren(block, target, strokeWidth, contents, color)
      return target.renderGroup(children, { translate: content, base: block.base, angle: content.angle })
    }
    return target.renderEmpty()
  },
  getOperatorRenderPosition(content, contents) {
    const block = getBlock(content.id, contents)
    if (block) {
      return { x: content.x + block.base.x, y: content.y + block.base.y }
    }
    return content
  },
  getEditPoints(content, contents) {
    const block = getBlock(content.id, contents)
    if (!block) {
      return
    }
    return getEditPointsFromCache(content, () => {
      const p = { x: content.x + block.base.x, y: content.y + block.base.y }
      return {
        editPoints: [
          {
            ...p,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isBlockReferenceContent(c)) {
                return
              }
              c.x += cursor.x - start.x
              c.y += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [p, cursor] } as LineContent] }
            },
          },
        ],
        angleSnapStartPoint: p,
      }
    })
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
  return contents.find((c): c is BlockContent => isBlockContent(c) && c.id === id)
}

function getBlockReferenceLines(content: Omit<BlockReferenceContent, "type">, contents: readonly BaseContent[]) {
  const block = getBlock(content.id, contents)
  if (block) {
    return blockLinesCache.get(block, content, () => {
      const lines: [Position, Position][] = []
      const points: Position[] = []
      block.contents.forEach((c) => {
        const extracted = extractContentInBlockReference(c, content, block, contents)
        if (extracted) {
          const r = getModel(c.type)?.getLines?.(extracted)
          if (r) {
            lines.push(...r.lines)
            points.push(...r.points)
          }
        }
      })
      return {
        lines,
        points,
        bounding: getPointsBounding(points),
      }
    })
  }
  return { lines: [], points: [] }
}

const blockLinesCache = new WeakmapCache2<Omit<BlockContent, 'type'>, Omit<BlockReferenceContent, "type">, { lines: [Position, Position][], points: Position[], bounding?: TwoPointsFormRegion }>()
const blockSnapPointsCache = new WeakmapCache2<Omit<BlockContent, 'type'>, Omit<BlockReferenceContent, "type">, SnapPoint[]>()

export function isBlockReferenceContent(content: BaseContent): content is BlockReferenceContent {
  return content.type === 'block reference'
}
