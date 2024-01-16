import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type HatchContent = model.BaseContent<'hatch'> & model.FillFields & {
  border: core.GeometryLine[]
  holes?: core.GeometryLine[][]
  ref?: {
    point: core.Position
    end: core.Position
    ids: (number | model.BaseContent)[]
  }
}

export function getModel(ctx: PluginContext): model.Model<HatchContent> {
  const HatchContent = ctx.and(ctx.BaseContent('hatch'), ctx.FillFields, {
    border: [ctx.GeometryLine],
    holes: ctx.optional([[ctx.GeometryLine]]),
    ref: ctx.optional({
      point: ctx.Position,
      end: ctx.Position,
      ids: [ctx.or(ctx.number, ctx.Content)],
    }),
  })
  const refGeometriesCache = new ctx.WeakmapValuesCache<object, model.BaseContent, model.Geometries<{ border: core.Position[], holes: core.Position[][] }>>()
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ border: core.Position[], holes: core.Position[][] }>>()
  function getHatchGeometries(content: Omit<HatchContent, "type">, contents: readonly core.Nullable<model.BaseContent<string>>[]) {
    const getDefault = (hatch: Omit<HatchContent, "type">) => geometriesCache.get(hatch, () => {
      const points = ctx.getGeometryLinesPoints(hatch.border)
      const holes = (hatch.holes || []).map(h => ctx.getGeometryLinesPoints(h))
      return {
        lines: [],
        border: points,
        holes,
        bounding: ctx.getGeometryLinesBounding(hatch.border),
        renderingLines: [],
        regions: [
          {
            lines: hatch.border,
            points,
            holes,
          },
        ],
      }
    })
    if (content.ref && content.ref.ids.length > 0) {
      const refContents = content.ref.ids.map(id => ctx.getReference(id, contents)).filter((d): d is model.BaseContent => !!d)
      if (refContents.length > 0) {
        const p = content.ref.point
        const end = content.ref.end
        return refGeometriesCache.get(content, refContents, () => {
          const getGeometriesInRange = () => refContents.map(c => ctx.getContentHatchGeometries(c, contents))
          const border = ctx.getHatchByPosition(p, end, getGeometriesInRange)
          if (border) {
            const holes = ctx.getHatchHoles(border.lines, getGeometriesInRange)
            return getDefault({
              border: border.lines,
              holes: holes?.holes,
            })
          }
          return getDefault(content)
        })
      }
    }
    return getDefault(content)
  }
  return {
    type: 'hatch',
    ...ctx.fillModel,
    move(content, offset) {
      if (content.ref) {
        ctx.movePoint(content.ref.point, offset)
        ctx.movePoint(content.ref.end, offset)
      }
      for (const line of content.border) {
        ctx.moveGeometryLine(line, offset)
      }
      if (content.holes) {
        for (const hole of content.holes) {
          for (const line of hole) {
            ctx.moveGeometryLine(line, offset)
          }
        }
      }
    },
    rotate(content, center, angle) {
      if (content.ref) {
        ctx.rotatePoint(content.ref.point, center, angle)
        ctx.rotatePoint(content.ref.end, center, angle)
      }
      for (const line of content.border) {
        ctx.rotateGeometryLine(line, center, angle)
      }
      if (content.holes) {
        for (const hole of content.holes) {
          for (const line of hole) {
            ctx.rotateGeometryLine(line, center, angle)
          }
        }
      }
    },
    mirror(content, line, angle) {
      if (content.ref) {
        ctx.mirrorPoint(content.ref.point, line)
        ctx.mirrorPoint(content.ref.end, line)
      }
      for (const b of content.border) {
        ctx.mirrorGeometryLine(b, line, angle)
      }
      if (content.holes) {
        for (const hole of content.holes) {
          for (const h of hole) {
            ctx.mirrorGeometryLine(h, line, angle)
          }
        }
      }
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getFillRenderOptionsFromRenderContext(content, renderCtx)
      const { border, holes } = getHatchGeometries(content, renderCtx.contents)
      return target.renderPath([border, ...holes], options)
    },
    getGeometries: getHatchGeometries,
    propertyPanel(content, update, contents) {
      return {
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, HatchContent, p),
    getRefIds: (content) => [
      ...ctx.getFillRefIds(content),
      ...(content.ref?.ids || []).filter((d): d is number => typeof d === 'number'),
    ],
    updateRefId(content, update) {
      if (content.ref) {
        for (const [i, id] of content.ref.ids.entries()) {
          const newRefId = update(id)
          if (newRefId !== undefined) {
            content.ref.ids[i] = newRefId
          }
        }
      }
      ctx.updateFillRefIds(content, update)
    },
  }
}

export function isHatchContent(content: model.BaseContent): content is HatchContent {
  return content.type === 'hatch'
}

export function getCommand(ctx: PluginContext): Command[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="1,24 100,24" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="1,72 100,72" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="27,1 27,100" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="75,0 75,100" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <pattern id="1" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M 0 5 L 5 0 M 10 5 L 5 10" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor" fillRule="evenodd"></path></pattern><polygon points="75,43 75,72 27,72 27,24 75,24 75,43" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" fill="url(#1)" stroke="currentColor"></polygon>
    </svg>
  )
  return [
    {
      name: 'create hatch',
      icon,
      useCommand({ onEnd, contents, getContentsInRange }) {
        const [hatch, setHatch] = React.useState<HatchContent>()
        const reset = () => {
          setHatch(undefined)
        }
        return {
          onStart: () => {
            onEnd({
              updateContents: (contents) => {
                if (hatch) {
                  contents.push(hatch)
                }
              }
            })
          },
          onMove(p) {
            if (contents.length === 0) return
            const bounding = ctx.contentsBoundingCache.get(contents, () => {
              const points = ctx.getContentsPoints(contents, contents)
              return ctx.getPointsBoundingUnsafe(points)
            })
            const getGeometriesInRange = (region: core.TwoPointsFormRegion | undefined) => region ? getContentsInRange(region).map(c => ctx.getContentHatchGeometries(c, contents)) : []
            const end = { x: bounding.end.x, y: p.y }
            const border = ctx.getHatchByPosition(p, end, line => getGeometriesInRange(ctx.getGeometryLineBoundingFromCache(line)))
            if (border) {
              const holes = ctx.getHatchHoles(border.lines, getGeometriesInRange)
              setHatch({
                type: 'hatch',
                border: border.lines,
                holes: holes?.holes,
                ref: {
                  point: p,
                  end,
                  ids: [...border.ids, ...(holes?.ids || [])],
                },
              })
            } else {
              setHatch(undefined)
            }
          },
          assistentContents: hatch ? [hatch] : undefined,
          reset,
        }
      },
      selectCount: 0,
    },
  ]
}
