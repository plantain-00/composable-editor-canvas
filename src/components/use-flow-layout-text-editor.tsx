import * as React from "react"
import { ReactRenderTarget } from "."
import { getTextSizeFromCache } from "../utils"
import { useFlowLayoutEditor } from "./use-flow-layout-editor"
import { metaKeyIfMacElseCtrlKey } from "./use-key"

/**
 * @public
 */
export function useFlowLayoutTextEditor(props: {
  state: readonly string[]
  width: number
  height: number
  fontSize: number
  fontFamily: string
  lineHeight: number
  setState(recipe: (draft: string[]) => void): void
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  onLocationChanged?(location: number): void
  style?: React.CSSProperties
  autoHeight?: boolean
  readOnly?: boolean
  onBlur?: () => void
  onFocus?: () => void
}) {
  const font = `${props.fontSize}px ${props.fontFamily}`
  function getTextWidth(text: string) {
    return getTextSizeFromCache(font, text)?.width ?? 0
  }
  const getComposition = (index: number) => {
    let width = getTextWidth(props.state[index])
    for (let i = index + 1; i < props.state.length; i++) {
      const content = props.state[i]
      if (isWordCharactor(content)) {
        width += getTextWidth(content)
      } else {
        return {
          width,
          index: i,
        }
      }
    }
    return {
      width,
      index: props.state.length,
    }
  }
  const { inputContent, getCopiedContents, ref, layoutResult, cursor, location, setLocation, isSelected, renderEditor, actualHeight, setSelectionStart, positionToLocation, getPosition } = useFlowLayoutEditor({
    state: props.state,
    width: props.width,
    height: props.height,
    lineHeight: props.lineHeight,
    setState: props.setState,
    getWidth: getTextWidth,
    processInput(e) {
      if (props.processInput?.(e)) {
        return true
      }
      if (e.key === 'Enter') {
        inputText('\n')
        return true
      }
      if (metaKeyIfMacElseCtrlKey(e)) {
        if (e.key === 'v') {
          paste()
          e.preventDefault()
          return true
        }
        if (e.key === 'c' || e.key === 'x') {
          const contents = getCopiedContents(e.key === 'x')
          if (contents) {
            // eslint-disable-next-line plantain/promise-not-await
            navigator.clipboard.writeText(contents.join(''))
          }
          return true
        }
      } else if (e.key.length === 1) {
        e.preventDefault()
        inputText(e.key)
        return true
      }
      return false
    },
    onLocationChanged: props.onLocationChanged,
    style: props.style,
    autoHeight: props.autoHeight,
    readOnly: props.readOnly,
    onBlur: props.onBlur,
    onFocus: props.onFocus,
    isNewLineContent: content => content === '\n',
    isPartOfComposition: content => isWordCharactor(content),
    getComposition,
    endContent: '',
    onCompositionEnd(e) {
      inputText(e.data)
      if (ref.current) {
        ref.current.value = ''
      }
    },
    onDoubleClick(e) {
      const p = positionToLocation(getPosition(e))
      let start: number | undefined
      for (let i = p - 1; i >= 0; i--) {
        if (isWordCharactor(props.state[i])) {
          start = i
        } else {
          break
        }
      }
      let end: number | undefined
      for (let i = p; i < props.state.length; i++) {
        if (isWordCharactor(props.state[i])) {
          end = i + 1
        } else {
          break
        }
      }
      if (end !== undefined) {
        setSelectionStart(start ?? p)
        setLocation(end)
      } else if (start !== undefined) {
        setSelectionStart(start)
      }
    },
  })

  const inputText = (text: string | string[], textLocation = text.length) => {
    if (props.readOnly) return
    const result: string[] = []
    for (const t of text) {
      result.push(t)
    }
    inputContent(result, textLocation)
  }

  const paste = () => {
    if (props.readOnly) return
    navigator.clipboard.readText().then(v => {
      if (v) {
        inputText(v)
      }
    })
  }

  return {
    layoutResult,
    cursor,
    inputText,
    location,
    setLocation,
    renderEditor: (renderProps: {
      target: ReactRenderTarget<unknown>,
      getTextColors?: (index: number) => { color?: number, backgroundColor?: number } | undefined,
      children?: unknown[],
    }) => {
      const children: unknown[] = []
      for (const { x, y, i, content, visible } of layoutResult) {
        if (!visible) continue
        const colors = renderProps.getTextColors?.(i) ?? {}
        if (isSelected(i)) {
          colors.backgroundColor = 0xB3D6FD
        }
        if (colors.backgroundColor !== undefined) {
          children.push(renderProps.target.renderRect(x, y, getTextWidth(content), props.lineHeight, { fillColor: colors.backgroundColor, strokeWidth: 0 }))
        }
        children.push(renderProps.target.renderText(x + getTextWidth(content) / 2, y + props.fontSize, content, colors.color ?? 0x000000, props.fontSize, props.fontFamily, { textAlign: 'center' }))
      }
      if (renderProps.children) {
        children.push(...renderProps.children)
      }
      const result = renderProps.target.renderResult(children, props.width, actualHeight)
      return renderEditor(result, props.lineHeight)
    },
  }
}

function isWordCharactor(c: string) {
  if (c === '.') return true
  if (isLetter(c)) return true
  if (isNumber(c)) return true
  return false
}

export function isLetter(c: string) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
}

export function isNumber(c: string) {
  return c >= '0' && c <= '9'
}
