import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { ArcContent, CircleContent, isCircleContent } from './circle-arc.plugin'
import { isRectContent } from './rect.plugin'
import { isPolygonContent } from './polygon.plugin'
import { isRegularPolygonContent } from './regular-polygon.plugin'

export type ViewportContent = model.BaseContent<'viewport'> & core.Position & model.StrokeFields & {
  border: model.BaseContent
  scale: number
}

export function getModel(ctx: PluginContext): model.Model<ViewportContent> {
  const ViewportContent = ctx.and(ctx.BaseContent('viewport'), ctx.Position, ctx.StrokeFields, {
    border: ctx.Content,
    scale: ctx.number,
  })
  function getViewportGeometriesFromCache(content: Omit<ViewportContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    return ctx.getContentModel(content.border)?.getGeometries?.(content.border, contents) ?? { lines: [], points: [], renderingLines: [] }
  }
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
          clip: () => {
            const children: ReturnType<typeof renderCtx.target.renderGroup>[] = []
            const sortedContents = ctx.getSortedContents(renderCtx.contents).contents
            sortedContents.forEach((content) => {
              if (!content || content.visible === false || isViewportContent(content)) {
                return
              }
              const ContentRender = ctx.getContentModel(content)?.render
              if (ContentRender) {
                children.push(ContentRender(content, renderCtx))
              }
            })
            return renderCtx.target.renderGroup(children, { matrix: ctx.m3.multiply(ctx.m3.translation(content.x, content.y), ctx.m3.scaling(content.scale, content.scale)) })
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
          editPoints: editPoints.editPoints.map((e, i) => ({
            ...e,
            update(c, props) {
              if (!isViewportContent(c)) {
                return
              }
              if (i === 0) {
                c.x += props.cursor.x - props.start.x
                c.y += props.cursor.y - props.start.y
              }
              return e.update(c.border, props)
            },
          }))
        }
      })
    },
    getGeometries: getViewportGeometriesFromCache,
    propertyPanel(content, update, contents) {
      const border = ctx.getContentModel(content.border)?.propertyPanel?.(content.border, recipe => {
        update(c => {
          if (isViewportContent(c)) {
            recipe(c.border, contents)
          }
        })
      }, contents)
      const result: Record<string, JSX.Element | (JSX.Element | undefined)[]> = {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isViewportContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isViewportContent(c)) { c.y = v } })} />,
        scale: <ctx.NumberEditor value={content.scale} setValue={(v) => update(c => { if (isViewportContent(c)) { c.scale = v } })} />,
      }
      if (border) {
        result.border = <ctx.ObjectEditor properties={border} />
      }
      return {
        ...result,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, ViewportContent, p),
    getRefIds: (content) => ctx.getStrokeRefIds(content),
    updateRefId(content, update) {
      ctx.updateStrokeRefIds(content, update)
    },
  }
}

export function isViewportContent(content: model.BaseContent): content is ViewportContent {
  return content.type === 'viewport'
}

export function getCommand(ctx: PluginContext): Command {
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
    contentSelectable(content: model.BaseContent): content is CircleContent | ArcContent {
      return isRectContent(content) || isCircleContent(content) || isPolygonContent(content) || isRegularPolygonContent(content)
    },
    execute({ contents, selected }) {
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          const borderBounding = ctx.getContentModel(content)?.getGeometries?.(content).bounding
          if (!borderBounding) return
          const viewportWidth = borderBounding.end.x - borderBounding.start.x
          const viewportHeight = borderBounding.end.y - borderBounding.start.y
          const contentsBounding = ctx.getPointsBounding(ctx.getContentsPoints(contents, contents))
          if (!contentsBounding) return
          const contentWidth = contentsBounding.end.x - contentsBounding.start.x
          const contentHeight = contentsBounding.end.y - contentsBounding.start.y
          const xRatio = viewportWidth / contentWidth
          const yRatio = viewportHeight / contentHeight
          let xOffset = 0
          let yOffset = 0
          let ratio: number
          if (xRatio < yRatio) {
            ratio = xRatio
            yOffset = (viewportHeight - ratio * contentHeight) / 2
          } else {
            ratio = yRatio
            xOffset = (viewportWidth - ratio * contentWidth) / 2
          }
          const result: ViewportContent = {
            type: 'viewport',
            border: content,
            x: borderBounding.start.x - contentsBounding.start.x * ratio + xOffset,
            y: borderBounding.start.y - contentsBounding.start.y * ratio + yOffset,
            scale: ratio,
          }
          if (result) {
            contents[index] = result
          }
        }
      })
    },
  }
}
