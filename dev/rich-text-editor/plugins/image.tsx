import React from "react"
import { NumberEditor, StringEditor, getImageFromCache, HtmlEditorPluginInline, ResizeBar, HtmlTextInline, Size, useDragResize, useGlobalKeyDown } from "../../../src"
import { RichTextEditorPluginHook } from "../model"

export interface RichTextImage extends Size {
  kind: 'image'
  url: string
}

export function isRichTextImage(content: HtmlTextInline): content is RichTextImage {
  return content.kind === 'image'
}

export const image: HtmlEditorPluginInline = {
  render(content, offset) {
    if (isRichTextImage(content)) {
      return <img style={{ width: `${content.width + offset.width}px`, height: `${content.height + offset.height}px` }} src={content.url} />
    }
    return
  },
}

export const useImage: RichTextEditorPluginHook = ({ inputText, currentContent, currentContentLayout, updateCurrentContent, setResizeOffset }) => {
  const [text, setText] = React.useState('')
  const { offset, onStart, mask, resetDragResize } = useDragResize(
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
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      resetDragResize()
    }
  })
  React.useEffect(() => {
    setResizeOffset(offset)
  }, [offset.x, offset.y])
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
    ui: currentContent && isRichTextImage(currentContent) && currentContentLayout ? <div
      style={{
        width: `${currentContent.width + offset.width}px`,
        height: `${currentContent.height + offset.height}px`,
        left: `${currentContentLayout.x + offset.x}px`,
        top: `${currentContentLayout.y + offset.y}px`,
        border: '1px solid green',
        boxSizing: 'border-box',
        position: 'absolute',
      }}
    >
      <ResizeBar
        directions={['right-bottom']}
        onMouseDown={onStart}
      />
      {mask}
    </div> : undefined
  }
}
