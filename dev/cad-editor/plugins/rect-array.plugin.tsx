import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type RectArrayContent = model.BaseContent<'rect array'> & model.ContainerFields & {
  rowCount: number
  rowSpacing: number
  columnCount: number
  columnSpacing: number
}

export function getModel(ctx: PluginContext): model.Model<RectArrayContent> {
  const RectArrayContent = ctx.and(ctx.BaseContent('rect array'), ctx.ContainerFields, {
    rowCount: ctx.number,
    rowSpacing: ctx.number,
    columnCount: ctx.number,
    columnSpacing: ctx.number,
  })
  const getRefIds = (content: Omit<RectArrayContent, "type">) => content.contents
  const getAllContentsFromCache = (content: Omit<RectArrayContent, 'type'>) => {
    return ctx.allContentsCache.get(content, () => {
      const result: core.Nullable<model.BaseContent>[] = []
      for (let i = 0; i < content.columnCount; i++) {
        const x = i * content.columnSpacing
        for (let j = 0; j < content.rowCount; j++) {
          const y = j * content.rowSpacing
          if (x === 0 && y === 0) {
            result.push(...content.contents)
          } else {
            result.push(...content.contents.map(c => {
              if (!c) return
              const move = ctx.getContentModel(c)?.move
              if (!move) return
              return ctx.produce(c, draft => {
                move(draft, { x, y })
              })
            }))
          }
        }
      }
      return result
    })
  }
  const getGeometries = (content: Omit<RectArrayContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) => ctx.getContentsGeometries(content, contents, getRefIds, getAllContentsFromCache)
  const React = ctx.React
  return {
    type: 'rect array',
    ...ctx.containerModel,
    move: ctx.getContainerMove,
    rotate(content, center, angle, contents) {
      const x = content.columnSpacing * (content.columnCount - 1) * 0.5
      const y = content.rowSpacing * (content.rowCount - 1) * 0.5
      content.contents.forEach((c) => {
        if (!c) return
        const m = ctx.getContentModel(c)
        if (!m) return
        m.move?.(c, { x, y })
        m.rotate?.(c, center, angle, contents)
        m.move?.(c, { x: -x, y: -y })
      })
    },
    scale(content, center, sx, sy, contents) {
      ctx.getContainerScale(content, center, sx, sy, contents)
      content.rowSpacing *= sx
      content.columnSpacing *= sy
    },
    explode(content) {
      return ctx.getContentsExplode(getAllContentsFromCache(content))
    },
    break(content, points, contents) {
      return ctx.getContentsBreak(getAllContentsFromCache(content), points, contents)
    },
    render(content, renderCtx) {
      return renderCtx.target.renderGroup(ctx.renderContainerChildren({ contents: getAllContentsFromCache(content), variableValues: content.variableValues }, renderCtx))
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const bounding = ctx.getContentsBounding(content.contents, contents)
        if (!bounding) {
          return { editPoints: [] }
        }
        const base = {
          x: ctx.getTwoNumberCenter(bounding.start.x, bounding.end.x),
          y: ctx.getTwoNumberCenter(bounding.start.y, bounding.end.y),
        }
        return {
          editPoints: [
            {
              ...base,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return
                }
                ctx.getContainerMove(c, {
                  x: cursor.x - start.x,
                  y: cursor.y - start.y,
                })
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            {
              x: base.x + content.columnSpacing,
              y: base.y,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return
                }
                c.columnSpacing = cursor.x - base.x
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            {
              x: base.x,
              y: base.y + content.rowSpacing,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return
                }
                c.rowSpacing = cursor.y - base.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            {
              x: base.x + content.columnSpacing * (content.columnCount - 1),
              y: base.y,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return
                }
                let columnCount = Math.round((cursor.x - base.x) / content.columnSpacing)
                if (columnCount < 0) {
                  columnCount = -columnCount
                  c.columnSpacing = -content.columnSpacing
                }
                c.columnCount = columnCount + 1
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            {
              x: base.x,
              y: base.y + content.rowSpacing * (content.rowCount - 1),
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return
                }
                let rowCount = Math.round((cursor.y - base.y) / content.rowSpacing)
                if (rowCount < 0) {
                  rowCount = -rowCount
                  c.rowSpacing = -content.rowSpacing
                }
                c.rowCount = rowCount + 1
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            {
              x: base.x + content.columnSpacing * (content.columnCount - 1),
              y: base.y + content.rowSpacing * (content.rowCount - 1),
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return
                }
                let rowCount = Math.round((cursor.y - base.y) / content.rowSpacing)
                if (rowCount < 0) {
                  rowCount = -rowCount
                  c.rowSpacing = -content.rowSpacing
                }
                let columnCount = Math.round((cursor.x - base.x) / content.columnSpacing)
                if (columnCount < 0) {
                  columnCount = -columnCount
                  c.columnSpacing = -content.columnSpacing
                }
                c.rowCount = rowCount + 1
                c.columnCount = columnCount + 1
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
          ]
        }
      })
    },
    getSnapPoints(content, contents) {
      return ctx.getContentsSnapPoints(content, contents, getAllContentsFromCache)
    },
    getGeometries,
    propertyPanel(content, update) {
      return {
        rowCount: <ctx.NumberEditor value={content.rowCount} setValue={(v) => update(c => { if (isRectArrayContent(c)) { c.rowCount = v } })} />,
        columnCount: <ctx.NumberEditor value={content.columnCount} setValue={(v) => update(c => { if (isRectArrayContent(c)) { c.columnCount = v } })} />,
        rowSpacing: <ctx.NumberEditor value={content.rowSpacing} setValue={(v) => update(c => { if (isRectArrayContent(c)) { c.rowSpacing = v } })} />,
        columnSpacing: <ctx.NumberEditor value={content.columnSpacing} setValue={(v) => update(c => { if (isRectArrayContent(c)) { c.columnSpacing = v } })} />,
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update),
      }
    },
    isValid: (c, p) => ctx.validate(c, RectArrayContent, p),
    getRefIds,
  }
}

export function isRectArrayContent(content: model.BaseContent): content is RectArrayContent {
  return content.type === 'rect array'
}

export function getCommand(ctx: PluginContext): Command {
  function contentSelectable(content: model.BaseContent, contents: core.Nullable<model.BaseContent>[]) {
    return ctx.contentIsDeletable(content, contents)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="3" y="70" width="40" height="27" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
      <rect x="58" y="70" width="40" height="27" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
      <rect x="3" y="35" width="40" height="27" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
      <rect x="58" y="35" width="40" height="27" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
      <rect x="3" y="0" width="40" height="27" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
      <rect x="58" y="1" width="40" height="27" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
    </svg>
  )
  return {
    name: 'create rect array',
    execute({ contents, selected }) {
      const target = contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents))
      const bounding = ctx.getContentsBounding(target, contents)
      if (!bounding) return
      const newContent: RectArrayContent = {
        type: 'rect array',
        contents: target,
        rowCount: 3,
        rowSpacing: -(bounding.end.y - bounding.start.y) * 1.5,
        columnCount: 4,
        columnSpacing: (bounding.end.x - bounding.start.x) * 1.5,
      }
      for (let i = contents.length; i >= 0; i--) {
        if (ctx.isSelected([i], selected)) {
          contents[i] = undefined
        }
      }
      contents.push(newContent)
    },
    contentSelectable,
    icon,
  }
}
