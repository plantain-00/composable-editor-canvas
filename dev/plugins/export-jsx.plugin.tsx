import type { PluginContext } from './types'
import type { Command } from '../commands/command'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="25,13 7,51 22,90" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="75,13 93,51 78,90" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="64,15 51,90" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'export jsx',
    execute({ contents, selected }) {
      const result: string[] = []
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected)) {
          const model = ctx.getContentModel(content)
          if (model?.render) {
            const color = ctx.getContentColor(content)
            const svg = ctx.renderToStaticMarkup(model.render({
              content,
              target: ctx.reactSvgRenderTarget,
              color,
              strokeWidth: ctx.getStrokeWidth(content),
              contents,
            })(index, 1, 1))
            let jsx = ''
            for (let j = 0; j < svg.length; j++) {
              const c = svg[j]
              if (c === '-') {
                jsx += svg[j + 1].toUpperCase()
                j++
              } else {
                jsx += c
              }
            }
            jsx = jsx.replaceAll(/[0-9]+\.[0-9]+/g, c => Math.round(+c).toString())
            result.push(jsx.split(ctx.getColorString(color)).join('currentColor'))
          }
        }
      })
      navigator.clipboard.writeText(result.join('\n'))
    },
    icon,
  }
}
