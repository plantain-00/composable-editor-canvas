import React from "react"
import { NumberEditor, StringEditor } from "react-composable-json-editor"
import { getImageFromCache, ResizeBar, Size, useDragResize } from "../../../src"
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
  getHeight: content => isRichTextImage(content) ? content.height : undefined,
}

export const useImage: RichTextEditorPluginHook = ({ inputText, currentContent, currentContentLayout, cursorHeight, updateCurrentContent }) => {
  const [text, setText] = React.useState('')
  const { offset, onStart, mask } = useDragResize(
    () => {
      updateCurrentContent(c => {
        if (isRichTextImage(c)) {
          c.width += offset.width
          c.height += offset.height
        }
      })
    },
    {
      keepRatio: currentContent && isRichTextImage(currentContent) ? currentContent.width / currentContent.height : undefined,
    },
  )
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
        let width = content.width
        let height = content.height
        if (content === currentContent) {
          x += offset.x
          y += offset.y
          width += offset.width
          height += offset.height
        }
        return target.renderImage(content.url, x, y - content.height, width, height)
      }
      return
    },
    ui: currentContent && isRichTextImage(currentContent) && currentContentLayout ? <div
      style={{
        width: `${currentContent.width + offset.width}px`,
        height: `${currentContent.height + offset.height}px`,
        left: `${currentContentLayout.x + offset.x}px`,
        top: `${currentContentLayout.y + cursorHeight - currentContent.height + offset.y}px`,
        boxSizing: 'border-box',
        position: 'absolute',
      }}
    >
      <ResizeBar
        directions={['left-bottom', 'left-top', 'right-bottom', 'right-top']}
        onMouseDown={onStart}
      />
      {mask}
    </div> : undefined
  }
}
