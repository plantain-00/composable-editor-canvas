import produce from "immer"
import React from "react"
import { EditBar, getAngleSnapPosition, getSymmetryPoint, Position, rotatePositionByCenter, useEdit, WeakmapCache2 } from "../../src"
import { BlockContent, isBlockContent, renderBlockChildren } from "./block-model"
import { LineContent } from "./line-model"
import { BaseContent, getModel, Model, SnapPoint } from "./model"

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
  useEdit(onEnd, transform, getAngleSnap, scale) {
    const [offset, setOffset] = React.useState<Position & { data?: number }>({ x: 0, y: 0 })
    const [cursorPosition, setCursorPosition] = React.useState<Position>()
    const { onStart, mask } = useEdit<{ type: 'base' } & Position, number>(
      onEnd,
      (start, end) => {
        end = getAngleSnapPosition(start.data, end, getAngleSnap)
        setCursorPosition(end)
        setOffset({ x: end.x - start.x, y: end.y - start.y, data: start.data.data })
      },
      () => setOffset({ x: 0, y: 0 }),
      {
        transform,
      },
    )
    return {
      mask,
      updatePreview(contents) {
        if (offset.data !== undefined) {
          const content = contents[offset.data]
          const assistentContents: LineContent[] = []
          if (cursorPosition) {
            const block = getBlock(content.id, contents)
            if (block) {
              assistentContents.push({ type: 'line', dashArray: [4], points: [{ x: content.x + block.base.x, y: content.y + block.base.y }, cursorPosition] })
            }
          }
          if (content.type === 'block reference') {
            content.x += offset.x
            content.y += offset.y
          }
          return { assistentContents }
        }
        return {}
      },
      editBar({ content, index, contents }) {
        const block = getBlock(content.id, contents)
        if (!block) {
          return null
        }
        const p = { x: content.x + block.base.x, y: content.y + block.base.y }
        return (
          <EditBar
            positions={[{ data: 'base' as const, ...p, cursor: 'move' }]}
            scale={scale}
            onClick={(e, type, cursor) => onStart(e, { ...p, type, cursor, data: index })}
          />
        )
      },
    }
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
      }
    })
  }
  return { lines: [], points: [] }
}

const blockLinesCache = new WeakmapCache2<Omit<BlockContent, 'type'>, Omit<BlockReferenceContent, "type">, { lines: [Position, Position][], points: Position[] }>()
const blockSnapPointsCache = new WeakmapCache2<Omit<BlockContent, 'type'>, Omit<BlockReferenceContent, "type">, SnapPoint[]>()

export function isBlockReferenceContent(content: BaseContent): content is BlockReferenceContent {
  return content.type === 'block reference'
}
