import React from "react"
import { RichTextEditorPluginHook, RichText, isText, RichTextInline } from "../model"
import { StringEditor } from "react-composable-json-editor";
import { richTextStyleToHtmlStyle } from "../export-to-html";

interface Code extends RichText {
  type: 'code'
}

function isCode(data: RichTextInline): data is Code {
  return isText(data) && data.type === 'code'
}

export const useCode: RichTextEditorPluginHook = ({ inputText, currentContent, updateCurrentContent }) => {
  const [text, setText] = React.useState('')
  const propertyPanel: Record<string, JSX.Element | (JSX.Element | undefined)[]> = {
    'insert code': <StringEditor
      value={text}
      setValue={v => {
        if (v) {
          const code: Code = {
            type: 'code',
            text: v,
            fontFamily: 'monospace',
          }
          inputText([code, ' '])
          setText(v)
          setTimeout(() => {
            setText('')
          }, 0)
        }
      }}
    />
  }
  if (currentContent && isCode(currentContent)) {
    propertyPanel['code text'] = <StringEditor value={currentContent.text} setValue={v => updateCurrentContent(c => { if (isCode(c)) { c.text = v } })} />
  }
  return {
    propertyPanel,
    exportToHtml(richText) {
      if (isCode(richText)) {
        return `<code style="${richTextStyleToHtmlStyle(richText)}">${new Option(richText.text).innerHTML}</code>`
      }
      return
    },
  }
}
