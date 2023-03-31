import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type TableContent = model.BaseContent<'table'> & core.Position & model.StrokeFields & {
  rows: TableRow[]
  widths: number[]
}

export interface TableRow {
  height: number
}

export function getModel(ctx: PluginContext): model.Model<TableContent> {
  const TableRow = ctx.and({
    height: ctx.number,
  })
  const TableContent = ctx.and(ctx.BaseContent('table'), ctx.Position, ctx.StrokeFields, {
    rows: [TableRow],
    widths: [ctx.number],
  })
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ rows: (core.Position & { index: number })[], columns: (core.Position & { index: number })[], xs: number[], ys: number[] }>>()
  const getGeometries = (content: Omit<TableContent, 'type'>) => {
    return geometriesCache.get(content, () => {
      const lines: [core.Position, core.Position][] = []
      const width = content.widths.reduce((p, c) => p + c, 0)
      const height = content.rows.reduce((p, c) => p + c.height, 0)
      lines.push([{ x: content.x, y: content.y }, { x: content.x + width, y: content.y }])
      lines.push([{ x: content.x, y: content.y }, { x: content.x, y: content.y + height }])
      const rows: (core.Position & { index: number })[] = []
      const columns: (core.Position & { index: number })[] = []
      const xs: number[] = []
      const ys: number[] = []
      let x = content.x
      content.widths.forEach(w => {
        x += w
        xs.push(x - w / 2)
        lines.push([{ x, y: content.y }, { x, y: content.y + height }])
      })
      let y = content.y
      content.rows.forEach((row, i) => {
        y += row.height
        ys.push(y - row.height / 2)
        lines.push([{ x: content.x, y }, { x: content.x + width, y }])
        let x = content.x
        content.widths.forEach((w, j) => {
          x += w
          rows.push({ x: x - w / 2, y, index: i })
          columns.push({ x, y: y - row.height / 2, index: j })
        })
      })
      return {
        lines,
        rows,
        columns,
        xs,
        ys,
        bounding: { start: { x: content.x, y: content.y }, end: { x: content.x + width, y: content.y + height } },
        renderingLines: lines.map(r => ctx.dashedPolylineToLines(r, content.dashArray)).flat(),
      }
    })
  }
  const React = ctx.React
  return {
    type: 'table',
    ...ctx.strokeModel,
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    render(content, renderCtx) {
      const geometries = getGeometries(content)
      const strokeStyleContent = ctx.getStrokeStyleContent(content, renderCtx.contents)
      const options = {
        ...renderCtx,
        strokeColor: renderCtx.getStrokeColor(strokeStyleContent),
        strokeWidth: renderCtx.transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content)),
        dashArray: strokeStyleContent.dashArray,
      }
      return renderCtx.target.renderGroup(geometries.renderingLines.map(line => {
        return renderCtx.target.renderPolyline(line, options)
      }))
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { rows, columns, xs, ys } = getGeometries(content)
        return {
          editPoints: [
            {
              x: content.x,
              y: content.y,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isTableContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            ...rows.map(p => ({
              x: p.x,
              y: p.y,
              cursor: 'row-resize',
              update(c, { cursor, start, scale }) {
                if (!isTableContent(c)) {
                  return
                }
                c.rows[p.index].height += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            } as core.EditPoint<model.BaseContent>)),
            ...columns.map(p => ({
              x: p.x,
              y: p.y,
              cursor: 'col-resize',
              update(c, { cursor, start, scale }) {
                if (!isTableContent(c)) {
                  return
                }
                c.widths[p.index] += cursor.x - start.x
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            } as core.EditPoint<model.BaseContent>)),
            ...xs.map((p, i) => ({
              x: p,
              y: content.y,
              cursor: 'not-allowed',
              execute(c) {
                if (!isTableContent(c)) {
                  return
                }
                c.widths.splice(i, 1)
              },
            } as core.EditPoint<model.BaseContent>)),
            ...ys.map((p, i) => ({
              x: content.x,
              y: p,
              cursor: 'not-allowed',
              execute(c) {
                if (!isTableContent(c)) {
                  return
                }
                c.rows.splice(i, 1)
              },
            } as core.EditPoint<model.BaseContent>)),
            ...xs.map((p, i) => ({
              x: p + content.widths[i] / 2,
              y: content.y,
              cursor: 'cell',
              execute(c) {
                if (!isTableContent(c)) {
                  return
                }
                c.widths.splice(i, 0, c.widths[i])
              },
            } as core.EditPoint<model.BaseContent>)),
            ...ys.map((p, i) => ({
              x: content.x,
              y: p + content.rows[i].height / 2,
              cursor: 'cell',
              execute(c) {
                if (!isTableContent(c)) {
                  return
                }
                c.rows.splice(i, 0, c.rows[i])
              },
            } as core.EditPoint<model.BaseContent>)),
          ]
        }
      })
    },
    getGeometries,
    propertyPanel(content, update, contents) {
      return {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isTableContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isTableContent(c)) { c.y = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, TableContent, p),
  }
}

export function isTableContent(content: model.BaseContent): content is TableContent {
  return content.type === 'table'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="7,10 91,10" strokeWidth="4" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="7,10 7,87" strokeWidth="4" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="35,10 35,87" strokeWidth="4" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="63,10 63,87" strokeWidth="4" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="91,10 91,87" strokeWidth="4" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="7,34 91,34" strokeWidth="4" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="7,60 91,60" strokeWidth="4" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="7,87 91,87" strokeWidth="4" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create table',
    useCommand({ onEnd, strokeStyleId }) {
      const assistentContents: (TableContent)[] = []
      const [position, setPosition] = React.useState<core.Position>()
      const newContent: TableContent = {
        type: 'table',
        x: 0,
        y: 0,
        widths: [100, 100, 100],
        rows: [
          { height: 20 },
          { height: 20 },
          { height: 20 },
          { height: 20 },
        ],
        strokeStyleId,
      }
      if (position) {
        assistentContents.push({
          ...newContent,
          x: position.x,
          y: position.y,
        })
      }
      return {
        onStart(p) {
          onEnd({
            updateContents: (contents) => {
              contents.push({
                ...newContent,
                x: p.x,
                y: p.y,
              } as TableContent)
            }
          })
        },
        onMove(p) {
          setPosition(p)
        },
        assistentContents,
        reset() {
          setPosition(undefined)
        },
      }
    },
    selectCount: 0,
    icon,
  }
}
