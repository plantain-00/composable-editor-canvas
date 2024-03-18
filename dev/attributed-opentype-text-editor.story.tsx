import React from "react"
import { Align, AttributedText, BooleanEditor, Button, EnumEditor, MapCache4, NumberEditor, ObjectEditor, PathCommand, StringEditor, VerticalAlign, aligns, boldGeometryLines, geometryLineToPathCommands, pathCommandsToGeometryLines, reactSvgRenderTarget, useAttributedTextEditor, useWindowSize, verticalAligns } from "../src"
import * as opentype from 'opentype.js'
import { allFonts, opentypeCommandsToPathCommands } from "./opentype/utils"
import { CopyData } from "./cad-editor/plugins/copy-paste.plugin"
// import SanJiKaiShu from './vender/SanJiKaiShu-2.ttf'
// allFonts[0].url = SanJiKaiShu

export default () => {
  type Attribute = Partial<{ color: number, fontSize: number, backgroundColor: number, underline: boolean, passThrough: boolean, script?: 'sub' | 'sup', circle?: boolean, stackText?: string, bold?: boolean, italic?: boolean, opacity?: number }>
  const size = useWindowSize()
  const width = size.width / 2 - 30
  const [font, setFont] = React.useState<opentype.Font>()
  const cache = React.useRef(new MapCache4<boolean, boolean, number, string, { commands: PathCommand[], x1: number, y1: number, width: number }>())
  const getTextLayout = (text: string, fontSize: number, italic = false, bold = false) => {
    if (!font || !text) return
    return cache.current.get(italic, bold, fontSize, text, () => {
      const path = font.getPath(text, 0, fontSize, fontSize, { xScale: fontSize / font.unitsPerEm, yScale: fontSize / font.unitsPerEm })
      const glyph = font.charToGlyph(text)
      const box = glyph.getBoundingBox()
      const advanceWidth = glyph.advanceWidth || 0
      const width = box.x2 - box.x1
      let commands = opentypeCommandsToPathCommands(path, italic ? fontSize * 0.7 : undefined)
      if (bold && commands.length > 0) {
        commands = boldGeometryLines(pathCommandsToGeometryLines(commands)).map(lines => geometryLineToPathCommands(lines)).flat()
      }
      return {
        commands,
        x1: (advanceWidth > width ? 0 : box.x1) / font.unitsPerEm * fontSize,
        y1: (glyph.unicode && glyph.unicode < 256 ? 0 : box.y1) / font.unitsPerEm * fontSize,
        width: Math.max(advanceWidth, width) / font.unitsPerEm * fontSize,
      }
    })
  }
  const [state, setState] = React.useState<AttributedText<Attribute>[]>([{ insert: '我们出' }, { insert: '去吧', attributes: { stackText: 'ab' } }, { insert: 'Aag jioIb BD', attributes: { color: 0xff0000 } }])
  const [align, setAlign] = React.useState<Align>('left')
  const [verticalAlign, setVerticalAlign] = React.useState<VerticalAlign>('top')
  const [strokeOnly, setStrokeOnly] = React.useState(false)
  const getColor = (content: AttributedText<Attribute>) => content?.attributes?.color ?? 0x000000
  const getOpacity = (content: AttributedText<Attribute>) => content?.attributes?.opacity ?? 1
  const getFontSize = (content?: AttributedText<Attribute>) => content?.attributes?.fontSize ?? 50
  const getComputedFontSize = (content?: AttributedText<Attribute>) => getFontSize(content) * (content?.attributes?.script || content?.attributes?.stackText ? 0.7 : 1)
  const getBackgroundColor = (content?: AttributedText<Attribute>) => content?.attributes?.backgroundColor ?? 0xffffff
  const getUnderline = (content?: AttributedText<Attribute>) => content?.attributes?.underline ?? false
  const getPassThrough = (content?: AttributedText<Attribute>) => content?.attributes?.passThrough ?? false
  const getBold = (content?: AttributedText<Attribute>) => content?.attributes?.bold ?? false
  const getItalic = (content?: AttributedText<Attribute>) => content?.attributes?.italic ?? false
  const getScript = (content?: AttributedText<Attribute>) => content?.attributes?.script
  const getCircle = (content?: AttributedText<Attribute>) => content?.attributes?.circle ?? false
  const getStackText = (content?: AttributedText<Attribute>) => content?.attributes?.stackText ?? ''
  const getLineHeight = (content: AttributedText<Attribute>) => getComputedFontSize(content) * 1.5
  const getWidth = (content: AttributedText<Attribute>) => {
    const fontSize = getComputedFontSize(content)
    if (content.attributes?.stackText) {
      const width = content.insert.split('').reduce((p, c) => p + (getTextLayout(c, fontSize)?.width ?? 0), 0)
      const stackWidth = content.attributes.stackText.split('').reduce((p, c) => p + (getTextLayout(c, fontSize)?.width ?? 0), 0)
      return Math.max(stackWidth, width)
    }
    return getTextLayout(content.insert, fontSize)?.width ?? 0
  }
  const getComputedWidth = (content: AttributedText<Attribute>) => getCircle(content) ? getLineHeight(content) : getWidth(content)
  const getReadonlyType = (attributes?: Attribute) => attributes?.stackText ? true : undefined
  const { renderEditor, layoutResult, lineHeights, isSelected, actualHeight, cursorContent, setSelectedAttributes } = useAttributedTextEditor<Attribute>({
    state,
    setState,
    width,
    height: 200,
    lineHeight: getLineHeight,
    getWidth: getComputedWidth,
    getReadonlyType,
    align,
    verticalAlign,
  })

  React.useEffect(() => {
    const fetchFont = async () => {
      const res = await fetch(allFonts[0].url)
      const buffer = await res.arrayBuffer()
      setFont(opentype.parse(buffer))
    }
    fetchFont()
  }, [])

  const target = reactSvgRenderTarget
  const children: ReturnType<typeof target.renderGroup>[] = []
  const commands: PathCommand[][] = []
  for (const { x, y, i, content, visible, row } of layoutResult) {
    if (!visible) continue
    const width = getComputedWidth(content)
    const lineHeight = lineHeights[row]
    const selected = isSelected(i)
    if (selected) {
      children.push(target.renderRect(x, y, width, lineHeight, { fillColor: 0xB3D6FD, strokeWidth: 0 }))
    }
    const fontSize = getComputedFontSize(content)
    const italic = getItalic(content)
    const bold = getBold(content)
    const layout = getTextLayout(content.insert, fontSize, italic, bold)
    if (layout) {
      const color = getColor(content)
      const opacity = getOpacity(content)
      const backgroundColor = getBackgroundColor(content)
      if (!selected && backgroundColor !== 0xffffff) {
        children.push(target.renderRect(x, y, width, lineHeight, { fillColor: backgroundColor, strokeWidth: 0 }))
      }
      if (getUnderline(content)) {
        children.push(target.renderPolyline([{ x, y: y + lineHeight }, { x: x + width, y: y + lineHeight }], { strokeColor: color, strokeOpacity: opacity }))
      }
      if (getPassThrough(content)) {
        children.push(target.renderPolyline([{ x, y: y + lineHeight / 2 }, { x: x + width, y: y + lineHeight / 2 }], { strokeColor: color, strokeOpacity: opacity }))
      }
      const pos = {
        x: x - layout.x1,
        y: y + layout.y1 + (lineHeight - getLineHeight(content)),
      }
      const script = getScript(content)
      const stackText = getStackText(content)
      if (script === 'sub') {
        pos.y += fontSize * 0.2
      } else if (script === 'sup' || stackText) {
        pos.y -= fontSize * 0.7
      }
      if (stackText) {
        const textWidth = content.insert.split('').reduce((p, c) => p + (getTextLayout(c, fontSize)?.width ?? 0), 0)
        pos.x += (width - textWidth) / 2
      }
      if (getCircle(content)) {
        pos.x += (lineHeight - getWidth(content)) / 2
        children.push(target.renderCircle(x + width / 2, y + lineHeight / 2, lineHeight / 2, { strokeColor: color, strokeOpacity: opacity }))
      }
      const style = strokeOnly ? { strokeColor: color, strokeOpacity: opacity, strokeWidth: 1 } : { fillColor: color, fillOpacity: opacity, strokeWidth: 0 }
      children.push(target.renderGroup([target.renderPathCommands(layout.commands, style)], { translate: pos }))
      if (selected) {
        commands.push(layout.commands)
      }
      if (stackText) {
        const stackWidth = stackText.split('').reduce((p, c) => p + (getTextLayout(c, fontSize)?.width ?? 0), 0)
        let xOffset = 0
        for (const char of stackText.split('')) {
          const stackLayout = getTextLayout(char, fontSize, italic, bold)
          if (stackLayout) {
            const stackPos = {
              x: x - stackLayout.x1 + (width - stackWidth) / 2 + xOffset,
              y: y + stackLayout.y1 + (lineHeight - getLineHeight(content)) + fontSize * 0.2,
            }
            xOffset += stackLayout.width
            children.push(target.renderGroup([target.renderPathCommands(stackLayout.commands, style)], { translate: stackPos }))
          }
        }
      }
    }
  }
  const result = target.renderResult(children, width, actualHeight)
  return (
    <>
      {renderEditor(result)}
      <EnumEditor enums={aligns} value={align} setValue={setAlign} />
      <EnumEditor enums={verticalAligns} value={verticalAlign} setValue={setVerticalAlign} />
      <ObjectEditor
        inline
        properties={{
          color: <NumberEditor type="color" value={getColor(cursorContent)} setValue={v => setSelectedAttributes({ color: v })} />,
          opacity: <NumberEditor value={getOpacity(cursorContent)} setValue={v => setSelectedAttributes({ opacity: v })} />,
          fontSize: <NumberEditor value={getFontSize(cursorContent)} setValue={v => setSelectedAttributes({ fontSize: v })} />,
          backgroundColor: <NumberEditor type="color" value={getBackgroundColor(cursorContent)} setValue={v => setSelectedAttributes({ backgroundColor: v === 0xffffff ? undefined : v })} />,
          underline: <BooleanEditor value={getUnderline(cursorContent)} setValue={v => setSelectedAttributes({ underline: v ? true : undefined })} />,
          passThrough: <BooleanEditor value={getPassThrough(cursorContent)} setValue={v => setSelectedAttributes({ passThrough: v ? true : undefined })} />,
          bold: <BooleanEditor value={getBold(cursorContent)} setValue={v => setSelectedAttributes({ bold: v ? true : undefined })} />,
          italic: <BooleanEditor value={getItalic(cursorContent)} setValue={v => setSelectedAttributes({ italic: v ? true : undefined })} />,
          strokeOnly: <BooleanEditor value={strokeOnly} setValue={v => setStrokeOnly(v)} />,
          sub: <BooleanEditor value={getScript(cursorContent) === 'sub'} setValue={v => setSelectedAttributes({ script: v ? 'sub' : undefined })} />,
          sup: <BooleanEditor value={getScript(cursorContent) === 'sup'} setValue={v => setSelectedAttributes({ script: v ? 'sup' : undefined })} />,
          circle: <BooleanEditor value={getCircle(cursorContent)} setValue={v => setSelectedAttributes({ circle: v ? true : undefined })} />,
          stackText: <StringEditor value={getStackText(cursorContent)} setValue={v => setSelectedAttributes({ stackText: v ? v : undefined })} />,
          actions: <Button onClick={() => navigator.clipboard.writeText(JSON.stringify({ contents: commands.map((c, i) => ({ id: i, content: { type: 'path', commands: c } })), center: { x: 0, y: 0 } } as CopyData))}>copy as command path</Button>,
        }}
      />
    </>
  )
}
