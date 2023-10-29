import React from 'react'
import * as opentype from 'opentype.js'
import { bindMultipleRefs, Button, EnumEditor, metaKeyIfMacElseCtrlKey, NumberEditor, ObjectEditor, PathCommand, reactCanvasRenderTarget, ReactRenderTarget, reactSvgRenderTarget, reactWebglRenderTarget, scaleByCursorPosition, StringEditor, useGlobalKeyDown, useWheelScroll, useWheelZoom, useWindowSize } from '../src'
import type { CopyData } from './cad-editor/plugins/copy-paste.plugin'
import { allFonts, opentypeCommandsToPathCommands } from './opentype/utils'

export default () => {
  const size = useWindowSize()
  const width = size.width / 2
  const height = 300
  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>()
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    onChange(oldScale, newScale, cursor) {
      const result = scaleByCursorPosition({ width, height }, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })
  const [fonts, setFonts] = React.useState<Record<string, opentype.Font>>()
  const [text, setText] = React.useState('测试ABC')
  const [fontFamily, setFontFamily] = React.useState(allFonts[0].name)
  const [fontSize, setFontSize] = React.useState(50)
  const [color, setColor] = React.useState(0x000000)
  const [backgroundColor, setBackgroundColor] = React.useState(0xffffff)
  const [xScale, setXScale] = React.useState(1)
  const [yScale, setYScale] = React.useState(1)
  const [commands, setCommands] = React.useState<PathCommand[][]>([])
  const [target, setTarget] = React.useState<ReactRenderTarget<unknown>>(allRenderTargets[0])
  const font = fonts?.[fontFamily]

  React.useEffect(() => {
    const fetchFonts = async () => {
      const result: Record<string, opentype.Font> = {}
      for (const f of allFonts) {
        const res = await fetch(f.url)
        const buffer = await res.arrayBuffer()
        result[f.name] = opentype.parse(buffer)
      }
      setFonts(result)
    }
    fetchFonts()
  }, [])
  useGlobalKeyDown(e => {
    if (e.code === 'Digit0' && !e.shiftKey && metaKeyIfMacElseCtrlKey(e)) {
      setScale(1)
      setX(0)
      setY(0)
      e.preventDefault()
    }
  })

  React.useEffect(() => {
    if (!font) return
    const paths = font.getPaths(text, 0, fontSize, fontSize, { xScale: xScale * fontSize / font.unitsPerEm, yScale: yScale * fontSize / font.unitsPerEm })
    const commands = paths.map(path => opentypeCommandsToPathCommands(path))
    setCommands(commands)
  }, [text, font, fontSize, target, xScale, yScale])

  const children = commands.map(c => target.renderPathCommands(c, { fillColor: color, strokeColor: color })).flat()
  children.push(target.renderText(0, fontSize * 2, text, color, fontSize * Math.max(xScale, yScale), fontFamily))
  return (
    <div style={{ position: 'absolute', inset: '0px' }} ref={bindMultipleRefs(wheelZoomRef, wheelScrollRef)}>
      {target.renderResult(children, width, height, { transform: { x, y, scale }, backgroundColor })}
      <div style={{ display: 'flex', width: `${width}px` }}>
        <ObjectEditor
          inline
          properties={{
            text: <StringEditor value={text} setValue={v => setText(v)} />,
            'font family': <EnumEditor select value={fontFamily} enums={allFonts.map(t => t.name)} setValue={v => setFontFamily(allFonts.find(t => t.name === v)?.name ?? allFonts[0].name)} />,
            'font size': <NumberEditor value={fontSize} setValue={v => setFontSize(v)} />,
            'render target': <EnumEditor select value={target.type} enums={allRenderTargets.map(t => t.type)} setValue={v => setTarget(allRenderTargets.find(t => t.type === v) ?? allRenderTargets[0])} />,
            color: <NumberEditor type='color' value={color} setValue={v => setColor(v)} />,
            'background color': <NumberEditor type='color' value={backgroundColor} setValue={v => setBackgroundColor(v)} />,
            'x scale': <NumberEditor value={xScale} setValue={v => setXScale(v)} />,
            'y scale': <NumberEditor value={yScale} setValue={v => setYScale(v)} />,
            actions: <Button onClick={() => navigator.clipboard.writeText(JSON.stringify({ contents: commands.map((c, i) => ({ id: i, content: { type: 'path', commands: c, strokeColor: color, fillColor: color } })), center: { x: 0, y: 0 } } as CopyData))}>copy as command path</Button>,
          }}
        />
      </div>
    </div>
  )
}

const allRenderTargets: ReactRenderTarget<unknown>[] = [reactCanvasRenderTarget, reactSvgRenderTarget, reactWebglRenderTarget]
