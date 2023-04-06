import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type TableContent = model.BaseContent<'table'> & core.Position & model.StrokeFields & {
  rows: TableRow[]
  widths: number[]
  mergedCells?: MergedCell[]
}

interface TableRow {
  height: number
  cells?: TableCellText[]
}

interface MergedCell {
  row: [number, number]
  column: [number, number]
}

interface TableCellText extends model.TextFields {
  type: 'table cell text'
  text: string
  column: number
}

export function getModel(ctx: PluginContext): model.Model<TableContent>[] {
  const TableCellText = ctx.and(ctx.TextFields, {
    type: 'table cell text',
    text: ctx.string,
    column: ctx.number,
  })
  const TableRow = {
    height: ctx.number,
    cells: ctx.optional([TableCellText]),
  }
  const MergedCell = {
    row: ctx.tuple(ctx.number, ctx.number),
    column: ctx.tuple(ctx.number, ctx.number),
  }
  const TableContent = ctx.and(ctx.BaseContent('table'), ctx.Position, ctx.StrokeFields, {
    rows: [TableRow],
    widths: [ctx.number],
    mergedCells: ctx.optional([MergedCell])
  })
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{
    rows: (core.Position & { index: number })[]
    columns: (core.Position & { index: number })[]
    xs: number[]
    ys: number[]
    children: ({ region: core.Position[], row: number, column: number } & core.Region)[]
  }>>()
  const textLayoutResultCache = new ctx.WeakmapMap3Cache<object, object, number, number, ReturnType<typeof ctx.flowLayout<string>>>()
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
      const children: ({ region: core.Position[], row: number, column: number } & core.Region)[] = []
      let x = content.x
      content.widths.forEach(w => {
        x += w
        xs.push(x - w / 2)
      })
      let yStart = content.y
      content.rows.forEach((row, i) => {
        const yMiddle = yStart + row.height / 2
        const yEnd = yStart + row.height
        ys.push(yMiddle)
        let xStart = content.x
        content.widths.forEach((w, j) => {
          const xMiddle = xStart + w / 2
          const xEnd = xStart + w
          if (!content.mergedCells?.some(c => i >= c.row[0] && i < c.row[0] + c.row[1] - 1 && j >= c.column[0] && j < c.column[0] + c.column[1])) {
            lines.push([{ x: xStart, y: yEnd }, { x: xEnd, y: yEnd }])
            rows.push({ x: xMiddle, y: yEnd, index: i })
          }
          if (!content.mergedCells?.some(c => i >= c.row[0] && i < c.row[0] + c.row[1] && j >= c.column[0] && j < c.column[0] + c.column[1] - 1)) {
            lines.push([{ x: xEnd, y: yStart }, { x: xEnd, y: yEnd }])
            columns.push({ x: xEnd, y: yMiddle, index: j })
          }
          const cell = content.mergedCells?.find(c => i >= c.row[0] && i < c.row[0] + c.row[1] && j >= c.column[0] && j < c.column[0] + c.column[1])
          if (cell) {
            if (i === cell.row[0] && j === cell.column[0]) {
              const end = {
                x: xEnd,
                y: yEnd,
              }
              for (let k = 1; k < cell.column[1] && k < content.widths.length - j; k++) {
                end.x += content.widths[j + k]
              }
              for (let k = 1; k < cell.row[1] && k < content.rows.length - i; k++) {
                end.y += content.rows[i + k].height
              }
              children.push({
                row: i,
                column: j,
                x: xStart - content.x,
                y: yStart - content.y,
                width: end.x - xStart,
                height: end.y - yStart,
                region: ctx.getPolygonFromTwoPointsFormRegion({ start: { x: xStart, y: yStart }, end }),
              })
            }
          } else {
            children.push({
              row: i,
              column: j,
              x: xStart - content.x,
              y: yStart - content.y,
              width: w,
              height: row.height,
              region: ctx.getPolygonFromTwoPointsFormRegion({ start: { x: xStart, y: yStart }, end: { x: xEnd, y: yEnd } }),
            })
          }
          xStart = xEnd
        })
        yStart = yEnd
      })
      const bounding = { start: { x: content.x, y: content.y }, end: { x: content.x + width, y: content.y + height } }
      const polygon = ctx.getPolygonFromTwoPointsFormRegion(bounding)
      return {
        lines,
        rows,
        columns,
        xs,
        ys,
        bounding,
        renderingLines: lines.map(r => ctx.dashedPolylineToLines(r, content.dashArray)).flat(),
        regions: [{
          points: polygon,
          lines: Array.from(ctx.iteratePolygonLines(polygon)),
        }],
        children,
      }
    })
  }
  const React = ctx.React
  const tableModel: model.Model<TableContent> = {
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
      const children = geometries.renderingLines.map(line => renderCtx.target.renderPolyline(line, options))
      content.rows.forEach((row, i) => {
        row.cells?.forEach(cell => {
          const child = geometries.children.find(f => f.row === i && f.column === cell.column)
          if (!child) return
          const { width, height } = child
          const textStyleContent = ctx.getTextStyleContent(cell, renderCtx.contents)
          const textLayout = textLayoutResultCache.get(cell, textStyleContent, width, height, () => {
            const state = cell.text.split('')
            const getTextWidth = (text: string) => ctx.getTextSizeFromCache(ctx.getTextStyleFont(textStyleContent), text)?.width ?? 0
            return ctx.flowLayout({
              state,
              width,
              height,
              lineHeight: textStyleContent.lineHeight ?? textStyleContent.fontSize * 1.2,
              getWidth: getTextWidth,
              align: textStyleContent.align ?? 'center',
              verticalAlign: textStyleContent.verticalAlign ?? 'middle',
              endContent: '',
              isNewLineContent: c => c === '\n',
              isPartOfComposition: c => ctx.isWordCharactor(c),
              getComposition: (index: number) => ctx.getTextComposition(index, state, getTextWidth, c => c),
            })
          })
          const font = ctx.getTextStyleFont(textStyleContent)
          for (const { x, y, content: text } of textLayout.layoutResult) {
            const textWidth = ctx.getTextSizeFromCache(font, text)?.width ?? 0
            children.push(renderCtx.target.renderText(content.x + child.x + x + textWidth / 2, content.y + child.y + y + textStyleContent.fontSize, text, textStyleContent.color, textStyleContent.fontSize, textStyleContent.fontFamily, { textAlign: 'center', cacheKey: cell }))
          }
        })
      })
      return renderCtx.target.renderGroup(children)
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
                if (isTableContent(c)) {
                  deleteTableColumn(c, i)
                }
              },
            } as core.EditPoint<model.BaseContent>)),
            ...ys.map((p, i) => ({
              x: content.x,
              y: p,
              cursor: 'not-allowed',
              execute(c) {
                if (isTableContent(c)) {
                  deleteTableRow(c, i)
                }
              },
            } as core.EditPoint<model.BaseContent>)),
            ...xs.map((p, i) => ({
              x: p + content.widths[i] / 2,
              y: content.y,
              cursor: 'cell',
              execute(c) {
                if (isTableContent(c)) {
                  insertTableColumn(c, i)
                }
              },
            } as core.EditPoint<model.BaseContent>)),
            ...ys.map((p, i) => ({
              x: content.x,
              y: p + content.rows[i].height / 2,
              cursor: 'cell',
              execute(c) {
                if (isTableContent(c)) {
                  insertTableRow(c, i)
                }
              },
            } as core.EditPoint<model.BaseContent>)),
          ]
        }
      })
    },
    getGeometries,
    propertyPanel(content, update, contents, options) {
      const properties: Record<string, JSX.Element | (JSX.Element | undefined)[]> = {}
      if (options.activeChild) {
        const [row, column] = options.activeChild
        properties.row = <ctx.NumberEditor readOnly value={row} />
        properties.column = <ctx.NumberEditor readOnly value={column} />
        const mergedCell = content.mergedCells?.find?.(c => c.row[0] === row && c.column[0] === column)
        properties.rowSpan = <ctx.NumberEditor value={mergedCell?.row[1] ?? 1} setValue={(v) => update(c => { if (isTableContent(c)) { setTableRowSpan(c, row, column, v) } })} />
        properties.columnSpan = <ctx.NumberEditor value={mergedCell?.column[1] ?? 1} setValue={(v) => update(c => { if (isTableContent(c)) { setTableColumnSpan(c, row, column, v) } })} />
        const cell = content.rows[row].cells?.find(c => c.column === column)
        if (cell) {
          Object.assign(properties, ctx.getTextContentPropertyPanel(cell, f => update(c => { if (isTableContent(c)) { setTableCell(c, row, column, f) } }), contents))
        }
      }
      return {
        ...properties,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isTableContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isTableContent(c)) { c.y = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    editPanel(content, transform, update, contents, cancel, activeChild) {
      const p = ctx.transformPosition(content, transform)
      if (!activeChild) return <></>
      const [row, column] = activeChild
      const cell = content.rows[row].cells?.find(c => c.column === column)
      if (!cell) return <></>
      const { children } = getGeometries(content)
      const child = children.find(f => f.row === row && f.column === column)
      if (!child) return <></>
      const textStyleContent = ctx.getTextStyleContent(cell, contents)
      const fontSize = textStyleContent.fontSize * transform.scale
      return <ctx.TextEditor
        fontSize={fontSize}
        width={child.width * transform.scale}
        height={child.height * transform.scale}
        color={textStyleContent.color}
        fontFamily={textStyleContent.fontFamily}
        align={textStyleContent.align ?? 'center'}
        verticalAlign={textStyleContent.verticalAlign ?? 'middle'}
        lineHeight={textStyleContent.lineHeight ? textStyleContent.lineHeight * transform.scale : undefined}
        onCancel={cancel}
        x={p.x + child.x * transform.scale}
        y={p.y + child.y * transform.scale}
        borderWidth={0}
        value={cell.text}
        setValue={(v) => update(c => { if (isTableContent(c)) { setTableCell(c, row, column, t => t.text = v) } })}
      />
    },
    isValid: (c, p) => ctx.validate(c, TableContent, p),
    getChildByPoint(content, point, { textStyleId }) {
      const { children } = getGeometries(content)
      const child = children.find(c => ctx.pointInPolygon(point, c.region))
      if (child) {
        if (!content.rows[child.row].cells?.some(c => c.column === child.column)) {
          const [, patches, reversePatches] = ctx.produceWithPatches(content, draft => {
            const row = draft.rows[child.row]
            if (!row.cells) {
              row.cells = []
            }
            row.cells.push({
              type: 'table cell text',
              textStyleId,
              text: '',
              color: 0x000000,
              fontSize: 16,
              fontFamily: 'monospace',
              column: child.column,
            })
          })
          return {
            child: [child.row, child.column],
            patches: [patches, reversePatches],
          }
        }
        return {
          child: [child.row, child.column],
        }
      }
      return
    },
  }
  return [
    tableModel,
    {
      type: 'table cell text',
      ...ctx.textModel,
    }
  ]
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

function deleteTableColumn(c: TableContent, i: number) {
  c.widths.splice(i, 1)
  if (c.mergedCells) {
    const indexes: number[] = []
    c.mergedCells.forEach((cell, k) => {
      if (i < cell.column[0]) {
        cell.column[0]--
      } else if (i === cell.column[0]) {
        indexes.unshift(k)
      } else if (i < cell.column[0] + cell.column[1]) {
        cell.column[1]--
      }
    })
    indexes.forEach(d => c.mergedCells?.splice(d, 1))
  }
}

function deleteTableRow(c: TableContent, i: number) {
  c.rows.splice(i, 1)
  if (c.mergedCells) {
    const indexes: number[] = []
    c.mergedCells.forEach((cell, k) => {
      if (i < cell.row[0]) {
        cell.row[0]--
      } else if (i === cell.row[0]) {
        indexes.unshift(k)
      } else if (i < cell.row[0] + cell.row[1]) {
        cell.row[1]--
      }
    })
    indexes.forEach(d => c.mergedCells?.splice(d, 1))
  }
}

function setTableRowSpan(c: TableContent, row: number, column: number, v: number) {
  if (!c.mergedCells) c.mergedCells = []
  const index = c.mergedCells.findIndex(m => m.row[0] === row && m.column[0] === column)
  if (index < 0) {
    c.mergedCells.push({ row: [row, v], column: [column, 1] })
  } else if (v <= 1 && c.mergedCells[index].column[1] <= 1) {
    c.mergedCells.splice(index, 1)
    if (c.mergedCells.length === 0) c.mergedCells = undefined
  } else {
    c.mergedCells[index].row[1] = v
  }
}

function setTableColumnSpan(c: TableContent, row: number, column: number, v: number) {
  if (!c.mergedCells) c.mergedCells = []
  const index = c.mergedCells.findIndex(m => m.row[0] === row && m.column[0] === column)
  if (index < 0) {
    c.mergedCells.push({ row: [row, 1], column: [column, v] })
  } else if (v <= 1 && c.mergedCells[index].row[1] <= 1) {
    c.mergedCells.splice(index, 1)
    if (c.mergedCells.length === 0) c.mergedCells = undefined
  } else {
    c.mergedCells[index].column[1] = v
  }
}

function insertTableColumn(c: TableContent, i: number) {
  c.widths.splice(i, 0, c.widths[i])
  c.mergedCells?.forEach(cell => {
    if (i < cell.column[0]) {
      cell.column[0]++
    } else if (i < cell.column[0] + cell.column[1] - 1) {
      cell.column[1]++
    }
  })
}

function insertTableRow(c: TableContent, i: number) {
  c.rows.splice(i, 0, c.rows[i])
  c.mergedCells?.forEach(cell => {
    if (i < cell.row[0]) {
      cell.row[0]++
    } else if (i < cell.row[0] + cell.row[1] - 1) {
      cell.row[1]++
    }
  })
}

function setTableCell(c: TableContent, row: number, column: number, update: (cell: TableCellText) => void) {
  const t = c.rows[row].cells?.find(c => c.column === column)
  if (t) {
    update(t)
  }
}
