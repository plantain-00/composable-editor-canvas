import type { PluginContext } from './types'
import type { Command } from '../command'
import type * as model from '../model'

export function getCommand(ctx: PluginContext): Command[] {
  function contentSelectable(c: model.BaseContent) {
    return !c.readonly && ctx.isContainerContent(c)
  }
  const React = ctx.React
  const startIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="42,73 42,74 41,75 41,77 41,78 40,79 39,81 39,82 38,83 37,84 36,85 35,86 34,86 32,87 31,88 30,88 28,88 27,89 26,89 24,89 23,88 21,88 20,88 19,87 17,86 16,86 15,85 14,84 13,83 12,82 12,81 11,79 10,78 10,77 10,75 9,74 9,73 9,71 10,70 10,68 10,67 11,66 12,64 12,63 13,62 14,61 15,60 16,59 17,59 19,58 20,57 21,57 23,57 24,56 25,56 27,56 28,57 30,57 31,57 32,58 34,59 35,59 36,60 37,61 38,62 39,63 39,64 40,66 41,67 41,68 41,70 42,71 42,73" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polygon points="12,10 76,10 76,45 12,45" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
      <polygon points="70,93 93,52 46,52" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
    </svg>
  )
  const startCommand: Command = {
    name: 'start edit container',
    icon: startIcon,
    execute({ contents, selected, setEditingContentPath }) {
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          setEditingContentPath(contentSelectable(content) ? [index, 'contents'] : undefined)
        }
      })
    },
    contentSelectable,
    selectCount: 1,
  }
  const cancelIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="37,82 32,77 45,64 34,52 22,65 16,58 4,90" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
      <polygon points="83,40 78,34 65,46 53,35 67,24 61,17 94,8" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
      <polygon points="60,82 66,78 53,64 64,53 76,66 83,60 93,93" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
      <polygon points="17,38 22,32 35,45 46,34 34,23 40,16 7,5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
    </svg>
  )
  const cancelCommand: Command = {
    name: 'cancel edit container',
    execute({ setEditingContentPath }) {
      setEditingContentPath(undefined)
    },
    selectCount: 0,
    icon: cancelIcon,
  }
  return [startCommand, cancelCommand]
}
