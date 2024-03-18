import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type PathContent = model.BaseContent<'path'> & model.StrokeFields & model.FillFields & {
  commands: core.PathCommand[]
}

export function getModel(ctx: PluginContext): model.Model<PathContent> {
  const PathContent = ctx.and(ctx.BaseContent('path'), ctx.StrokeFields, ctx.FillFields, {
    commands: [ctx.PathCommand]
  })
  const getRefIds = (content: Omit<PathContent, "type">) => [content.strokeStyleId, content.fillStyleId]
  function getPathGeometriesFromCache(content: Omit<PathContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]))
    return ctx.getGeometriesFromCache(content, refs, () => {
      const lines = ctx.pathCommandsToGeometryLines(content.commands)[0]
      const points = ctx.getGeometryLinesPoints(lines)
      return {
        lines,
        bounding: ctx.getGeometryLinesBounding(lines),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points,
          },
        ] : undefined,
      }
    })
  }
  const React = ctx.React
  return {
    type: 'path',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      for (const command of content.commands) {
        if (command.type !== 'close') {
          ctx.movePoint(command.to, offset)
        }
        if (command.type === 'arc') {
          ctx.movePoint(command.from, offset)
        } else if (command.type === 'bezierCurve') {
          ctx.movePoint(command.cp1, offset)
          ctx.movePoint(command.cp2, offset)
        } else if (command.type === 'quadraticCurve') {
          ctx.movePoint(command.cp, offset)
        }
      }
    },
    rotate(content, center, angle) {
      for (const command of content.commands) {
        if (command.type !== 'close') {
          ctx.rotatePoint(command.to, center, angle)
        }
        if (command.type === 'arc') {
          ctx.rotatePoint(command.from, center, angle)
        } else if (command.type === 'bezierCurve') {
          ctx.rotatePoint(command.cp1, center, angle)
          ctx.rotatePoint(command.cp2, center, angle)
        } else if (command.type === 'quadraticCurve') {
          ctx.rotatePoint(command.cp, center, angle)
        }
      }
    },
    scale(content, center, sx, sy) {
      for (const command of content.commands) {
        if (command.type !== 'close') {
          ctx.scalePoint(command.to, center, sx, sy)
        }
        if (command.type === 'arc') {
          ctx.scalePoint(command.from, center, sx, sy)
        } else if (command.type === 'bezierCurve') {
          ctx.scalePoint(command.cp1, center, sx, sy)
          ctx.scalePoint(command.cp2, center, sx, sy)
        } else if (command.type === 'quadraticCurve') {
          ctx.scalePoint(command.cp, center, sx, sy)
        }
      }
    },
    mirror(content, line) {
      for (const command of content.commands) {
        if (command.type !== 'close') {
          ctx.mirrorPoint(command.to, line)
        }
        if (command.type === 'arc') {
          ctx.mirrorPoint(command.from, line)
        } else if (command.type === 'bezierCurve') {
          ctx.mirrorPoint(command.cp1, line)
          ctx.mirrorPoint(command.cp2, line)
        } else if (command.type === 'quadraticCurve') {
          ctx.mirrorPoint(command.cp, line)
        }
      }
    },
    break(content, intersectionPoints, contents) {
      const lines = getPathGeometriesFromCache(content, contents).lines
      return ctx.breakGeometryLinesToPathCommands(lines, intersectionPoints)
    },
    offset(content, point, distance, contents) {
      const lines = getPathGeometriesFromCache(content, contents).lines
      return {
        ...content,
        commands: ctx.geometryLineToPathCommands(ctx.getParallelGeometryLinesByDistancePoint(point, lines, distance)),
      }
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      return target.renderPathCommands(content.commands, options)
    },
    renderIfSelected(content, { color, target, strokeWidth }) {
      const points: core.Position[][] = []
      content.commands.forEach((c, i) => {
        const last = ctx.getPathCommandEndPoint(content.commands, i - 1)
        if (last) {
          if (c.type === 'quadraticCurve') {
            points.push([last, c.cp, c.to])
          } else if (c.type === 'bezierCurve') {
            points.push([last, c.cp1, c.cp2, c.to])
          } else if (c.type === 'arc') {
            points.push([last, c.from, c.to])
          } else if (c.type === 'ellipseArc') {
            points.push([last, c.to])
          }
        }
      })
      return target.renderPath(points, { strokeColor: color, dashArray: [4], strokeWidth })
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const editPoints: core.EditPoint<model.BaseContent>[] = []
        content.commands.forEach((command, i) => {
          if (command.type === 'arc') {
            editPoints.push({
              ...command.from,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isPathContent(c)) {
                  return
                }
                const m = c.commands[i]
                if (m.type !== 'arc') {
                  return
                }
                m.from.x += cursor.x - start.x
                m.from.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            })
          } else if (command.type === 'bezierCurve') {
            editPoints.push(
              {
                ...command.cp1,
                cursor: 'move',
                update(c, { cursor, start, scale }) {
                  if (!isPathContent(c)) {
                    return
                  }
                  const m = c.commands[i]
                  if (m.type !== 'bezierCurve') {
                    return
                  }
                  m.cp1.x += cursor.x - start.x
                  m.cp1.y += cursor.y - start.y
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
                },
              },
              {
                ...command.cp2,
                cursor: 'move',
                update(c, { cursor, start, scale }) {
                  if (!isPathContent(c)) {
                    return
                  }
                  const m = c.commands[i]
                  if (m.type !== 'bezierCurve') {
                    return
                  }
                  m.cp2.x += cursor.x - start.x
                  m.cp2.y += cursor.y - start.y
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
                },
              },
            )
          } else if (command.type === 'quadraticCurve') {
            editPoints.push({
              ...command.cp,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isPathContent(c)) {
                  return
                }
                const m = c.commands[i]
                if (m.type !== 'quadraticCurve') {
                  return
                }
                m.cp.x += cursor.x - start.x
                m.cp.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            })
          }
          if (command.type !== 'close') {
            editPoints.push({
              ...command.to,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isPathContent(c)) {
                  return
                }
                const m = c.commands[i]
                if (m.type === 'close') {
                  return
                }
                m.to.x += cursor.x - start.x
                m.to.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            })
          }
        })
        return {
          editPoints,
        }
      })
    },
    getGeometries: getPathGeometriesFromCache,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        commands: <ctx.ArrayEditor
          inline
          {...ctx.getArrayEditorProps<core.PathCommand, typeof content>(v => v.commands, { type: 'line', to: { x: 0, y: 0 } }, (v) => update(c => { if (isPathContent(c)) { v(c) } }))}
          items={content.commands.map((f, i) => {
            const properties: Record<string, JSX.Element | (JSX.Element | undefined)[]> = {
              type: <ctx.EnumEditor select value={f.type} enums={['move', 'line', 'arc', 'ellipseArc', 'bezierCurve', 'quadraticCurve', 'close'] as const} setValue={(v) => update(c => {
                if (isPathContent(c)) {
                  if (v === 'move' || v === 'line') {
                    c.commands[i] = {
                      type: v,
                      to: { x: 0, y: 0 },
                    }
                  } else if (v === 'arc') {
                    c.commands[i] = {
                      type: v,
                      radius: 10,
                      from: { x: 0, y: 0 },
                      to: { x: 0, y: 0 },
                    }
                  } else if (v === 'ellipseArc') {
                    c.commands[i] = {
                      type: v,
                      rx: 10,
                      ry: 10,
                      angle: 0,
                      sweep: true,
                      largeArc: true,
                      to: { x: 0, y: 0 },
                    }
                  } else if (v === 'bezierCurve') {
                    c.commands[i] = {
                      type: v,
                      cp1: { x: 0, y: 0 },
                      cp2: { x: 0, y: 0 },
                      to: { x: 0, y: 0 },
                    }
                  } else if (v === 'quadraticCurve') {
                    c.commands[i] = {
                      type: v,
                      cp: { x: 0, y: 0 },
                      to: { x: 0, y: 0 },
                    }
                  } else if (v === 'close') {
                    c.commands[i] = {
                      type: v,
                    }
                  }
                }
              })} />
            }
            if (f.type === 'arc') {
              properties.from = <ctx.ObjectEditor inline properties={{
                from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'arc') { m.from.x = p.x; m.from.y = p.y } } }))}>canvas</ctx.Button>,
                x: <ctx.NumberEditor value={f.from.x} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'arc') { m.from.x = v } } })} />,
                y: <ctx.NumberEditor value={f.from.y} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'arc') { m.from.y = v } } })} />,
              }} />
              properties.radius = <ctx.NumberEditor value={f.radius} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'arc') { m.radius = v } } })} />
            } else if (f.type === 'ellipseArc') {
              properties.rx = <ctx.NumberEditor value={f.rx} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'ellipseArc') { m.rx = v } } })} />
              properties.ry = <ctx.NumberEditor value={f.ry} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'ellipseArc') { m.ry = v } } })} />
              properties.angle = <ctx.NumberEditor value={f.angle} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'ellipseArc') { m.angle = v } } })} />
              properties.largeArc = <ctx.BooleanEditor value={f.largeArc} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'ellipseArc') { m.largeArc = v } } })} />
              properties.sweep = <ctx.BooleanEditor value={f.sweep} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'ellipseArc') { m.sweep = v } } })} />
            } else if (f.type === 'bezierCurve') {
              properties.cp1 = <ctx.ObjectEditor inline properties={{
                from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'bezierCurve') { m.cp1.x = p.x; m.cp1.y = p.y } } }))}>canvas</ctx.Button>,
                x: <ctx.NumberEditor value={f.cp1.x} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'bezierCurve') { m.cp1.x = v } } })} />,
                y: <ctx.NumberEditor value={f.cp1.y} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'bezierCurve') { m.cp1.y = v } } })} />,
              }} />
              properties.cp2 = <ctx.ObjectEditor inline properties={{
                from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'bezierCurve') { m.cp2.x = p.x; m.cp2.y = p.y } } }))}>canvas</ctx.Button>,
                x: <ctx.NumberEditor value={f.cp2.x} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'bezierCurve') { m.cp2.x = v } } })} />,
                y: <ctx.NumberEditor value={f.cp2.y} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'bezierCurve') { m.cp2.y = v } } })} />,
              }} />
            } else if (f.type === 'quadraticCurve') {
              properties.cp = <ctx.ObjectEditor inline properties={{
                from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'quadraticCurve') { m.cp.x = p.x; m.cp.y = p.y } } }))}>canvas</ctx.Button>,
                x: <ctx.NumberEditor value={f.cp.x} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'quadraticCurve') { m.cp.x = v } } })} />,
                y: <ctx.NumberEditor value={f.cp.y} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type === 'quadraticCurve') { m.cp.y = v } } })} />,
              }} />
            }
            if (f.type !== 'close') {
              properties.to = <ctx.ObjectEditor inline properties={{
                from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type !== 'close') { m.to.x = p.x; m.to.y = p.y } } }))}>canvas</ctx.Button>,
                x: <ctx.NumberEditor value={f.to.x} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type !== 'close') { m.to.x = v } } })} />,
                y: <ctx.NumberEditor value={f.to.y} setValue={(v) => update(c => { if (isPathContent(c)) { const m = c.commands[i]; if (m.type !== 'close') { m.to.y = v } } })} />,
              }} />
            }
            return <ctx.ObjectEditor inline properties={properties} />
          })}
        />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, PathContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    reverse: (content, contents) => ({
      ...content,
      commands: ctx.geometryLineToPathCommands(ctx.reverseGeometryLines(getPathGeometriesFromCache(content, contents).lines)),
    }),
  }
}

export function isPathContent(content: model.BaseContent): content is PathContent {
  return content.type === 'path'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d=" M 8 8 L 40 7 A 50 50 0 0 1 91 57 Q 91 91, 17 90 C 50 72, 50 31, 8 24 Z" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></path>
    </svg>
  )
  return {
    name: 'create path',
    hotkey: 'P',
    icon,
    useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
      const { path, controlPoint, controlPoint2, preview, onClick, onMove, input, setInputType, cursorPosition, reset } = ctx.usePathClickCreate(
        type === 'create path',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'path',
            strokeStyleId,
            fillStyleId,
            commands: c,
          } as PathContent)
        }),
      )
      const assistentContents: (PathContent | LineContent)[] = []
      if (preview.length > 1) {
        assistentContents.push({
          type: 'path',
          strokeStyleId,
          fillStyleId,
          commands: preview,
        })
      }
      const last = ctx.getPathCommandEndPoint(path, path.length - 1)
      if (last) {
        if (controlPoint) {
          assistentContents.push({ type: 'line', points: [last, controlPoint], dashArray: [4 / scale] })
          if (controlPoint2) {
            assistentContents.push({ type: 'line', points: [controlPoint, controlPoint2], dashArray: [4 / scale] })
            if (cursorPosition) {
              assistentContents.push({ type: 'line', points: [controlPoint2, cursorPosition], dashArray: [4 / scale] })
            }
          } else {
            if (cursorPosition) {
              assistentContents.push({ type: 'line', points: [controlPoint, cursorPosition], dashArray: [4 / scale] })
            }
          }
        } else if (cursorPosition) {
          assistentContents.push({ type: 'line', points: [last, cursorPosition], dashArray: [4 / scale] })
        }
      }
      return {
        onStart: onClick,
        input,
        onMove,
        reset,
        subcommand: type === 'create path'
          ? (
            <span>
              {(['line', 'arc', 'bezierCurve', 'quadraticCurve', 'close'] as const).map(m => <button key={m} onClick={() => setInputType(m)} style={{ position: 'relative' }}>{m}</button>)}
            </span>
          )
          : undefined,
        assistentContents,
      }
    },
    selectCount: 0,
  }
}
