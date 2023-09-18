import React from "react"
import { Align, AttributedText, CanvasDraw, EnumEditor, NumberEditor, StringEditor, ObjectEditor, VerticalAlign, aligns, getTextSizeFromCache, reactCanvasRenderTarget, useAttributedTextEditor, verticalAligns, BooleanEditor } from "../src"

export default () => {
  type Attribute = Partial<{ color: number, fontFamily: string, bold: boolean, italic: boolean, readonly?: string }>
  const [state, setState] = React.useState<AttributedText<Attribute>[]>([{ insert: 'abc' }, { insert: '123', attributes: { color: 0xff0000, readonly: '1' } }, { insert: 'edf', attributes: { readonly: '1' } }, { insert: 'ghi', attributes: { color: 0x00ff00 } }])
  const [align, setAlign] = React.useState<Align>('left')
  const [verticalAlign, setVerticalAlign] = React.useState<VerticalAlign>('top')
  const fontSize = 20
  const getFontFamily = (content?: AttributedText<Attribute>) => content?.attributes?.fontFamily ?? 'monospace'
  const getColor = (content?: AttributedText<Attribute>) => content?.attributes?.color ?? 0x000000
  const getBold = (content?: AttributedText<Attribute>) => content?.attributes?.bold ?? false
  const getItalic = (content?: AttributedText<Attribute>) => content?.attributes?.italic ?? false
  const width = 400
  const lineHeight = fontSize * 1.2
  const getWidth = (content: AttributedText<Attribute>) => getTextSizeFromCache(`${getBold(content) ? 'bold ' : ''}${getItalic(content) ? 'italic ' : ''}${fontSize}px ${getFontFamily(content)}`, content.insert)?.width ?? 0
  const { renderEditor, layoutResult, isSelected, actualHeight, cursorContent, setSelectedAttributes } = useAttributedTextEditor<Attribute>({
    state,
    setState,
    width,
    height: 200,
    lineHeight,
    getWidth,
    align,
    verticalAlign,
    getReadonlyType: attributes => attributes?.readonly,
  })
  const children: CanvasDraw[] = []
  const target = reactCanvasRenderTarget
  for (const { x, y, i, content, visible } of layoutResult) {
    if (!visible) continue
    const textWidth = getWidth(content)
    if (isSelected(i)) {
      children.push(target.renderRect(x, y, textWidth, lineHeight, { fillColor: 0xB3D6FD, strokeWidth: 0 }))
    }
    children.push(target.renderText(x + textWidth / 2, y + fontSize, content.insert, getColor(content), fontSize, getFontFamily(content), {
      textAlign: 'center',
      fontWeight: getBold(content) ? 'bold' : undefined,
      fontStyle: getItalic(content) ? 'italic' : undefined,
    }))
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
          fontFamily: <StringEditor value={getFontFamily(cursorContent)} setValue={v => setSelectedAttributes({ fontFamily: v })} />,
          bold: <BooleanEditor value={getBold(cursorContent)} setValue={v => setSelectedAttributes({ bold: v ? true : undefined })} />,
          italic: <BooleanEditor value={getItalic(cursorContent)} setValue={v => setSelectedAttributes({ italic: v ? true : undefined })} />,
        }}
      />
    </>
  )
}
