import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type PathArrayContent = model.BaseContent<'path array'> & model.ContainerFields & {
  path: model.PartRef
  length: number
  aligned?: boolean
}

export function getModel(ctx: PluginContext): model.Model<PathArrayContent> {
  const PathArrayContent = ctx.and(ctx.BaseContent('path array'), ctx.ContainerFields, {
    path: ctx.PartRef,
    length: ctx.number,
    aligned: ctx.optional(ctx.boolean),
  })
  const allContentsCache = new ctx.WeakmapCache2<object, model.BaseContent, core.Nullable<model.BaseContent>[]>()
  const getAllContentsFromCache = (content: Omit<PathArrayContent, 'type'>, contents: readonly core.Nullable<model.BaseContent<string>>[]) => {
    const path = ctx.getRefPart(content.path, contents)
    if (!path) return []
    return allContentsCache.get(content, path, () => {
      const lines = ctx.getContentModel(path)?.getGeometries?.(path, contents).lines
      if (!lines) return []

      const boundings: core.TwoPointsFormRegion[] = []
      for (const child of content.contents) {
        if (child) {
          const geometries = ctx.getContentModel(child)?.getGeometries?.(child, contents)
          if (geometries?.bounding) {
            boundings.push(geometries.bounding)
          }
        }
      }
      const bounding = ctx.mergeBoundings(boundings)
      const center = ctx.getTwoPointCenter(bounding.start, bounding.end)

      const result: core.Nullable<model.BaseContent>[] = []
      const lengths = lines.map(line => ctx.getGeometryLineLength(line) || 0)
      const totalLength = lengths.reduce((p, c) => p + c, 0)
      for (let length = 0; length <= totalLength; length += content.length) {
        const r = ctx.getGeometryLinesPointAndTangentRadianByLength(lines, length)
        if (r) {
          result.push(...content.contents.map(child => {
            if (!child) return
            const model = ctx.getContentModel(child)
            if (!model) return
            const bounding = model.getGeometries?.(child, contents)?.bounding
            if (!bounding) return
            const move = model.move
            if (!move) return
            return ctx.produce(child, draft => {
              move(draft, { x: -center.x + r.point.x, y: -center.y + r.point.y })
              if (content.aligned) {
                model.rotate?.(draft, r.point, ctx.radianToAngle(r.radian), contents)
              }
            })
          }))
        }
      }
      return result
    })
  }
  const getGeometries = (content: Omit<PathArrayContent, "type">, contents: readonly core.Nullable<model.BaseContent<string>>[]) => ctx.getContentsGeometries(content, c => getAllContentsFromCache(c, contents))
  const React = ctx.React
  return {
    type: 'path array',
    ...ctx.containerModel,
    move: ctx.getContainerMove,
    rotate: ctx.getContainerRotate,
    explode(content, contents) {
      return ctx.getContentsExplode(getAllContentsFromCache(content, contents))
    },
    break(content, points, contents) {
      return ctx.getContentsBreak(getAllContentsFromCache(content, contents), points, contents)
    },
    render(content, renderCtx) {
      return renderCtx.target.renderGroup(ctx.renderContainerChildren({ contents: getAllContentsFromCache(content, renderCtx.contents), variableValues: content.variableValues }, renderCtx))
    },
    getSnapPoints(content, contents) {
      return ctx.getContentsSnapPoints(content, contents, c => getAllContentsFromCache(c, contents))
    },
    getGeometries,
    propertyPanel(content, update, contents, { acquireContent }) {
      return {
        path: [
          <ctx.Button onClick={() => acquireContent({ count: 1, selectable: (v) => pathContentSelectable(ctx, ctx.getContentByIndex(contents, v), contents) }, r => update(c => { if (isPathArrayContent(c)) { c.path = r[0] } }))}>select</ctx.Button>,
          typeof content.path.id === 'number' ? <ctx.NumberEditor value={content.path.id} setValue={(v) => update(c => { if (isPathArrayContent(c)) { c.path.id = v } })} /> : undefined,
        ],
        length: <ctx.NumberEditor value={content.length} setValue={(v) => update(c => { if (isPathArrayContent(c)) { c.length = v } })} />,
        aligned: <ctx.BooleanEditor value={content.aligned === true} setValue={(v) => update(c => { if (isPathArrayContent(c)) { c.aligned = v ? true : undefined } })} />,
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update),
      }
    },
    getRefIds: (content) => typeof content.path === 'number' ? [content.path] : [],
    updateRefId(content, update) {
      if (content.path) {
        const newRefId = update(content.path.id)
        if (newRefId !== undefined) {
          content.path.id = newRefId
        }
      }
    },
    isValid: (c, p) => ctx.validate(c, PathArrayContent, p),
  }
}

export function isPathArrayContent(content: model.BaseContent): content is PathArrayContent {
  return content.type === 'path array'
}

function pathContentSelectable(ctx: PluginContext, content: core.Nullable<model.BaseContent>, contents: readonly core.Nullable<model.BaseContent<string>>[]): boolean {
  if (!content) return false
  const geometries = ctx.getContentModel(content)?.getGeometries?.(content, contents)
  if (!geometries) return false
  return geometries.lines.length > 0
}

export function getCommand(ctx: PluginContext): Command {
  function contentSelectable(content: model.BaseContent, contents: core.Nullable<model.BaseContent>[]) {
    return ctx.contentIsDeletable(content, contents)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="11,89 92,8" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <circle cx="11" cy="89" r="12" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <circle cx="36" cy="64" r="12" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <circle cx="61" cy="39" r="12" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <circle cx="86" cy="14" r="12" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
    </svg>
  )
  return {
    name: 'create path array',
    useCommand({ type, onEnd, acquireContent, selected, contents }) {
      const target = React.useRef<core.ContentPath[]>()
      const path = React.useRef<model.PartRef>()
      const reset = () => {
        target.current = undefined
        path.current = undefined
      }
      React.useEffect(() => {
        if (!type) return
        if (!target.current) {
          target.current = selected.map(s => s.path)
          acquireContent(
            {
              count: 1,
              selectable: (v) => {
                const content = ctx.getContentByIndex(contents, v)
                if (!content) return false
                return pathContentSelectable(ctx, content, contents)
              }
            },
            r => {
              path.current = r[0]
            },
          )
        } else if (path.current) {
          const children = target.current.map(c => contents[c[0]])
          const bounding = ctx.getContentsBounding(children)
          if (bounding) {
            const length = ctx.getTwoPointsDistance(bounding.start, bounding.end)
            onEnd({
              updateContents(contents) {
                if (target.current && path.current) {
                  contents.push({
                    type: 'path array',
                    contents: children,
                    path: path.current,
                    length,
                  } as PathArrayContent)
                  for (const c of target.current) {
                    contents[c[0]] = undefined
                  }
                }
              },
            })
          }

          reset()
        }
      }, [type])
      return {
        onStart() { },
        reset,
      }
    },
    contentSelectable,
    icon,
  }
}
