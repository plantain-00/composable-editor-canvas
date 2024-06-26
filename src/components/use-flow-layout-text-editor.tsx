import * as React from "react"
import { getTextSizeFromCache } from "../utils/text"
import { ReactRenderTarget } from "./react-render-target/react-render-target"
import { useFlowLayoutEditor } from "./use-flow-layout-editor"
import { metaKeyIfMacElseCtrlKey } from "../utils/key"
import { Align, VerticalAlign } from "../utils/flow-layout"
import { isWordCharactor } from "../utils/text"

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
  autoFocus?: boolean
  align?: Align
  verticalAlign?: VerticalAlign
}) {
  const font = `${props.fontSize}px ${props.fontFamily}`
  const getTextWidth = (text: string) => getTextSizeFromCache(font, text)?.width ?? 0
  const getComposition = (index: number) => getTextComposition(index, props.state, getTextWidth, c => c)
  const { onComposing, getCompositionCountThenEnd } = useTextComposing()
  const { inputContent, getCopiedContents, ref, layoutResult, cursor, location, setLocation, isSelected, renderEditor, actualHeight, setSelectionStart, positionToLocation, getPosition, backspace } = useFlowLayoutEditor({
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
    autoFocus: props.autoFocus,
    onBlur: props.onBlur,
    onFocus: props.onFocus,
    isNewLineContent: content => content === '\n',
    isPartOfComposition: content => isWordCharactor(content),
    getComposition,
    endContent: '',
    align: props.align,
    verticalAlign: props.verticalAlign,
    onCompositionEnd(e) {
      inputText(e.data, undefined, getCompositionCountThenEnd())
      if (ref.current) {
        ref.current.value = ''
      }
    },
    onDoubleClick(e) {
      const p = positionToLocation(getPosition(e))
      const { newSelectionStart, newLocation } = getWordByDoubleClick(props.state, p, c => c)
      if (newSelectionStart !== undefined) setSelectionStart(newSelectionStart)
      if (newLocation !== undefined) setLocation(newLocation)
    },
    onComposing(e) {
      onComposing(e, inputText, backspace)
    },
  })

  const inputText = (text: string | string[], textLocation = text.length, deleteCount?: number) => {
    if (props.readOnly) return
    const result: string[] = []
    for (const t of text) {
      result.push(t)
    }
    inputContent(result, textLocation, deleteCount)
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
        const textWidth = getTextWidth(content)
        if (colors.backgroundColor !== undefined) {
          children.push(renderProps.target.renderRect(x, y, textWidth, props.lineHeight, { fillColor: colors.backgroundColor, strokeWidth: 0 }))
        }
        children.push(renderProps.target.renderText(x + textWidth / 2, y + props.fontSize, content, colors.color ?? 0x000000, props.fontSize, props.fontFamily, { textAlign: 'center' }))
      }
      if (renderProps.children) {
        children.push(...renderProps.children)
      }
      const result = renderProps.target.renderResult(children, props.width, actualHeight)
      return renderEditor(result)
    },
  }
}

export function useTextComposing() {
  const compositionCount = React.useRef(0)
  return {
    getCompositionCountThenEnd() {
      const result = compositionCount.current
      compositionCount.current = 0
      return result
    },
    onComposing(e: React.KeyboardEvent<HTMLInputElement>, inputText: (text: string) => void, backspace: () => void) {
      if (e.code === 'Backspace') {
        if (compositionCount.current > 0) {
          compositionCount.current--
          backspace()
          return
        }
      }
      for (const key of ['Key', 'Digit']) {
        if (e.code.startsWith(key)) {
          const text = e.code.slice(key.length)[0].toLocaleLowerCase()
          if (text) {
            compositionCount.current += text.length
            inputText(text)
            return
          }
        }
      }
    }
  }
}

/**
 * @public
 */
export function getWordByDoubleClick<T>(
  state: readonly T[],
  location: number,
  getContentText: (c: T) => string | undefined,
) {
  let start: number | undefined
  for (let i = location - 1; i >= 0; i--) {
    const text = getContentText(state[i])
    if (text && isWordCharactor(text)) {
      start = i
    } else {
      break
    }
  }
  let end: number | undefined
  for (let i = location; i < state.length; i++) {
    const text = getContentText(state[i])
    if (text && isWordCharactor(text)) {
      end = i + 1
    } else {
      break
    }
  }
  let newSelectionStart: number | undefined
  let newLocation: number | undefined
  if (end !== undefined) {
    newSelectionStart = start ?? location
    newLocation = end
  } else if (start !== undefined) {
    newSelectionStart = start
  }
  return { newSelectionStart, newLocation }
}

/**
 * @public
 */
export function getTextComposition<T>(
  index: number,
  state: readonly T[],
  getTextWidth: (c: T) => number,
  getContentText: (c: T) => string | undefined,
) {
  let width = getTextWidth(state[index])
  for (let i = index + 1; i < state.length; i++) {
    const content = state[i]
    const text = getContentText(content)
    if (text && isWordCharactor(text)) {
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
    index: state.length,
  }
}
