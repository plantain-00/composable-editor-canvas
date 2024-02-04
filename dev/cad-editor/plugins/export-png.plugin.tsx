import type { PluginContext } from './types'
import type { Command } from '../command'
import type * as model from '../model'
import type * as core from '../../../src'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="51,0 51,60" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="51,60 83,28" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="51,60 21,31" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="11,84 91,84" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'export png',
    execute({ state, selected }) {
      const draws: core.CanvasDraw[] = []
      const targets: model.BaseContent[] = []
      state.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected)) {
          const model = ctx.getContentModel(content)
          if (model?.render) {
            targets.push(content)
            draws.push(model.render(content, {
              target: ctx.reactCanvasRenderTarget,
              transformColor: c => c,
              transformStrokeWidth: w => w,
              getFillColor: c => c.fillColor,
              getStrokeColor: c => c.strokeColor ?? (ctx.hasFill(c) ? undefined : ctx.defaultStrokeColor),
              getFillPattern: c => c.fillPattern ? {
                width: c.fillPattern.width,
                height: c.fillPattern.height,
                pattern: () => ctx.reactCanvasRenderTarget.renderPath(c.fillPattern?.lines ?? [], {
                  strokeColor: c.fillPattern?.strokeColor ?? ctx.defaultStrokeColor,
                })
              } : undefined,
              contents: state,
            }))
          }
        }
      })
      const width = window.innerWidth, height = window.innerHeight
      const transform = ctx.zoomContentsToFit(width, height, targets, state, 0.8)
      if (!transform) return
      const container = document.createElement('div')
      ctx.createRoot(container).render(<ctx.CanvasDrawCanvas width={width} height={height} draws={draws} transform={transform} onRender={() => {
        const child = container.children.item(0)
        if (child && child instanceof HTMLCanvasElement) {
          child.toBlob(blob => {
            if (blob) {
              navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
            }
          })
        }
      }} />)
    },
    icon,
  }
}
