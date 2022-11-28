import { castDraft } from "immer"
import React from "react"
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
  width: number
  height: number
}) {
  const { state, setState, undo, redo } = usePatchBasedUndoRedo<HtmlElementNode[], string>(props.initialState, '', {
    onChange({ newState }) {
      const parent = getParentByPath(newState, parentPath)
      if (parent && contentPath > parent.length) {
        setContentPath(parent.length)
      }
    },
  })
  const [parentPath, setParentPath] = React.useState<number[]>([0])
  const [contentPath, setContentPath] = React.useState<number>(0)
  const [selectionStart, setSelectionStart] = React.useState<number[]>()
  const cursorRef = React.useRef<HTMLInputElement | null>(null)
  const rootRef = React.useRef<HTMLInputElement | null>(null)
  const cursortRef = React.useRef<HTMLElement | null>(null)
  const cursorRight = React.useRef(false)
  const cursorRect = React.useRef<DOMRect>()
  const [cursorStyle, setCursorStyle] = React.useState<React.CSSProperties>()
  const fullPath = [...parentPath, contentPath]
  const endPath = getEndPath(state)

  const inputText = (text: string) => {
    const items: HtmlElementNode[] = [{ tag: 'span', children: text }]
    setContentPath(contentPath + items.length)
    setState(draft => {
      const parent = getParentByPath(draft, parentPath)
      if (parent) {
        parent.splice(contentPath, 0, ...castDraft(items))
      }
    })
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
  const getPathByPoint = (x: number, y: number) => {
    const element = document.elementFromPoint(x, y)
    if (!element) return
    // type-coverage:ignore-next-line
    const dataset = (element as HTMLElement).dataset
    if (!dataset.parentPath || !dataset.contentPath) return
    return {
      parentPath: dataset.parentPath.split(',').map(s => +s),
      contentPath: +dataset.contentPath,
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
    if (!cursorRect.current) return
    const rect = cursorRect.current
    const p = getPathByPoint(rect.x + rect.width / 2 + (cursorRight.current ? rect.width : 0), rect.y - rect.height * 0.5)
    if (!p) return
    setParentPath(p.parentPath)
    setContentPath(p.contentPath)
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
    if (!cursorRect.current) return
    const rect = cursorRect.current
    const p = getPathByPoint(rect.x + rect.width / 2 + (cursorRight.current ? rect.width : 0), rect.y + rect.height * 1.5)
    if (!p) return
    setParentPath(p.parentPath)
    setContentPath(p.contentPath)
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
  const downLocation = React.useRef<number[]>()
  const onMouseUp = (e: React.MouseEvent, pp: number[], cp: number) => {
    onMouseMove(e, pp, cp)
    cursorRef.current?.focus()
    downLocation.current = undefined
  }
  const onMouseMove = (e: React.MouseEvent, pp: number[], cp: number) => {
    e.stopPropagation()
    e.preventDefault()
    if (downLocation.current === undefined) {
      return
    }
    setParentPath(pp)
    setContentPath(cp)
    if (isSamePath([...pp, cp], downLocation.current)) {
      setSelectionStart(undefined)
    } else {
      setSelectionStart(downLocation.current)
    }
  }
  const onMouseDown = (e: React.MouseEvent, pp: number[], cp: number) => {
    e.stopPropagation()
    e.preventDefault()
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

  React.useLayoutEffect(() => {
    if (!cursortRef.current) return
    if (!rootRef.current) return
    const rect = cursortRef.current.getBoundingClientRect()
    cursorRect.current = rect
    const rootParentRect = rootRef.current.getBoundingClientRect()
    setCursorStyle({
      left: (rect.left - rootParentRect.left - 1 + (cursorRight.current ? rect.width : 0)) + 'px',
      top: (rect.top - rootParentRect.top) + 'px',
      height: rect.height + 'px',
    })
  }, [state, parentPath, contentPath, cursortRef.current, rootRef.current, cursorRight.current])

  let range: { min: { parent: number[], content: number, full: number[] }, max: { parent: number[], content: number, full: number[] } } | undefined
  if (selectionStart !== undefined) {
    const selection = { full: selectionStart, parent: selectionStart.slice(0, selectionStart.length - 1), content: selectionStart[selectionStart.length - 1] }
    const cursor = { full: fullPath, parent: parentPath, content: contentPath }
    range = comparePath(selectionStart, fullPath) > 0 ? { min: cursor, max: selection } : { min: selection, max: cursor }
  }
  const isSelected = (loc: number[]) => range && comparePath(loc, range.min.full) >= 0 && comparePath(loc, range.max.full) < 0

  const render = (element: HtmlElementNode, index: number, path: number[]): JSX.Element => {
    let ref: React.MutableRefObject<HTMLElement | null> | undefined
    if (typeof element.children === 'string') {
      if (isSamePath(path, parentPath)) {
        if (contentPath === 0 && index === 0) {
          ref = cursortRef
          cursorRight.current = false
        } else if (contentPath !== 0 && index === contentPath - 1) {
          ref = cursortRef
          cursorRight.current = true
        }
      }
      return React.createElement(
        element.tag,
        {
          key: index,
          ref,
          style: {
            backgroundColor: isSelected([...path, index]) ? '#B3D6FD' : undefined,
          },
          'data-parent-path': path.join(),
          'data-content-path': index,
          onMouseDown: (e: React.MouseEvent) => onMouseDown(e, path, getTargetContentPath(e, index)),
          onMouseMove: (e: React.MouseEvent) => onMouseMove(e, path, getTargetContentPath(e, index)),
          onMouseUp: (e: React.MouseEvent) => onMouseUp(e, path, getTargetContentPath(e, index)),
        },
        element.children,
      )
    }
    path = [...path, index]
    if (isSamePath(path, parentPath) && element.children.length === 0) {
      ref = cursortRef
      cursorRight.current = false
    }
    return React.createElement(
      element.tag,
      {
        key: index,
        ref,
        'data-parent-path': path.join(),
        'data-content-path': element.children.length,
        onMouseDown: (e: React.MouseEvent) => onMouseDown(e, path, element.children.length),
        onMouseMove: (e: React.MouseEvent) => onMouseMove(e, path, element.children.length),
        onMouseUp: (e: React.MouseEvent) => onMouseUp(e, path, element.children.length),
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
      <div style={{ display: 'flex' }}>
        <div
          style={{
            position: 'relative',
            width: props.width + 'px',
            height: props.height + 'px',
            border: '1px solid black',
            clipPath: 'inset(0px 0px)',
          }}
          ref={rootRef}
        >
          <div
            style={{
              width: props.width + 'px',
              height: props.height + 'px',
              position: 'absolute',
              top: '0px',
              fontFamily: 'monospace',
              fontSize: '16px',
            }}
            onMouseDown={e => onMouseDown(e, ...endPath)}
            onMouseMove={e => onMouseMove(e, ...endPath)}
            onMouseUp={e => onMouseUp(e, ...endPath)}
          >
            <Cursor
              ref={cursorRef}
              onKeyDown={onKeyDown}
              onCompositionEnd={onCompositionEnd}
              style={cursorStyle}
            />
            {state.map((s, i) => render(s, i, []))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface HtmlElementNode {
  tag: keyof JSX.IntrinsicElements
  children: HtmlElementNode[] | string
}

function getTargetContentPath(e: React.MouseEvent, index: number) {
  // type-coverage:ignore-next-line
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  return e.clientX - rect.left < rect.width / 2 ? index : index + 1
}

function comparePath(c1: number[], c2: number[]) {
  for (let i = 0; i < c1.length && i < c2.length; i++) {
    if (c1[i] < c2[i]) return -1
    if (c1[i] > c2[i]) return 1
  }
  return 0
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

function getEndPath(target: readonly HtmlElementNode[]) {
  const result: number[] = []
  let children: string | readonly HtmlElementNode[] | undefined = target
  while (children && typeof children !== 'string') {
    const index: number = children.length - 1
    result.push(index)
    children = children[index]?.children
  }
  const index = result.length - 1
  return [
    result.slice(0, index),
    result[index] + 1,
  ] as const
}
