import React from "react"
import { NumberEditor, StringEditor } from "react-composable-json-editor"
import { getImageFromCache, Size } from "../../../src"
import { RichTextEditorPluginHook, RichTextEditorPluginInline, RichTextInline } from "../model"

export interface RichTextImage extends Size {
  kind: 'image'
  url: string
}

export function isRichTextImage(content: RichTextInline): content is RichTextImage {
  return content.kind === 'image'
}

export const image: RichTextEditorPluginInline = {
  getLineHeight: content => isRichTextImage(content) ? content.height : undefined,
  getWidth: content => isRichTextImage(content) ? content.width : undefined,
}

export const useImage: RichTextEditorPluginHook = ({ inputText, currentContent, updateCurrentContent }) => {
  const [text, setText] = React.useState('')
  const propertyPanel: Record<string, JSX.Element | (JSX.Element | undefined)[]> = {
    'insert image': <StringEditor
      value={text}
      setValue={v => {
        if (v) {
          getImageFromCache(v, {
            callback(imageBitmap) {
              const maxWidth = 200
              const width = Math.min(imageBitmap.width, maxWidth)
              const height = Math.round(width / imageBitmap.width * imageBitmap.height)
              const newImage: RichTextImage = {
                kind: 'image',
                url: v,
                width,
                height,
              }
              inputText([newImage, ' '])
            }
          })
          setText(v)
          setTimeout(() => {
            setText('')
          }, 0)
        }
      }}
    />
  }
  if (currentContent && isRichTextImage(currentContent)) {
    propertyPanel['image url'] = <StringEditor value={currentContent.url} setValue={v => updateCurrentContent(c => { if (isRichTextImage(c)) { c.url = v } })} />
    propertyPanel['image width'] = <NumberEditor value={currentContent.width} setValue={v => updateCurrentContent(c => { if (isRichTextImage(c)) { c.width = v } })} />
    propertyPanel['image height'] = <NumberEditor value={currentContent.height} setValue={v => updateCurrentContent(c => { if (isRichTextImage(c)) { c.height = v } })} />
  }
  return {
    propertyPanel,
    exportToHtml(content) {
      if (isRichTextImage(content)) {
        return `<img style="width: ${content.width}px; height: ${content.height}px" src="${content.url}" />`
      }
      return
    },
    render(content, target, x, y) {
      if (isRichTextImage(content)) {
        return target.renderImage(content.url, x, y - content.height, content.width, content.height)
      }
      return
    },
  }
}
