import React from "react"
import { RichTextEditorPluginHook } from "../model"
import { BooleanEditor, StringEditor } from "react-composable-json-editor";
import { HtmlEditorPluginInline, isHtmlText, renderHtmlTextStyle, HtmlText, HtmlTextInline } from "../../../src";

interface Link extends HtmlText {
  url: string
  type: 'link'
  targetBlank?: boolean
}

function isLink(data: HtmlTextInline): data is Link {
  return isHtmlText(data) && data.type === 'link'
}

export const link: HtmlEditorPluginInline = {
  render(content) {
    if (isLink(content)) {
      return (
        <a
          style={renderHtmlTextStyle(content)}
          target={content.targetBlank ? '_blank' : ''}
          href={content.url}
        >
          {content.text}
        </a>
      )
    }
    return
  },
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
  }
}
