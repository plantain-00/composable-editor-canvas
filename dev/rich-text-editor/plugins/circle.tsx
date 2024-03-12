import React from "react"
import { RichTextEditorPluginHook } from "../model"
import { StringEditor, HtmlEditorPluginInline, isHtmlText, renderHtmlTextStyle, HtmlText, HtmlTextInline, defaultFontSize } from "../../../src";

export interface Circle extends HtmlText {
  type: 'circle'
}

function isCircle(data: HtmlTextInline): data is Circle {
  return isHtmlText(data) && data.type === 'circle'
}

export const circle: HtmlEditorPluginInline = {
  render(content) {
    if (isCircle(content)) {
      const style = renderHtmlTextStyle(content)
      const height = (content.fontSize ?? defaultFontSize) * 1.2
      return (
        <span
          style={{
            ...style,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: style.color,
            borderRadius: `${height / 2}px`,
            width: `${height}px`,
            height: `${height}px`,
            display: 'inline-flex',
            justifyContent: 'center',
          }}
        >{content.text}</span>
      )
    }
    return
  },
}

export const useCircle: RichTextEditorPluginHook = ({ inputText, currentContent, updateCurrentContent }) => {
  const [text, setText] = React.useState('')
  const propertyPanel: Record<string, JSX.Element | (JSX.Element | undefined)[]> = {
    'insert circle': <StringEditor
      value={text}
      setValue={v => {
        if (v) {
          const circle: Circle = {
            type: 'circle',
            text: v,
          }
          inputText([circle, ' '])
          setText(v)
          setTimeout(() => {
            setText('')
          }, 0)
        }
      }}
    />
  }
  if (currentContent && isCircle(currentContent)) {
    propertyPanel['circle text'] = <StringEditor value={currentContent.text} setValue={v => updateCurrentContent(c => { if (isCircle(c)) { c.text = v } })} />
  }
  return {
    propertyPanel,
  }
}
