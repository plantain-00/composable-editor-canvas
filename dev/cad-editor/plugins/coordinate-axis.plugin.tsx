import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type CoordinateAxisContent = model.BaseContent<'coordinate axis'> & model.StrokeFields & model.ArrowFields & core.Position & core.Bounding & {
  flipY?: boolean
}

export function getModel(ctx: PluginContext): model.Model<CoordinateAxisContent> {
  function getGeometriesFromCache(content: Omit<CoordinateAxisContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const yMin = content.flipY ? -content.yMax : content.yMin
      const yMax = content.flipY ? -content.yMin : content.yMax
      const lines: [core.Position, core.Position][] = [
        [
          { x: content.x + content.xMin, y: content.y },
          { x: content.x + content.xMax, y: content.y },
        ],
        [
          { x: content.x, y: content.y + yMin },
          { x: content.x, y: content.y + yMax },
        ],
      ]
      const areas: core.Position[][] = []
      const renderingLines: core.Position[][] = []
      lines.forEach(([p1, p2], i) => {
        if (content.flipY && i === 1) {
          [p2, p1] = [p1, p2]
        }
        const { arrowPoints, endPoint } = ctx.getArrowPoints(p1, p2, content)
        areas.push(arrowPoints)
        lines[i][content.flipY && i === 1 ? 0 : 1] = endPoint
        renderingLines.push(...ctx.dashedPolylineToLines(lines[i], content.dashArray))
      })
      return {
        points: [],
        lines,
        bounding: {
          start: {
            x: content.x + Math.min(0, content.xMin, content.xMax),
            y: content.y + Math.min(0, yMin, yMax),
          },
          end: {
            x: content.x + Math.max(0, content.xMin, content.xMax),
            y: content.y + Math.max(0, yMin, yMax),
          },
        },
        regions: areas.map(e => ({
          points: e,
          lines: Array.from(ctx.iteratePolygonLines(e)),
        })),
        renderingLines,
      }
    })
  }
  const React = ctx.React
  return {
    type: 'coordinate axis',
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, contents }) {
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
      const strokeColor = getStrokeColor(strokeStyleContent)
      const strokeWidth = transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content))
      const { regions, renderingLines } = getGeometriesFromCache(content)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, { strokeColor, strokeWidth }))
      }
      if (regions) {
        for (let i = 0; i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeWidth: 0, fillColor: strokeColor }))
        }
      }
      return target.renderGroup(children)
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isCoordinateAxisContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
          ]
        }
      })
    },
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents) {
      return {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isCoordinateAxisContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isCoordinateAxisContent(c)) { c.y = v } })} />,
        xMin: <ctx.NumberEditor value={content.xMin} setValue={(v) => update(c => { if (isCoordinateAxisContent(c)) { c.xMin = v } })} />,
        xMax: <ctx.NumberEditor value={content.xMax} setValue={(v) => update(c => { if (isCoordinateAxisContent(c)) { c.xMax = v } })} />,
        yMin: <ctx.NumberEditor value={content.yMin} setValue={(v) => update(c => { if (isCoordinateAxisContent(c)) { c.yMin = v } })} />,
        yMax: <ctx.NumberEditor value={content.yMax} setValue={(v) => update(c => { if (isCoordinateAxisContent(c)) { c.yMax = v } })} />,
        flipY: <ctx.BooleanEditor value={content.flipY === true} setValue={(v) => update(c => { if (isCoordinateAxisContent(c)) { c.flipY = v ? true : undefined } })} />,
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds,
  }
}

export function isCoordinateAxisContent(content: model.BaseContent): content is CoordinateAxisContent {
  return content.type === 'coordinate axis'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="0,50 95,50" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="50,5 50,100" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="100,50 82,58 82,42" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline>
      <polyline points="50,0 58,18 42,18" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create coordinate axis',
    selectCount: 0,
    icon,
    useCommand({ onEnd, type }) {
      const [result, setResult] = React.useState<CoordinateAxisContent>()
      const reset = () => {
        setResult(undefined)
      }
      ctx.useKey((e) => e.key === 'Escape', reset, [setResult])
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                if (result) {
                  contents.push(result)
                }
              },
            })
            reset()
          }
        },
        onMove(p) {
          if (type) {
            setResult({
              type: 'coordinate axis',
              x: p.x,
              y: p.y,
              xMin: -50,
              xMax: 50,
              yMin: -50,
              yMax: 50,
              flipY: true,
            })
          }
        },
        assistentContents: result ? [result] : undefined,
        reset,
      }
    },
  }
}