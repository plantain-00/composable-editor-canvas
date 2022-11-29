import * as React from "react"
import { isLetter, isNumber, metaKeyIfMacElseCtrlKey, reactCanvasRenderTarget, ReactRenderTarget, useFlowLayoutTextEditor, useUndoRedo } from "."
import { controlStyle } from "react-composable-json-editor"
import type { JsonEditorProps } from "react-composable-json-editor"

/**
 * @public
 */
export function ExpressionEditor(props: JsonEditorProps<string> & {
  height?: number
  fontSize?: number
  target?: ReactRenderTarget<unknown>
  autoHeight?: boolean
  suggestionSources?: ExpressionSuggesionSource[]
}) {
  const height = props.height ?? 100
  const target = props.target ?? reactCanvasRenderTarget
  const fontSize = props.fontSize ?? 16
  const fontFamily = props.style?.fontFamily ?? controlStyle.fontFamily ?? 'monospace'
  const lineHeight = fontSize * 1.2

  const initialState = React.useRef(props.value.split(''))
  const [width, setWidth] = React.useState(250)
  const { state, setState, undo, redo } = useUndoRedo(initialState.current)
  const [suggestions, setSuggestions] = React.useState<ExpressionSuggesionSource[]>([])
  const [suggestionIndex, setSuggestionIndex] = React.useState(0)
  const [suggestionText, setSuggestionText] = React.useState('')
  const [suggestion, setSuggestion] = React.useState<ExpressionSuggesionSource>()
  const { renderEditor, layoutResult, location, cursor, setLocation, inputText } = useFlowLayoutTextEditor({
    state,
    setState,
    width,
    height,
    fontSize,
    fontFamily,
    lineHeight,
    readOnly: props.readOnly,
    processInput(e) {
      if (e.key === 'Escape') {
        return true
      }
      if (suggestions.length > 0 && !props.readOnly) {
        if (e.key === 'ArrowDown') {
          setSuggestionIndex((suggestionIndex + 1) % suggestions.length)
          e.preventDefault()
          return true
        }
        if (e.key === 'ArrowUp') {
          setSuggestionIndex((suggestionIndex - 1 + suggestions.length) % suggestions.length)
          e.preventDefault()
          return true
        }
        if (e.key === 'Enter' && suggestionIndex >= 0 && suggestionIndex < suggestions.length) {
          useSuggestion(suggestionIndex)
          return true
        }
      }
      if (e.key === 'Enter') {
        onComplete()
        return true
      }
      e.stopPropagation()
      if (metaKeyIfMacElseCtrlKey(e)) {
        if (e.key === 'z') {
          e.shiftKey ? redo() : undo()
          return true
        }
      }
      if (e.key === '(') {
        inputText('()', 1)
        e.preventDefault()
        return true
      }
      return false
    },
    autoHeight: props.autoHeight,
    onBlur: () => {
      setTimeout(() => {
        onComplete()
      }, 0)
    },
    style: {
      border: 'unset',
    },
  })

  React.useEffect(() => {
    if (!props.suggestionSources || props.readOnly) {
      return
    }
    if (location - 1 < 0 || location - 1 >= state.length) {
      return
    }
    setSuggestions([])
    setSuggestion(undefined)
    const key = state[location - 1]
    if (isLetter(key) || isNumber(key) || key == '.') {
      let start: number | undefined
      for (let i = location - 1; i >= 0 && i < state.length; i--) {
        const key = state[i]
        if (isLetter(key) || isNumber(key) || key == '.') {
          start = i
        } else {
          break
        }
      }
      if (start === undefined) {
        return
      }
      const text = state.slice(start, location).join('').split('.')
      let result = props.suggestionSources
      for (let i = 0; i < text.length; i++) {
        if (i !== text.length - 1) {
          result = result.find(r => r.name === text[i])?.members ?? []
        } else {
          const t = text[i].toLowerCase()
          result = result.filter(r => r.name.toLowerCase().includes(t)).sort((a, b) => {
            if (a.name.toLowerCase() === t) {
              return -1
            }
            if (b.name.toLowerCase() === t) {
              return 1
            }
            return a.name.localeCompare(b.name)
          })
        }
      }
      setSuggestions(result)
      setSuggestionIndex(0)
      setSuggestionText(text[text.length - 1])
    } else if (key === '(') {
      let start: number | undefined
      for (let i = location - 2; i >= 0 && i < state.length; i--) {
        const key = state[i]
        if (isLetter(key) || isNumber(key) || key == '.') {
          start = i
        } else {
          break
        }
      }
      if (start === undefined) return
      const text = state.slice(start, location - 1).join('').split('.')
      let result = props.suggestionSources
      let s: ExpressionSuggesionSource | undefined
      for (let i = 0; i < text.length; i++) {
        if (i !== text.length - 1) {
          result = result.find(r => r.name === text[i])?.members ?? []
        } else {
          s = result.find(r => r.name === text[i])
        }
      }
      setSuggestion(s)
    }
  }, [state, location])

  React.useEffect(() => {
    initialState.current = props.value.split('')
  }, [props.value])

  const ref = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    resizeObserver.observe(ref.current)
    return () => resizeObserver.disconnect()
  }, [ref.current])

  const onComplete = () => {
    if (!props.readOnly) {
      const value = state.join('')
      if (value !== props.value) {
        props.setValue(value)
      }
    }
  }
  const extraStyle: React.CSSProperties = {}
  if (props.readOnly) {
    extraStyle.opacity = 0.5
  }
  const useSuggestion = (index: number) => {
    const suggestion = suggestions[index]
    setState(draft => {
      draft.splice(location - suggestionText.length, suggestionText.length, ...suggestion.name.split(''))
    })
    setLocation(location - suggestionText.length + suggestion.name.length)
    setSuggestions([])
  }

  const getTextColors = (i: number) => {
    let color: number | undefined
    let backgroundColor: number | undefined
    const content = layoutResult[i].content
    if (isNumber(content)) {
      let headIsLetter = false
      for (let j = i - 1; j >= 0; j--) {
        const c = layoutResult[j].content
        if (isNumber(c)) {
          headIsLetter = false
        } else if (isLetter(c)) {
          headIsLetter = true
        } else {
          break
        }
      }
      if (!headIsLetter) {
        color = 0x0c840a
      }
    } else if (content === '.' && i < layoutResult.length - 1) {
      const next = layoutResult[i + 1].content
      if (isNumber(next)) {
        color = 0x0c840a
      }
    }
    return { color, backgroundColor }
  }
  return (
    <div ref={ref} style={{ position: 'relative', ...controlStyle, ...props.style, ...extraStyle }}>
      {renderEditor({ target, getTextColors })}
      {suggestions.length > 0 && <div
        style={{
          position: 'absolute',
          left: cursor.x + 'px',
          top: cursor.y + lineHeight + 'px',
          background: 'white',
          width: '200px',
          border: '1px solid black',
          maxHeight: '200px',
          overflowY: 'auto',
        }}
      >
        {suggestions.map((s, i) => {
          const index = s.name.toLowerCase().indexOf(suggestionText.toLowerCase())
          return (
            <div
              key={s.name}
              style={{ background: suggestionIndex === i ? '#ccc' : undefined, cursor: 'pointer' }}
              onMouseDown={(e) => {
                e.preventDefault()
                useSuggestion(i)
              }}
              title={s.comment}
            >
              {s.name.substring(0, index)}
              <span style={{ color: '#0c840a' }}>{s.name.substring(index, index + suggestionText.length)}</span>
              {s.name.substring(index + suggestionText.length)}
            </div>
          )
        })}
      </div>}
      {suggestion?.parameters && <div
        style={{
          position: 'absolute',
          left: cursor.x + 'px',
          top: cursor.y + lineHeight + 'px',
          background: 'white',
          width: '400px',
          border: '1px solid black',
          maxHeight: '200px',
          overflowY: 'auto',
        }}
      >
        <div onMouseDown={(e) => e.preventDefault()}>
          {suggestion.name}
          ({suggestion.parameters.map(p => p.name).join(', ')})
          {suggestion.parameters.map(p => p.comment ? <div key={p.name} style={{ fontSize: '12px' }}>{p.name}: {p.comment}</div> : null)}
          {suggestion.comment && <div style={{ fontSize: '12px' }}>{suggestion.comment}</div>}
        </div>
      </div>}
    </div>
  )
}

/**
 * @public
 */
export interface ExpressionSuggesionSource {
  name: string
  comment?: string
  optional?: boolean
  parameters?: ExpressionSuggesionSource[]
  members?: ExpressionSuggesionSource[]
}
