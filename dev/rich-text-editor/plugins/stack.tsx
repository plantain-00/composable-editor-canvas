import React from "react"
import { RichTextEditorPluginHook } from "../model"
import { StringEditor, HtmlEditorPluginInline, isHtmlText, renderHtmlTextStyle, HtmlText, HtmlTextInline } from "../../../src";

interface Stack extends HtmlText {
  type: 'stack'
  bottomText: string
}

function isStack(data: HtmlTextInline): data is Stack {
  return isHtmlText(data) && data.type === 'stack'
}

export const stack: HtmlEditorPluginInline = {
  render(content) {
    if (isStack(content)) {
      const style = renderHtmlTextStyle(content)
      return (
        <span
          style={{
            ...style,
            display: 'inline-flex',
            flexDirection: 'column',
            verticalAlign: 'middle',
          }}
        >
          <span style={{
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: style.color
          }}>{content.text}</span>
          <span>{content.bottomText}</span>
        </span>
      )
    }
    return
  },
}

export const useStack: RichTextEditorPluginHook = ({ inputText, currentContent, updateCurrentContent }) => {
  const [text, setText] = React.useState('')
  const propertyPanel: Record<string, JSX.Element | (JSX.Element | undefined)[]> = {
    'insert stack': <StringEditor
      value={text}
      setValue={v => {
        if (v) {
          let top = v
          let bottom = v
          const index = v.indexOf('/')
          if (index > 0 && index < v.length - 1) {
            top = v.substring(0, index)
            bottom = v.substring(index + 1)
          }
          const stack: Stack = {
            type: 'stack',
            text: top,
            bottomText: bottom,
          }
          inputText([stack, ' '])
          setText(v)
          setTimeout(() => {
            setText('')
          }, 0)
        }
      }}
    />
  }
  if (currentContent && isStack(currentContent)) {
    propertyPanel['stack top'] = <StringEditor value={currentContent.text} setValue={v => updateCurrentContent(c => { if (isStack(c)) { c.text = v } })} />
    propertyPanel['stack bottom'] = <StringEditor value={currentContent.bottomText} setValue={v => updateCurrentContent(c => { if (isStack(c)) { c.bottomText = v } })} />
  }
  return {
    propertyPanel,
  }
}
