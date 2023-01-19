import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type PolarArrayContent = model.BaseContent<'polar array'> & model.ContainerFields & {
  center: core.Position
  itemCount: number
  itemAngle: number
  rowCount: number
  rowSpacing: number
}

export function getModel(ctx: PluginContext): model.Model<PolarArrayContent> {
  const PolarArrayContent = ctx.and(ctx.BaseContent('polar array'), ctx.ContainerFields, {
    center: ctx.Position,
    itemCount: ctx.number,
    itemAngle: ctx.number,
    rowCount: ctx.number,
    rowSpacing: ctx.number,
  })
  const getAllContentsFromCache = (content: Omit<PolarArrayContent, 'type'>, contents: readonly core.Nullable<model.BaseContent>[]) => {
    return ctx.allContentsCache.get(content, () => {
      const result: core.Nullable<model.BaseContent>[] = []
      const bounding = ctx.getContentsBounding(content.contents)
      if (!bounding) return result
      const base = {
        x: ctx.getTwoNumberCenter(bounding.start.x, bounding.end.x),
        y: ctx.getTwoNumberCenter(bounding.start.y, bounding.end.y),
      }
      for (let i = 0; i < content.rowCount; i++) {
        for (let j = 0; j < content.itemCount; j++) {
          const angle = j * content.itemAngle
          if (i === 0 && j === 0) {
            result.push(...content.contents)
          } else {
            result.push(...content.contents.map(c => {
              if (!c) return
              const model = ctx.getContentModel(c)
              const rotate = model?.rotate
              if (!rotate) return
              const move = model.move
              if (!move) return
              return ctx.produce(c, draft => {
                if (i !== 0) {
                  const center = ctx.getPointByLengthAndDirection(base, -i * content.rowSpacing, content.center)
                  move(draft, {
                    x: center.x - base.x,
                    y: center.y - base.y,
                  })
                }
                rotate(draft, content.center, angle, contents)
              })
            }))
          }
        }
      }
      return result
    })
  }
  const getGeometries = (content: Omit<PolarArrayContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) => ctx.getContentsGeometries(content, c => getAllContentsFromCache(c, contents))
  const React = ctx.React
  return {
    type: 'polar array',
    ...ctx.containerModel,
    move(content, offset) {
      ctx.getContainerMove(content, offset)
      content.center.x += offset.x
      content.center.y += offset.y
    },
    explode(content, contents) {
      return getAllContentsFromCache(content, contents).filter((c): c is model.BaseContent => !!c)
    },
    render(content, renderCtx) {
      return renderCtx.target.renderGroup(ctx.renderContainerChildren({ contents: getAllContentsFromCache(content, renderCtx.contents), variableValues: content.variableValues }, renderCtx))
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const bounding = ctx.getContentsBounding(content.contents)
        if (!bounding) {
          return { editPoints: [] }
        }
        const base = {
          x: ctx.getTwoNumberCenter(bounding.start.x, bounding.end.x),
          y: ctx.getTwoNumberCenter(bounding.start.y, bounding.end.y),
        }
        const editPoints: core.EditPoint<model.BaseContent>[] = [
          {
            ...base,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
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
            x: content.center.x,
            y: content.center.y,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return
              }
              c.center.x += cursor.x - start.x
              c.center.y += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
            },
          },
        ]
        if (content.rowCount > 1) {
          const p = ctx.getPointByLengthAndDirection(base, -content.rowSpacing, content.center)
          editPoints.push({
            ...p,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return
              }
              c.rowSpacing = ctx.getTwoPointsDistance(cursor, base)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
            },
          },)
        }
        if (content.rowCount > 2) {
          const p = ctx.getPointByLengthAndDirection(base, -(content.rowCount - 1) * content.rowSpacing, content.center)
          editPoints.push({
            ...p,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return
              }
              c.rowCount = Math.round(ctx.getTwoPointsDistance(cursor, base) / c.rowSpacing) + 1
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
            },
          },)
        }
        if (content.itemCount > 1) {
          const p = ctx.rotatePositionByCenter(base, content.center, -content.itemAngle)
          editPoints.push({
            ...p,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return
              }
              c.itemAngle = (Math.atan2(cursor.y - content.center.y, cursor.x - content.center.x) - Math.atan2(base.y - content.center.y, base.x - content.center.x)) * 180 / Math.PI
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
            },
          },)
        }
        if (content.itemCount > 2) {
          const p = ctx.rotatePositionByCenter(base, content.center, -(content.itemCount - 1) * content.itemAngle)
          editPoints.push({
            ...p,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return
              }
              let angle = (Math.atan2(cursor.y - content.center.y, cursor.x - content.center.x) - Math.atan2(base.y - content.center.y, base.x - content.center.x)) * 180 / Math.PI
              if (c.itemAngle > 0) {
                if (angle < 0) {
                  angle += 360
                }
              } else {
                if (angle > 0) {
                  angle -= 360
                }
              }
              c.itemCount = Math.round(angle / c.itemAngle) + 1
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
            },
          },)
        }
        return {
          editPoints,
        }
      })
    },
    getSnapPoints(content, contents) {
      return ctx.getContentsSnapPoints(content, contents, c => getAllContentsFromCache(c, contents))
    },
    getGeometries,
    propertyPanel(content, update) {
      return {
        center: <ctx.ObjectEditor
          inline
          properties={{
            x: <ctx.NumberEditor value={content.center.x} setValue={(v) => update(c => { if (isPolarArrayContent(c)) { c.center.x = v } })} />,
            y: <ctx.NumberEditor value={content.center.y} setValue={(v) => update(c => { if (isPolarArrayContent(c)) { c.center.y = v } })} />,
          }}
        />,
        rowCount: <ctx.NumberEditor value={content.rowCount} setValue={(v) => update(c => { if (isPolarArrayContent(c)) { c.rowCount = v } })} />,
        itemCount: <ctx.NumberEditor value={content.itemCount} setValue={(v) => update(c => { if (isPolarArrayContent(c)) { c.itemCount = v } })} />,
        rowSpacing: <ctx.NumberEditor value={content.rowSpacing} setValue={(v) => update(c => { if (isPolarArrayContent(c)) { c.rowSpacing = v } })} />,
        itemAngle: <ctx.NumberEditor value={content.itemAngle} setValue={(v) => update(c => { if (isPolarArrayContent(c)) { c.itemAngle = v } })} />,
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update),
      }
    },
    isValid: (c, p) => ctx.validate(c, PolarArrayContent, p),
  }
}

export function isPolarArrayContent(content: model.BaseContent): content is PolarArrayContent {
  return content.type === 'polar array'
}

export function getCommand(ctx: PluginContext): Command {
  function contentSelectable(content: model.BaseContent, contents: core.Nullable<model.BaseContent>[]) {
    return !ctx.contentIsReferenced(content, contents)
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="30" cy="22" r="12" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <circle cx="67" cy="23" r="12" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <circle cx="82" cy="53" r="12" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <circle cx="67" cy="81" r="12" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <circle cx="28" cy="79" r="12" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <circle cx="13" cy="50" r="12" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
    </svg>
  )
  return {
    name: 'create polar array',
    useCommand({ onEnd, type, scale }) {
      let message = ''
      if (type) {
        message = 'specify target point'
      }
      const { input, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message)

      return {
        onStart(p) {
          resetInput()
          onEnd({
            updateContents: (contents, selected) => {
              const target = contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents))
              const bounding = ctx.getContentsBounding(target)
              if (!bounding) return
              const newContent: PolarArrayContent = {
                type: 'polar array',
                center: p,
                contents: target,
                rowCount: 1,
                rowSpacing: ctx.getTwoPointsDistance(bounding.end, bounding.start) * 1.5,
                itemCount: 6,
                itemAngle: 60,
              }
              for (let i = contents.length; i >= 0; i--) {
                if (ctx.isSelected([i], selected)) {
                  contents[i] = undefined
                }
              }
              contents.push(newContent)
              setCursorPosition(undefined)
            }
          })
        },
        input,
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p)
          if (!type) {
            return
          }
          setCursorPosition(p)
        },
        updateSelectedContent(content) {
          if (cursorPosition) {
            const bounding = ctx.getContentModel(content)?.getGeometries?.(content).bounding
            if (!bounding) return {}
            const base = {
              x: ctx.getTwoNumberCenter(bounding.start.x, bounding.end.x),
              y: ctx.getTwoNumberCenter(bounding.start.y, bounding.end.y),
            }
            return {
              newContents: [
                {
                  type: 'polar array',
                  center: cursorPosition,
                  contents: [content],
                  rowCount: 1,
                  rowSpacing: ctx.getTwoPointsDistance(bounding.end, bounding.start) * 1.5,
                  itemCount: 6,
                  itemAngle: 60,
                } as PolarArrayContent,
              ],
              assistentContents: [
                {
                  type: 'line',
                  dashArray: [4 / scale],
                  points: [base, cursorPosition]
                },
              ]
            }
          }
          return {}
        },
        reset: resetInput,
      }
    },
    contentSelectable,
    icon,
  }
}
