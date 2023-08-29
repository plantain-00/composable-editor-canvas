import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export function getCommand(ctx: PluginContext): Command[] {
  const React = ctx.React
  const CopyData: core.Validator = {
    contents: ctx.minItems(0, [{
      id: ctx.number,
      content: ctx.Content,
    }]),
    center: ctx.Position,
  }
  const cutOrCopyCommand: Command = (
    {
      name: 'copy',
      execute({ contents, selected, type }) {
        const ids = new Set<number>()
        contents.forEach((content, index) => {
          if (content && ctx.isSelected([index], selected)) {
            for (const id of iterateRefContents(index, contents, ctx)) {
              ids.add(id)
            }
            if (type === 'cut' && !ctx.contentIsReferenced(content, contents)) {
              contents[index] = undefined
            }
          }
        })
        const copiedContents: CopyData['contents'] = []
        const boundingPoints: core.Position[] = []
        ids.forEach(id => {
          const content = contents[id]
          if (content) {
            const geometries = ctx.getContentModel(content)?.getGeometries?.(content, contents)
            if (geometries?.bounding) {
              boundingPoints.push(geometries.bounding.start, geometries.bounding.end)
            }
            copiedContents.unshift({
              id,
              content,
            })
          }
        })
        const bounding = ctx.getPointsBounding(boundingPoints)
        if (!bounding) {
          return
        }
        const copyData: CopyData = {
          contents: copiedContents,
          center: ctx.getTwoPointCenter(bounding.start, bounding.end),
        }
        navigator.clipboard.writeText(JSON.stringify(copyData))
      },
    }
  )
  return [
    cutOrCopyCommand,
    {
      ...cutOrCopyCommand,
      name: 'cut',
    },
    {
      name: 'paste',
      useCommand({ onEnd, type }) {
        let message = ''
        if (type) {
          message = 'specify target point'
        }
        const [copyData, setCopyData] = React.useState<CopyData>()
        const { input, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message)
        ctx.useValueChanged(type, () => {
          if (type) {
            (async () => {
              try {
                const text = await navigator.clipboard.readText()
                const copyData: CopyData = JSON.parse(text)
                const r = ctx.validate(copyData, CopyData)
                if (r === true) {
                  setCopyData(copyData)
                  return
                } else {
                  console.info(r)
                  reset()
                  onEnd()
                }
              } catch (error) {
                console.info(error)
              }
            })()
          }
        })
        const reset = () => {
          setCopyData(undefined)
          resetInput()
          setCursorPosition(undefined)
          setInputPosition(undefined)
        }

        const assistentContents: model.BaseContent[] = []
        if (cursorPosition && copyData) {
          const offset = {
            x: cursorPosition.x - copyData.center.x,
            y: cursorPosition.y - copyData.center.y,
          }
          copyData.contents.forEach(c => {
            assistentContents.push(ctx.produce(c.content, draft => {
              const model = ctx.getContentModel(draft)
              model?.move?.(draft, offset)
              model?.updateRefId?.(draft, d => {
                if (typeof d === 'number') {
                  const index = copyData.contents.findIndex(c => c.id === d)
                  if (index >= 0 && index < assistentContents.length) {
                    return assistentContents[index]
                  }
                }
                return undefined
              })
            }))
          })
        }

        return {
          onStart(p) {
            resetInput()
            onEnd({
              updateContents: (contents) => {
                if (copyData) {
                  const offset = {
                    x: p.x - copyData.center.x,
                    y: p.y - copyData.center.y,
                  }
                  const idMap: Record<number, number> = {}
                  let id = contents.length
                  copyData.contents.forEach(c => {
                    idMap[c.id] = id++
                  })
                  copyData.contents.forEach(c => {
                    contents.push(ctx.produce(c.content, draft => {
                      const model = ctx.getContentModel(draft)
                      model?.move?.(draft, offset)
                      model?.updateRefId?.(draft, d => typeof d === 'number' ? idMap[d] : undefined)
                    }))
                  })
                }
                reset()
              }
            })
          },
          input,
          onMove(p, viewportPosition) {
            setInputPosition(viewportPosition || p)
            if (!type) {
              return
            }
            setCursorPosition(p)
          },
          assistentContents,
          reset,
        }
      },
      selectCount: 0,
    },
  ]
}

function* iterateRefContents(
  id: number,
  contents: core.Nullable<model.BaseContent>[],
  ctx: PluginContext,
): Generator<number, void, unknown> {
  yield id
  const content = contents[id]
  if (content) {
    const refIds = ctx.getContentModel(content)?.getRefIds?.(content)
    if (refIds) {
      for (const refId of refIds) {
        yield* iterateRefContents(refId, contents, ctx)
      }
    }
  }
}

export interface CopyData {
  contents: {
    id: number
    content: model.BaseContent
  }[]
  center: core.Position
}
