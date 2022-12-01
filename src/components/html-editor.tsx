import { castDraft } from "immer"
import * as React from "react"
import { Button, StringEditor } from "react-composable-json-editor"
import { Position, Region } from "../utils"
import { Cursor } from "./cursor"
import { useEvent } from "./use-event"
import { useGlobalMouseUp } from "./use-global-mouseup"
import { metaKeyIfMacElseCtrlKey } from "./use-key"
import { usePatchBasedUndoRedo } from "./use-patch-based-undo-redo"
import { isSamePath } from "./use-selected"

/**
 * @public
 */
export function HtmlEditor(props: {
  initialState: readonly HtmlElementNode[]
  onChange: React.Dispatch<React.SetStateAction<readonly HtmlElementNode[]>>
  width: number
  height: number
}) {
  const { state, setState, undo, redo } = usePatchBasedUndoRedo<HtmlElementNode[], string>(props.initialState, '', {
    onChange({ newState }) {
      const parent = getParentByPath(newState, parentPath)
      if (parent && contentPath > parent.length) {
        setContentPath(parent.length)
      }
      props.onChange(newState)
    },
  })
  const startPath = getStartOrEndPath(state, 'start')
  const [parentPath, setParentPath] = React.useState<number[]>(startPath[0])
  const [contentPath, setContentPath] = React.useState<number>(startPath[1])
  const [selectionStart, setSelectionStart] = React.useState<number[]>()
  const cursorRef = React.useRef<HTMLInputElement | null>(null)
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const [cursorRect, setCursorRect] = React.useState<Region>()
  const fullPath = [...parentPath, contentPath]
  const endPath = getStartOrEndPath(state, 'end')

  const inputInline = (items: HtmlElementNode[]) => {
    setContentPath(contentPath + items.length)
    setState(draft => {
      const parent = getParentByPath(draft, parentPath)
      if (parent) {
        parent.splice(contentPath, 0, ...castDraft(items))
      }
    })
  }
  const inputText = (text: string | (string | HtmlElementNode)[]) => {
    const result: HtmlElementNode[] = []
    for (const t of text) {
      if (typeof t === 'string') {
        if (currentContent) {
          const newText: HtmlElementNode = { ...currentContent, children: t }
          result.push(newText)
        } else {
          const newText: HtmlElementNode = { tag: 'span', children: t }
          result.push(newText)
        }
      } else {
        result.push({ ...currentContent, ...t })
      }
    }
    inputInline(result)
  }
  const backspace = () => {
    if (contentPath !== 0) {
      setContentPath(contentPath - 1)
      setState(draft => {
        const parent = getParentByPath(draft, parentPath)
        if (parent) {
          parent.splice(contentPath - 1, 1)
        }
      })
    }
  }
  const arrowLeft = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setParentPath(range.min.parent)
      setContentPath(range.min.content)
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(fullPath)
    }
    if (contentPath !== 0) {
      setContentPath(contentPath - 1)
    }
  }
  const arrowRight = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setParentPath(range.max.parent)
      setContentPath(range.max.content)
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(fullPath)
    }
    const parent = getParentByPath(state, parentPath)
    if (parent && contentPath !== parent.length) {
      setContentPath(contentPath + 1)
    }
  }
  const arrowUp = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setParentPath(range.min.parent)
      setContentPath(range.min.content)
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(fullPath)
    }
    if (!cursorRect) return
    const p = getPathByPoint({ x: cursorRect.x - cursorRect.width / 2, y: cursorRect.y - cursorRect.height * 0.5 })
    setParentPath(p[0])
    setContentPath(p[1])
  }
  const arrowDown = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setParentPath(range.max.parent)
      setContentPath(range.max.content)
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(fullPath)
    }
    if (!cursorRect) return
    const p = getPathByPoint({ x: cursorRect.x - cursorRect.width / 2, y: cursorRect.y + cursorRect.height * 1.5 })
    setParentPath(p[0])
    setContentPath(p[1])
  }
  const enter = () => {
    const grandParentPath = parentPath.slice(0, parentPath.length - 1)
    const parentIndex = parentPath[parentPath.length - 1]
    setParentPath([...grandParentPath, parentIndex + 1])
    setContentPath(0)
    setState(draft => {
      const parent = getParentByPath(draft, parentPath)
      const grandParent = getParentByPath(draft, grandParentPath)
      if (parent && grandParent) {
        grandParent.splice(parentIndex + 1, 0, castDraft({
          ...grandParent[parentIndex],
          children: parent.slice(contentPath),
        }))
        parent.splice(contentPath, parent.length - contentPath)
      }
    })
  }
  const paste = () => {
    navigator.clipboard.readText().then(v => {
      if (v) {
        inputInline(v.split('').map(s => ({ children: s, tag: 'span' })))
      }
    })
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) {
      return
    }
    if (e.keyCode === 229) {
      return
    }
    if (e.key === 'Backspace') return backspace()
    if (e.key === 'ArrowLeft') return arrowLeft(e.shiftKey)
    if (e.key === 'ArrowRight') return arrowRight(e.shiftKey)
    if (e.key === 'ArrowUp') return arrowUp(e.shiftKey)
    if (e.key === 'ArrowDown') return arrowDown(e.shiftKey)
    if (e.key === 'Enter') return enter()
    if (metaKeyIfMacElseCtrlKey(e)) {
      if (e.key === 'z') {
        // eslint-disable-next-line plantain/promise-not-await
        return e.shiftKey ? redo() : undo()
      }
      if (e.key === 'v') {
        paste()
        e.preventDefault()
        return true
      }
    } else {
      if (e.key.length === 1) {
        inputText(e.key)
      }
      e.preventDefault()
    }
  }
  const onCompositionEnd = (e: React.CompositionEvent) => {
    inputText(e.data)
    if (cursorRef.current) {
      cursorRef.current.value = ''
    }
  }
  const getPathByPoint = (p: Position): readonly [number[], number] => {
    let last: { path: [number[], number], result: HtmlLayoutResult } | undefined
    if (layoutResults.current) {
      for (const r of iterateHtmlLayoutResults(layoutResults.current, [])) {
        const { path, result } = r
        if (
          p.x >= result.rect.x &&
          p.y >= result.rect.y &&
          p.x <= result.rect.x + result.rect.width &&
          p.y <= result.rect.y + result.rect.height
        ) {
          if (p.x < result.rect.x + result.rect.width / 2) {
            return path
          }
          return [path[0], path[1] + 1]
        }
        if (p.y < result.rect.y && p.y > result.rect.y - result.rect.height) {
          return path
        }
      }
    }
    return last?.path ?? endPath
  }
  const getPath = (e: React.MouseEvent): readonly [number[], number] => {
    const rect = rootRef.current?.getBoundingClientRect()
    const p = { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) }
    return getPathByPoint(p)
  }
  const downLocation = React.useRef<number[]>()
  const onMouseUp = (e: React.MouseEvent) => {
    onMouseMove(e)
    cursorRef.current?.focus()
    downLocation.current = undefined
  }
  const onMouseMove = (e: React.MouseEvent) => {
    e.preventDefault()
    if (downLocation.current === undefined) {
      return
    }
    const [pp, cp] = getPath(e)
    setParentPath(pp)
    setContentPath(cp)
    if (isSamePath([...pp, cp], downLocation.current)) {
      setSelectionStart(undefined)
    } else {
      setSelectionStart(downLocation.current)
    }
  }
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const [pp, cp] = getPath(e)
    if (e.shiftKey) {
      if (selectionStart === undefined) {
        setSelectionStart(fullPath)
      }
      setParentPath(pp)
      setContentPath(cp)
    } else {
      downLocation.current = [...pp, cp]
    }
  }
  useGlobalMouseUp(useEvent(() => {
    downLocation.current = undefined
  }))

  const layoutResults = React.useRef<HtmlLayoutResult[]>()
  React.useLayoutEffect(() => {
    if (!rootRef.current) return
    layoutResults.current = getHtmlLayout(rootRef.current.children, rootRef.current.getBoundingClientRect())
  }, [state, rootRef.current])
  React.useEffect(() => {
    if (!layoutResults.current) return
    const parentResult = getLayoutResultByPath(layoutResults.current, parentPath)
    let rect: Region | undefined
    if (parentResult) {
      if (contentPath === 0) {
        rect = parentResult[0].rect
      } else {
        const previous = parentResult[contentPath - 1].rect
        rect = {
          ...previous,
          x: previous.x + previous.width,
        }
      }
    }
    setCursorRect(rect)
  }, [layoutResults.current, parentPath, contentPath])

  let range: { min: { parent: number[], content: number, full: number[] }, max: { parent: number[], content: number, full: number[] } } | undefined
  if (selectionStart !== undefined) {
    const selection = { full: selectionStart, parent: selectionStart.slice(0, selectionStart.length - 1), content: selectionStart[selectionStart.length - 1] }
    const cursor = { full: fullPath, parent: parentPath, content: contentPath }
    range = comparePath(selectionStart, fullPath) > 0 ? { min: cursor, max: selection } : { min: selection, max: cursor }
  }
  const isSelected = (loc: number[]) => range && comparePath(loc, range.min.full) >= 0 && comparePath(loc, range.max.full) < 0
  const currentParent = getParentByPath(state, range?.max.parent ?? parentPath)
  const currentContent = currentParent?.[Math.max((range?.max.content ?? contentPath) - 1, 0)]
  const currentBlock = getParentHtmlElement(state, range?.max.parent ?? parentPath)
  const updateSelection = (recipe: (content: HtmlElementNode) => void) => {
    if (range) {
      setState(draft => {
        for (const { path, node } of iterateHtmlElementNodes(draft, [])) {
          if (isSelected(path)) {
            recipe(node)
          }
        }
      })
    }
  }
  const updateBlock = (tag: keyof JSX.IntrinsicElements) => {
    setState(draft => {
      const currentParentHtmlElement = getParentHtmlElement(draft, range?.max.parent ?? parentPath)
      if (currentParentHtmlElement) {
        currentParentHtmlElement.tag = tag
      }
    })
  }

  const render = (element: HtmlElementNode, index: number, path: number[]): JSX.Element => {
    if (typeof element.children === 'string') {
      return React.createElement(
        element.tag,
        {
          key: index,
          style: {
            ...element.style,
            backgroundColor: isSelected([...path, index]) ? '#B3D6FD' : element.style?.backgroundColor,
          },
        },
        element.children,
      )
    }
    path = [...path, index]
    return React.createElement(
      element.tag,
      {
        key: index,
        style: element.style,
      },
      [
        ...element.children.map((c, j) => {
          return render(c, j, path)
        }),
        <br key={-1} />
      ],
    )
  }

  return (
    <div style={{ position: 'relative', margin: '10px' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div>
          <Button
            style={{ fontWeight: currentContent?.style?.fontWeight === 'bold' ? 'bold' : undefined }}
            onClick={() => updateSelection(c => { if (!c.style) { c.style = {} }; c.style.fontWeight = currentContent?.style?.fontWeight !== 'bold' ? 'bold' : undefined })}
          >bold</Button>
          <Button
            style={{ fontWeight: currentContent?.style?.fontStyle === 'italic' ? 'bold' : undefined }}
            onClick={() => updateSelection(c => { if (!c.style) { c.style = {} }; c.style.fontStyle = currentContent?.style?.fontStyle !== 'italic' ? 'italic' : undefined })}
          >italic</Button>
          <Button
            style={{ fontWeight: currentContent?.style?.textDecoration === 'line-through' ? 'bold' : undefined }}
            onClick={() => updateSelection(c => { if (!c.style) { c.style = {} }; c.style.textDecoration = currentContent?.style?.textDecoration !== 'line-through' ? 'line-through' : undefined })}
          >line-through</Button>
          <Button
            style={{ fontWeight: currentContent?.style?.textDecoration === 'underline' ? 'bold' : undefined }}
            onClick={() => updateSelection(c => { if (!c.style) { c.style = {} }; c.style.textDecoration = currentContent?.style?.textDecoration !== 'underline' ? 'underline' : undefined })}
          >underline</Button>
          {(['code', 'mark', 'sub', 'sup'] as const).map(tag => (
            <Button
              key={tag}
              style={{ fontWeight: currentContent?.tag === tag ? 'bold' : undefined }}
              onClick={() => updateSelection(c => { c.tag = currentContent?.tag !== tag ? tag : 'span' })}
            >{tag}</Button>
          ))}
          {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'] as const).map(tag => (
            <Button
              key={tag}
              style={{ fontWeight: currentBlock?.tag === tag ? 'bold' : undefined }}
              onClick={() => updateBlock(tag)}
            >{tag}</Button>
          ))}
          <StringEditor type='color' value={currentContent?.style?.color ?? '#000000'} setValue={v => updateSelection(c => { if (!c.style) { c.style = {} }; c.style.color = v ? v : undefined })} />
          <StringEditor type='color' value={currentContent?.style?.backgroundColor ?? '#ffffff'} setValue={v => updateSelection(c => { if (!c.style) { c.style = {} }; c.style.backgroundColor = v ? v : undefined })} />
          <StringEditor value={currentContent?.style?.fontSize?.toString?.() ?? '16px'} setValue={v => updateSelection(c => { if (!c.style) { c.style = {} }; c.style.fontSize = v })} style={{ width: '50px' }} />
          <StringEditor value={currentContent?.style?.fontFamily ?? 'monospace'} setValue={v => updateSelection(c => { if (!c.style) { c.style = {} }; c.style.fontFamily = v })} style={{ width: '100px' }} />
        </div>
        <div
          style={{
            position: 'relative',
            width: props.width + 'px',
            height: props.height + 'px',
            border: '1px solid black',
            clipPath: 'inset(0px 0px)',
          }}
        >
          <Cursor
            ref={cursorRef}
            onKeyDown={onKeyDown}
            onCompositionEnd={onCompositionEnd}
            style={cursorRect ? {
              left: cursorRect.x + 'px',
              top: cursorRect.y + 'px',
              height: cursorRect.height + 'px',
            } : undefined}
          />
          <div
            style={{
              width: props.width + 'px',
              height: props.height + 'px',
              position: 'absolute',
              top: '0px',
              fontFamily: 'monospace',
              fontSize: '16px',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            ref={rootRef}
          >
            {state.map((s, i) => render(s, i, []))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * @public
 */
export interface HtmlElementNode {
  tag: keyof JSX.IntrinsicElements
  children: readonly HtmlElementNode[] | string
  style?: React.CSSProperties
}

function getHtmlLayout(elements: HTMLCollection, rootRect: DOMRect): HtmlLayoutResult[] {
  const result: HtmlLayoutResult[] = []
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    if (element.tagName === 'BR') {
      const rect = element.getBoundingClientRect()
      result.push({
        rect: {
          x: rect.x - rootRect.x,
          y: rect.y - rootRect.y,
          width: rect.width,
          height: rect.height,
        },
      })
      continue
    }
    // type-coverage:ignore-next-line
    const rect = getHtmlElementRect(element as HTMLElement)
    if (element.children.length === 0) {
      result.push({
        rect,
      })
    } else {
      result.push({
        rect,
        children: getHtmlLayout(element.children, rootRect)
      })
    }
  }
  return result
}

interface HtmlLayoutResult {
  children?: HtmlLayoutResult[]
  rect: Region
}

function* iterateHtmlLayoutResults(results: HtmlLayoutResult[], path: number[]): Generator<{ path: [number[], number], result: HtmlLayoutResult }, void, unknown> {
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (!result.children) {
      yield { result, path: [path, i] }
    } else {
      const childPath = [...path, i]
      yield* iterateHtmlLayoutResults(result.children, childPath)
    }
  }
}

function getHtmlElementRect(element: HTMLElement) {
  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  }
}

function comparePath(c1: number[], c2: number[]) {
  for (let i = 0; i < c1.length && i < c2.length; i++) {
    if (c1[i] < c2[i]) return -1
    if (c1[i] > c2[i]) return 1
  }
  return 0
}

function* iterateHtmlElementNodes(nodes: readonly HtmlElementNode[], path: number[]): Generator<{ path: number[], node: HtmlElementNode }, void, unknown> {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const childPath = [...path, i]
    yield { node, path: childPath }
    if (typeof node.children !== 'string') {
      yield* iterateHtmlElementNodes(node.children, childPath)
    }
  }
}

function getParentByPath(target: readonly HtmlElementNode[], path: number[]) {
  let result = target
  for (const p of path) {
    const children = result[p]?.children
    if (!children || typeof children === 'string') return
    result = children
  }
  return castDraft(result)
}

function getParentHtmlElement(target: readonly HtmlElementNode[], path: number[]) {
  let result: HtmlElementNode = {
    tag: 'div',
    children: target,
  }
  for (const p of path) {
    if (!result.children || typeof result.children === 'string') return
    result = result.children[p]
  }
  return castDraft(result)
}

function getLayoutResultByPath(target: HtmlLayoutResult[], path: number[]) {
  let result = target
  for (const p of path) {
    const children = result[p]?.children
    if (!children || typeof children === 'string') return
    result = children
  }
  return result
}

function getStartOrEndPath(target: readonly HtmlElementNode[], type: 'start' | 'end') {
  const result: number[] = []
  let children: string | readonly HtmlElementNode[] | undefined = target
  while (children && typeof children !== 'string') {
    const index: number = type === 'start' ? 0 : children.length - 1
    result.push(index)
    children = children[index]?.children
  }
  const index = result.length - 1
  return [
    result.slice(0, index),
    result[index] + (type === 'start' ? 0 : 1),
  ] as const
}
