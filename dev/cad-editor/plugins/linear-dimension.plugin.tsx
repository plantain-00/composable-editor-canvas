import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type LinearDimensionContent = model.BaseContent<'linear dimension'> & model.StrokeFields & model.ArrowFields & core.LinearDimension & {
  ref1?: model.PositionRef
  ref2?: model.PositionRef
}

export function getModel(ctx: PluginContext): model.Model<LinearDimensionContent> {
  const LinearDimensionContent = ctx.and(ctx.BaseContent('linear dimension'), ctx.StrokeFields, ctx.ArrowFields, ctx.LinearDimension, {
    ref1: ctx.optional(ctx.PositionRef),
    ref2: ctx.optional(ctx.PositionRef),
  })
  const linearDimensionCache = new ctx.WeakmapCache3<Omit<LinearDimensionContent, "type">, core.Position, core.Position, model.Geometries<{ lines: [core.Position, core.Position][] }>>()
  const getLinearDimensionPositions = (content: Omit<LinearDimensionContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) => {
    const p1 = ctx.getRefPosition(content.ref1, contents) ?? content.p1
    const p2 = ctx.getRefPosition(content.ref2, contents) ?? content.p2
    return { p1, p2 }
  }
  function getLinearDimensionGeometriesFromCache(content: Omit<LinearDimensionContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const { p1, p2 } = getLinearDimensionPositions(content, contents)
    return linearDimensionCache.get(content, p1, p2, () => {
      return ctx.getLinearDimensionGeometries({ ...content, p1, p2 }, {
        arrowAngle: content.arrowAngle ?? ctx.dimensionStyle.arrowAngle,
        arrowSize: content.arrowSize ?? ctx.dimensionStyle.arrowSize,
        margin: ctx.dimensionStyle.margin,
      }, c => getTextPosition(c, contents))
    })
  }
  const textPositionMap = new ctx.WeakmapCache3<Omit<LinearDimensionContent, 'type'>, core.Position, core.Position, {
    textPosition: core.Position
    size?: core.Size
    text: string
    textRotation: number
  }>()
  function getTextPosition(content: Omit<LinearDimensionContent, 'type'>, contents: readonly core.Nullable<model.BaseContent>[]) {
    const { p1, p2 } = getLinearDimensionPositions(content, contents)
    return textPositionMap.get(content, p1, p2, () => {
      return ctx.getLinearDimensionTextPosition({ ...content, p1, p2 }, ctx.dimensionStyle.margin, ctx.getTextSizeFromCache)
    })
  }
  const React = ctx.React
  return {
    type: 'linear dimension',
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      content.p1.x += offset.x
      content.p1.y += offset.y
      content.p2.x += offset.x
      content.p2.y += offset.y
      content.position.x += offset.x
      content.position.y += offset.y
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, contents }) {
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
      const strokeColor = getStrokeColor(strokeStyleContent)
      const strokeWidth = transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content))
      const { regions, lines } = getLinearDimensionGeometriesFromCache(content, contents)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of lines) {
        children.push(target.renderPolyline(line, { strokeColor, strokeWidth, dashArray: strokeStyleContent.dashArray }))
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeWidth: 0, fillColor: strokeColor }))
        }
      }
      const { textPosition, text, textRotation } = getTextPosition(content, contents)
      children.push(target.renderGroup(
        [
          target.renderText(textPosition.x, textPosition.y, text, strokeColor, content.fontSize, content.fontFamily, { cacheKey: content }),
        ],
        {
          rotation: textRotation,
          base: textPosition,
        }
      ))
      return target.renderGroup(children)
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.position.x,
              y: content.position.y,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isLinearDimensionContent(c)) {
                  return
                }
                c.position.x += cursor.x - start.x
                c.position.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            {
              x: content.p1.x,
              y: content.p1.y,
              cursor: 'move',
              update(c, { cursor, start, scale, target }) {
                if (!isLinearDimensionContent(c)) {
                  return
                }
                c.p1.x = cursor.x
                c.p1.y = cursor.y
                c.ref1 = ctx.getSnapTargetRef(target, contents)
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            {
              x: content.p2.x,
              y: content.p2.y,
              cursor: 'move',
              update(c, { cursor, start, scale, target }) {
                if (!isLinearDimensionContent(c)) {
                  return
                }
                c.p2.x = cursor.x
                c.p2.y = cursor.y
                c.ref2 = ctx.getSnapTargetRef(target, contents)
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
          ]
        }
      })
    },
    getGeometries: getLinearDimensionGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        p1: <ctx.ObjectEditor
          inline
          properties={{
            from: <ctx.Button onClick={() => acquirePoint((p, ref) => update(c => { if (isLinearDimensionContent(c)) { c.p1.x = p.x; c.p1.y = p.y; c.ref1 = ref } }))}>canvas</ctx.Button>,
            x: <ctx.NumberEditor value={content.p1.x} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.p1.x = v } })} />,
            y: <ctx.NumberEditor value={content.p1.y} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.p1.y = v } })} />,
          }}
        />,
        p2: <ctx.ObjectEditor
          inline
          properties={{
            from: <ctx.Button onClick={() => acquirePoint((p, ref) => update(c => { if (isLinearDimensionContent(c)) { c.p2.x = p.x; c.p2.y = p.y; c.ref2 = ref } }))}>canvas</ctx.Button>,
            x: <ctx.NumberEditor value={content.p2.x} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.p2.x = v } })} />,
            y: <ctx.NumberEditor value={content.p2.y} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.p2.y = v } })} />,
          }}
        />,
        ref1: [
          <ctx.BooleanEditor value={content.ref1 !== undefined} readOnly={content.ref1 === undefined} setValue={(v) => update(c => { if (isLinearDimensionContent(c) && !v) { c.ref1 = undefined } })} />,
          content.ref1 !== undefined && typeof content.ref1.id === 'number' ? <ctx.NumberEditor value={content.ref1.id} setValue={(v) => update(c => { if (isLinearDimensionContent(c) && c.ref1) { c.ref1.id = v } })} /> : undefined,
          content.ref1 !== undefined ? <ctx.NumberEditor value={content.ref1.snapIndex} setValue={(v) => update(c => { if (isLinearDimensionContent(c) && c.ref1) { c.ref1.snapIndex = v } })} /> : undefined,
          content.ref1?.param !== undefined ? <ctx.NumberEditor readOnly value={content.ref1.param} /> : undefined,
        ],
        ref2: [
          <ctx.BooleanEditor value={content.ref2 !== undefined} readOnly={content.ref2 === undefined} setValue={(v) => update(c => { if (isLinearDimensionContent(c) && !v) { c.ref2 = undefined } })} />,
          content.ref2 !== undefined && typeof content.ref2.id === 'number' ? <ctx.NumberEditor value={content.ref2.id} setValue={(v) => update(c => { if (isLinearDimensionContent(c) && c.ref2) { c.ref2.id = v } })} /> : undefined,
          content.ref2 !== undefined ? <ctx.NumberEditor value={content.ref2.snapIndex} setValue={(v) => update(c => { if (isLinearDimensionContent(c) && c.ref2) { c.ref2.snapIndex = v } })} /> : undefined,
          content.ref2?.param !== undefined ? <ctx.NumberEditor readOnly value={content.ref2.param} /> : undefined,
        ],
        position: <ctx.ObjectEditor
          inline
          properties={{
            from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isLinearDimensionContent(c)) { c.position.x = p.x, c.position.y = p.y } }))}>canvas</ctx.Button>,
            x: <ctx.NumberEditor value={content.position.x} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.position.x = v } })} />,
            y: <ctx.NumberEditor value={content.position.y} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.position.y = v } })} />,
          }}
        />,
        direct: <ctx.BooleanEditor value={content.direct === true} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.direct = v ? true : undefined } })} />,
        text: [
          <ctx.BooleanEditor value={content.text !== undefined} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.text = v ? '' : undefined } })} />,
          content.text !== undefined ? <ctx.StringEditor value={content.text} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.text = v } })} /> : undefined,
        ],
        fontSize: <ctx.NumberEditor value={content.fontSize} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.fontSize = v } })} />,
        fontFamily: <ctx.StringEditor value={content.fontFamily} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.fontFamily = v } })} />,
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, LinearDimensionContent, p),
    getRefIds: (content) => [
      ...ctx.getStrokeRefIds(content),
      ...(content.ref1 && typeof content.ref1.id === 'number' ? [content.ref1.id] : []),
      ...(content.ref2 && typeof content.ref2.id === 'number' ? [content.ref2.id] : []),
    ],
    updateRefId(content, update) {
      if (content.ref1) {
        const newRefId = update(content.ref1.id)
        if (newRefId !== undefined) {
          content.ref1.id = newRefId
        }
      }
      if (content.ref2) {
        const newRefId = update(content.ref2.id)
        if (newRefId !== undefined) {
          content.ref2.id = newRefId
        }
      }
      ctx.updateStrokeRefIds(content, update)
    },
  }
}

export function isLinearDimensionContent(content: model.BaseContent): content is LinearDimensionContent {
  return content.type === 'linear dimension'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="15" cy="83" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="82" cy="84" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <polyline points="15,83 14,7" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="82,84 82,6" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="14,25 81,25" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polygon points="66,34 83,24 65,15" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
      <polygon points="29,34 12,25 29,15" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'create linear dimension',
    selectCount: 0,
    useCommand({ onEnd, type, scale, strokeStyleId }) {
      const [p1, setP1] = React.useState<core.Position>()
      const [p2, setP2] = React.useState<core.Position>()
      const [p1Target, setP1Target] = React.useState<model.SnapTarget>()
      const [p2Target, setP2Target] = React.useState<model.SnapTarget>()
      const [direct, setDirect] = React.useState(false)
      const [result, setResult] = React.useState<LinearDimensionContent>()
      const [text, setText] = React.useState<string>()
      let message = ''
      if (type) {
        message = 'input text'
      }
      const { input, cursorPosition, setCursorPosition, clearText, setInputPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === 'Enter') {
          setText(text)
          if (result) {
            setResult({ ...result, text })
          }
          clearText()
        }
      } : undefined)
      const reset = () => {
        setP1(undefined)
        setP2(undefined)
        setP1Target(undefined)
        setP2Target(undefined)
        setResult(undefined)
        resetInput()
        setText(undefined)
      }
      const assistentContents: (LinearDimensionContent | LineContent)[] = []
      if (result) {
        assistentContents.push(result)
      } else if (p1 && cursorPosition) {
        assistentContents.push({ type: 'line', points: [p1, cursorPosition], dashArray: [4 / scale] })
      }
      return {
        input,
        reset,
        onStart(p, target) {
          if (!p1) {
            setP1(p)
            setP1Target(target)
          } else if (!p2) {
            setP2(p)
            setP2Target(target)
          } else if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push(result)
              },
              nextCommand: type,
            })
            reset()
          }
        },
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p)
          setCursorPosition(p)
          if (type && p1 && p2) {
            setResult({
              type: 'linear dimension',
              position: p,
              p1,
              p2,
              ref1: p1Target,
              ref2: p2Target,
              strokeStyleId,
              direct,
              fontSize: 16,
              fontFamily: 'monospace',
              text,
            })
          }
        },
        subcommand: type
          ? (
            <span>
              <button onClick={() => {
                if (result) {
                  setResult({ ...result, direct: !direct })
                }
                setDirect(!direct)
              }} style={{ position: 'relative' }}>{direct ? 'direct' : 'axis'}</button>
            </span>
          )
          : undefined,
        assistentContents,
        lastPosition: p2 ?? p1,
      }
    },
    icon,
  }
}
