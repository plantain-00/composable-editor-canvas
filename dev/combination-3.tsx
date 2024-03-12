import React from "react"
import { HtmlBlock } from "../src"
import { RichTextEditor, RichTextEditorPlugin } from "./rich-text-editor/rich-text-editor"
import { h1, h2, h3, h4, h5, h6, hr, ol, p, ul } from "./rich-text-editor/plugins/blocks"
import { backgroundColor, bold, color, fontFamily, fontSize, italic, passThrough, underline } from './rich-text-editor/plugins/styles'
import { useAt } from "./rich-text-editor/plugins/at"
import { link, useLink } from "./rich-text-editor/plugins/link"
import { image, useImage } from "./rich-text-editor/plugins/image"
import { code, mark, span, sub, sup } from "./rich-text-editor/plugins/inline"
import { circle, useCircle } from "./rich-text-editor/plugins/circle"
import { stack, useStack } from "./rich-text-editor/plugins/stack"
import { richTextData } from "./rich-text-editor/data"

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

export function Combination3() {
  const [initialState] = React.useState<readonly HtmlBlock[]>(richTextData)
  const width = 500
  const height = 300
  const [autoHeight, setAutoHeight] = React.useState(true)
  const [readOnly, setReadOnly] = React.useState(false)
  const plugin = React.useRef<RichTextEditorPlugin>({
    blocks: { h1, h2, h3, h4, h5, h6, p, ul, ol, hr },
    styles: {
      'font size': fontSize,
      'font family': fontFamily,
      bold,
      italic,
      underline,
      'pass through': passThrough,
      color,
      'background color': backgroundColor,
    },
    hooks: [useAt, useLink, useImage, useCircle, useStack],
    inlines: [link, image, circle, stack],
    textInlines: { span, code, mark, sub, sup },
  })

  if (!initialState) {
    return null
  }
  return (
    <div>
      <div>
        <label>
          <input type='checkbox' checked={autoHeight} onChange={(e) => setAutoHeight(e.target.checked)} />
          autoHeight
        </label>
        <label>
          <input type='checkbox' checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
          readOnly
        </label>
      </div>
      <RichTextEditor
        initialState={initialState}
        width={width}
        height={height}
        autoHeight={autoHeight}
        readOnly={readOnly}
        operator={me}
        plugin={plugin.current}
      />
    </div >
  )
}
