import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export function getModel(ctx: PluginContext): model.Model<model.ViewportContent> {
  function getViewportGeometriesFromCache(content: Omit<model.ViewportContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]): model.Geometries {
    const geometries = ctx.getContentModel(content.border)?.getGeometries?.(content.border, contents)
    if (geometries) {
      return {
        ...geometries,
        regions: [{
          points: [],
          lines: [],
        }],
      }
    }
    return { lines: [], renderingLines: [] }
  }
  const renderCache = new ctx.WeakmapMapCache<readonly core.Nullable<model.BaseContent>[], string, unknown[]>()
  const React = ctx.React
  return {
    type: 'viewport',
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      ctx.getContentModel(content.border)?.move?.(content.border, offset)
      content.x += offset.x
      content.y += offset.y
    },
    rotate(content, center, angle, contents) {
      ctx.getContentModel(content.border)?.rotate?.(content.border, center, angle, contents)
    },
    mirror(content, line, angle, contents) {
      ctx.getContentModel(content.border)?.mirror?.(content.border, line, angle, contents)
    },
    render(content, renderCtx) {
      const render = ctx.getContentModel(content.border)?.render
      if (render) {
        return render(content.border, {
          ...renderCtx,
          clip: renderCtx.isHoveringOrSelected ? undefined : () => {
            const sortedContents = ctx.getSortedContents(renderCtx.contents).contents
            // type-coverage:ignore-next-line
            const children = renderCache.get(sortedContents, renderCtx.target.type, () => {
              const children: ReturnType<typeof renderCtx.target.renderGroup>[] = []
              sortedContents.forEach((content) => {
                if (!content || content.visible === false || ctx.isViewportContent(content)) {
                  return
                }
                const ContentRender = ctx.getContentModel(content)?.render
                if (ContentRender) {
                  children.push(ContentRender(content, renderCtx))
                }
              })
              return children
            }) as ReturnType<typeof renderCtx.target.renderGroup>[]
            return renderCtx.target.renderGroup(children, { matrix: ctx.getViewportMatrix(content) })
          }
        })
      }
      return renderCtx.target.renderEmpty()
    },
    getEditPoints(content, contents) {
      const editPoints = ctx.getContentModel(content.border)?.getEditPoints?.(content.border, contents)
      if (!editPoints) return
      return ctx.getEditPointsFromCache(content, () => {
        return {
          ...editPoints,
          editPoints: editPoints.editPoints.map(e => ({
            ...e,
            update(c, props) {
              if (!ctx.isViewportContent(c)) {
                return
              }
              if (e.type === 'move') {
                c.x += props.cursor.x - props.start.x
                c.y += props.cursor.y - props.start.y
              }
              return e.update?.(c.border, props)
            },
          }))
        }
      })
    },
    getGeometries: getViewportGeometriesFromCache,
    propertyPanel(content, update, contents, options) {
      const border = ctx.getContentModel(content.border)?.propertyPanel?.(content.border, recipe => {
        update(c => {
          if (ctx.isViewportContent(c)) {
            recipe(c.border, contents)
          }
        })
      }, contents, options)
      const result: Record<string, JSX.Element | (JSX.Element | undefined)[]> = {
        from: <ctx.Button onClick={() => options.acquirePoint(p => update(c => { if (ctx.isViewportContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (ctx.isViewportContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (ctx.isViewportContent(c)) { c.y = v } })} />,
        scale: <ctx.NumberEditor value={content.scale} setValue={(v) => update(c => { if (ctx.isViewportContent(c)) { c.scale = v } })} />,
      }
      if (border) {
        result.border = <ctx.ObjectEditor properties={border} />
      }
      return {
        ...result,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, ctx.ViewportContent, p),
    getRefIds: (content) => ctx.getStrokeRefIds(content),
    updateRefId(content, update) {
      ctx.updateStrokeRefIds(content, update)
    },
  }
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="14" y="18" width="71" height="71" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
      <g transform=""><polyline points="47,55 78,24" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="85,18 70,43 59,32" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline></g>
      <g transform=""><polyline points="47,55 20,82" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="14,89 29,62 40,73" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline></g>
      <g transform=""><polyline points="47,54 78,82" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="85,89 58,75 69,63" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline></g>
      <g transform=""><polyline points="47,55 20,25" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="14,18 39,34 27,44" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline></g>
    </svg>
  )
  return {
    name: 'create viewport',
    selectCount: 1,
    icon,
    contentSelectable(content: model.BaseContent) {
      return ctx.getContentModel(content)?.isPointIn !== undefined
    },
    execute({ contents, selected }) {
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          const viewport = ctx.getDefaultViewport(content, contents)
          if (!viewport) return
          const result: model.ViewportContent = {
            type: 'viewport',
            border: content,
            ...viewport,
          }
          if (result) {
            contents[index] = result
          }
        }
      })
    },
  }
}
