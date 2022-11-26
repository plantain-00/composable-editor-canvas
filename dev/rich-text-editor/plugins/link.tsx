import React from "react"
import { RichTextEditorPluginHook, RichText, isText, RichTextInline } from "../model"
import { BooleanEditor, StringEditor } from "react-composable-json-editor";
import { richTextStyleToHtmlStyle } from "../export-to-html";

interface Link extends RichText {
  url: string
  type: 'link'
  targetBlank?: boolean
}

function isLink(data: RichTextInline): data is Link {
  return isText(data) && data.type === 'link'
}

export const useLink: RichTextEditorPluginHook = ({ inputText, currentContent, updateCurrentContent }) => {
  const [text, setText] = React.useState('')
  const propertyPanel: Record<string, JSX.Element | (JSX.Element | undefined)[]> = {
    'insert link': <StringEditor
      value={text}
      setValue={v => {
        if (v) {
          const link: Link = {
            type: 'link',
            text: v,
            underline: true,
            color: 0x551A8A,
            targetBlank: true,
            url: v,
          }
          inputText([link, ' '])
          setText(v)
          setTimeout(() => {
            setText('')
          }, 0)
        }
      }}
    />
  }
  if (currentContent && isLink(currentContent)) {
    propertyPanel['link text'] = <StringEditor value={currentContent.text} setValue={v => updateCurrentContent(c => { if (isLink(c)) { c.text = v } })} />
    propertyPanel['link url'] = <StringEditor value={currentContent.url} setValue={v => updateCurrentContent(c => { if (isLink(c)) { c.url = v } })} />
    propertyPanel['link target blank'] = <BooleanEditor value={currentContent.targetBlank ?? false} setValue={v => updateCurrentContent(c => { if (isLink(c)) { c.targetBlank = v ? true : undefined } })} />
  }
  return {
    propertyPanel,
    exportToHtml(richText) {
      if (isLink(richText)) {
        const target = richText.targetBlank ? ' target="_blank"' : ''
        return `<a style="${richTextStyleToHtmlStyle(richText)}"${target} href="${richText.url}">${new Option(richText.text).innerHTML}</a>`
      }
      return
    },
  }
}
