import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" >
      <path d="M567.1 512l318.5-319.3c5-5 1.5-13.7-5.6-13.7h-90.5c-2.1 0-4.2.8-5.6 2.3l-273.3 274-90.2-90.5c12.5-22.1 19.7-47.6 19.7-74.8 0-83.9-68.1-152-152-152s-152 68.1-152 152 68.1 152 152 152c27.7 0 53.6-7.4 75.9-20.3l90 90.3-90.1 90.3A151.04 151.04 0 00288 582c-83.9 0-152 68.1-152 152s68.1 152 152 152 152-68.1 152-152c0-27.2-7.2-52.7-19.7-74.8l90.2-90.5 273.3 274c1.5 1.5 3.5 2.3 5.6 2.3H880c7.1 0 10.7-8.6 5.6-13.7L567.1 512zM288 370c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80zm0 444c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path>
    </svg>
  )
  return {
    name: 'trim',
    useCommand({ onEnd, type, selected, backgroundColor, contents }) {
      const [candidates, setCandidates] = React.useState<{ content: model.BaseContent, children: model.BaseContent[] }[]>([])
      const [current, setCurrent] = React.useState<{ content: model.BaseContent, parent: model.BaseContent }>()
      const { state, setState, resetHistory, undo, redo } = ctx.useUndoRedo<{ content: model.BaseContent, children: model.BaseContent[] }[]>([])

      React.useEffect(() => {
        if (type) {
          const allContents: { content: model.BaseContent, children: model.BaseContent[] }[] = []
          for (let i = 0; i < selected.length; i++) {
            const content = selected[i].content
            let intersectionPoints: core.Position[] = []
            for (let j = 0; j < selected.length; j++) {
              const c = selected[j].content
              if (c && i !== j) {
                const p = i < j ? [c, content] as const : [content, c] as const
                intersectionPoints.push(...ctx.getIntersectionPoints(...p, contents))
              }
            }
            intersectionPoints = ctx.deduplicatePosition(intersectionPoints)
            if (intersectionPoints.length > 0) {
              const result = ctx.getContentModel(content)?.break?.(content, intersectionPoints, contents)
              if (result) {
                allContents.push({ content, children: result })
              }
            }
          }
          setCandidates(allContents)
        }
      }, [type])

      const assistentContents: (model.BaseContent & model.StrokeFields)[] = []
      if (current && ctx.isStrokeContent(current.content)) {
        assistentContents.push({
          ...current.content,
          strokeWidth: (current.content.strokeWidth ?? ctx.getDefaultStrokeWidth(current.content)) + 2,
          strokeColor: backgroundColor,
          trueStrokeColor: true,
        })
      }
      for (const { children } of state) {
        for (const child of children) {
          if (ctx.isStrokeContent(child)) {
            assistentContents.push({
              ...child,
              strokeWidth: (child.strokeWidth ?? ctx.getDefaultStrokeWidth(child)) + 2,
              strokeColor: backgroundColor,
              trueStrokeColor: true,
            })
          }
        }
      }
      const reset = () => {
        setCandidates([])
        setCurrent(undefined)
        resetHistory()
      }
      ctx.useKey((e) => e.key === 'Escape', reset, [setCandidates, setCurrent, resetHistory])
      ctx.useKey((k) => k.code === 'KeyZ' && !k.shiftKey && ctx.metaKeyIfMacElseCtrlKey(k), undo)
      ctx.useKey((k) => k.code === 'KeyZ' && k.shiftKey && ctx.metaKeyIfMacElseCtrlKey(k), redo)
      ctx.useKey((e) => e.key === 'Enter', () => {
        if (!type) return
        const removedIndexes: number[] = []
        const newContents: model.BaseContent[] = []
        for (const { content, children } of state) {
          const parentModel = ctx.getContentModel(content)
          if (parentModel?.break) {
            let points: core.Position[] = []
            for (const child of children) {
              const model = ctx.getContentModel(child)
              if (model?.getStartPoint && model.getEndPoint) {
                points.push(model.getStartPoint(child), model.getEndPoint(child))
              }
            }
            points = ctx.deduplicatePosition(points)
            const r = parentModel.break(content, points, contents)
            if (r) {
              removedIndexes.push(ctx.getContentIndex(content, contents))
              newContents.push(...r.filter(c => children.every(f => !ctx.deepEquals(f, c))))
            }
          }
        }
        onEnd({
          updateContents: (contents) => {
            for (const index of removedIndexes) {
              contents[index] = undefined
            }
            contents.push(...newContents)
          },
        })
        reset()
      }, [reset, type])

      return {
        onStart() {
          if (current) {
            const index = state.findIndex(s => s.content === current.parent)
            setState(draft => {
              if (index >= 0) {
                draft[index].children.push(current.content)
              } else {
                draft.push({ content: current.parent, children: [current.content] })
              }
            })
          }
        },
        onMove(p) {
          for (const candidate of candidates) {
            for (const child of candidate.children) {
              const geometries = ctx.getContentModel(child)?.getGeometries?.(child, contents)
              if (geometries) {
                for (const line of geometries.lines) {
                  if (ctx.getPointAndLineSegmentMinimumDistance(p, line[0], line[1]) < 5) {
                    setCurrent({ content: child, parent: candidate.content })
                    return
                  }
                }
              }
            }
          }
          setCurrent(undefined)
        },
        assistentContents,
        reset,
      }
    },
    contentSelectable(content, contents) {
      const model = ctx.getContentModel(content)
      return model?.break !== undefined && !ctx.contentIsReferenced(content, contents)
    },
    hotkey: 'TR',
    icon,
  }
}
