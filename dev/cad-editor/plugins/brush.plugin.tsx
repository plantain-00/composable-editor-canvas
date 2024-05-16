import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type { HatchContent } from './hatch.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" >
      <path d="m199.04 672.64 193.984 112 224-387.968-193.92-112-224 388.032zm-23.872 60.16 32.896 148.288 144.896-45.696L175.168 732.8zM455.04 229.248l193.92 112 56.704-98.112-193.984-112-56.64 98.112zM104.32 708.8l384-665.024 304.768 175.936L409.152 884.8h.064l-248.448 78.336L104.32 708.8z" fill="currentColor"></path>
      <rect x="600" y="600" width="400" height="400" fill="currentColor"></rect>
    </svg>
  )
  return {
    name: 'brush',
    useCommand({ onEnd, type, fillStyleId }) {
      const [hatch, setHatch] = React.useState<core.Hatch>()
      const [preview, setPreview] = React.useState<core.Hatch>()
      const [inputType, setInputType] = React.useState<'circle' | 'rect'>('circle')
      const assistentContents: HatchContent[] = []
      const reset = () => {
        setHatch(undefined)
        setPreview(undefined)
      }
      if (hatch) {
        assistentContents.push({ type: 'hatch', border: hatch.border, holes: hatch.holes, fillStyleId })
      }
      if (preview) {
        assistentContents.push({ type: 'hatch', border: preview.border, holes: preview.holes, fillStyleId })
      }
      return {
        onMouseDown() {
          if (!type) return
          if (!hatch) {
            setHatch(preview)
          }
        },
        onMove(p) {
          if (!type) return
          let h: core.Hatch
          if (inputType === 'circle') {
            h = { border: [{ type: 'arc', curve: ctx.circleToArc({ x: Math.round(p.x), y: Math.round(p.y), r: 10 }) }], holes: [] }
          } else {
            h = { border: Array.from(ctx.iteratePolygonLines(ctx.getPolygonFromRegion({ x: Math.round(p.x), y: Math.round(p.y), width: 20, height: 20 }))), holes: [] }
          }
          if (hatch) {
            setHatch(ctx.getHatchesUnion(hatch, [h])[0])
          }
          setPreview(h)
        },
        onMouseUp() {
          if (!type) return
          if (hatch) {
            onEnd({
              updateContents: contents => contents.push({ type: 'hatch', border: hatch.border, holes: hatch.holes, fillStyleId } as HatchContent),
            })
            reset()
          }
        },
        assistentContents,
        subcommand: type === 'brush'
          ? (
            <span>
              {(['circle', 'rect'] as const).map(m => <button key={m} onClick={() => setInputType(m)} style={{ position: 'relative' }}>{m}</button>)}
            </span>
          )
          : undefined,
        reset,
      }
    },
    selectCount: 0,
    icon,
  }
}
