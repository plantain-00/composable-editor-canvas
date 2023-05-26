import type { PluginContext } from './types'
import type { Command } from '../command'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="25,13 7,51 22,90" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="75,13 93,51 78,90" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'export code',
    execute({ contents, selected, width, height, transform }) {
      const result: string[] = []
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected)) {
          const model = ctx.getContentModel(content)
          if (model?.render) {
            const code = model.render(content, {
              target: ctx.codeRenderTarget,
              transformColor: c => c,
              transformStrokeWidth: w => w,
              getFillColor: c => c.fillColor,
              getStrokeColor: c => c.strokeColor ?? (ctx.hasFill(c) ? undefined : ctx.defaultStrokeColor),
              getFillPattern: c => c.fillPattern ? {
                width: c.fillPattern.width,
                height: c.fillPattern.height,
                pattern: () => ctx.codeRenderTarget.renderPath(c.fillPattern?.lines ?? [], {
                  strokeColor: c.fillPattern?.strokeColor ?? ctx.defaultStrokeColor,
                })
              } : undefined,
              contents,
            })
            result.push(code)
          }
        }
      })
      navigator.clipboard.writeText(ctx.codeRenderTarget.renderResult(result, width, height, {
        transform,
      }))
    },
    icon,
  }
}
