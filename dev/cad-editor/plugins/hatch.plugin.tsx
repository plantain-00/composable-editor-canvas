import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type HatchContent = model.BaseContent<'hatch'> & model.FillFields & {
  border: core.GeometryLine[]
}

export function getModel(ctx: PluginContext): model.Model<HatchContent> {
  const HatchContent = ctx.and(ctx.BaseContent('hatch'), ctx.FillFields, {
    border: [ctx.GeometryLine]
  })
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[] }>>()
  function getHatchGeometries(content: Omit<HatchContent, "type">) {
    return geometriesCache.get(content, () => {
      const points = ctx.getGeometryLinesPoints(content.border)
      return {
        lines: [],
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: [],
        regions: [
          {
            lines: content.border,
            points,
          },
        ],
      }
    })
  }
  return {
    type: 'hatch',
    ...ctx.fillModel,
    render(content, renderCtx) {
      const { options, target } = ctx.getFillRenderOptionsFromRenderContext(content, renderCtx)
      const { points } = getHatchGeometries(content)
      return target.renderPolygon(points, options)
    },
    getGeometries: getHatchGeometries,
    propertyPanel(content, update, contents) {
      return {
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, HatchContent, p),
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
            const bounding = ctx.editingContentsBoundingCache.get(contents, () => {
              const points = ctx.getContentsPoints(contents, contents)
              return ctx.getPointsBoundingUnsafe(points)
            })
            const border = ctx.getHatchByPosition(p, bounding, getContentsInRange, contents)
            if (border) {
              setHatch({
                type: 'hatch',
                border,
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
