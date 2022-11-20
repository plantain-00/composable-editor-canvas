import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
      <path fill="currentColor" d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L489.3 358.2l90.5-90.5c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114l-96 96-31.9-25C430.9 239.6 420.1 175.1 377 132c-52.2-52.3-134.5-56.2-191.3-11.7L38.8 5.1zM239 162c30.1-14.9 67.7-9.9 92.8 15.3c20 20 27.5 48.3 21.7 74.5L239 162zM406.6 416.4L220.9 270c-2.1 39.8 12.2 80.1 42.2 110c38.9 38.9 94.4 51 143.6 36.3zm-290-228.5L60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5l61.8-61.8-50.6-39.9z" />
    </svg>
  )
  return {
    name: 'break',
    execute({ contents, selected }) {
      const newContents: model.BaseContent<string>[] = []
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          let intersectionPoints: core.Position[] = []
          for (let i = 0; i < contents.length; i++) {
            const c = contents[i]
            if (c && i !== index) {
              const p = i < index ? [c, content] as const : [content, c] as const
              intersectionPoints.push(...ctx.getIntersectionPoints(...p, contents))
            }
          }
          intersectionPoints = ctx.deduplicatePosition(intersectionPoints)
          if (intersectionPoints.length > 0) {
            const result = ctx.getContentModel(content)?.break?.(content, intersectionPoints)
            if (result) {
              newContents.push(...result)
              contents[index] = undefined
            }
          }
        }
      })
      contents.push(...newContents)
    },
    contentSelectable(content, contents) {
      const model = ctx.getContentModel(content)
      return model?.break !== undefined && !ctx.contentIsReferenced(content, contents)
    },
    hotkey: 'BR',
    icon,
  }
}
