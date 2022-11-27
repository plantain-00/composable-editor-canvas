import { castDraft } from "immer"
import React from "react"
import { Cursor } from "./cursor"
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
  const cursorRef = React.useRef<HTMLInputElement | null>(null)
  const rootRef = React.useRef<HTMLInputElement | null>(null)
  const cursortRef = React.useRef<HTMLElement | null>(null)
  const cursorRight = React.useRef(false)
  const cursorRect = React.useRef<DOMRect>()
  const [cursorStyle, setCursorStyle] = React.useState<React.CSSProperties>()

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
  const arrowLeft = () => {
    if (contentPath !== 0) {
      setContentPath(contentPath - 1)
    }
  }
  const arrowRight = () => {
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
  const arrowUp = () => {
    if (!cursorRect.current) return
    const rect = cursorRect.current
    const p = getPathByPoint(rect.x + rect.width / 2 + (cursorRight.current ? rect.width : 0), rect.y - rect.height * 0.5)
    if (!p) return
    setParentPath(p.parentPath)
    setContentPath(p.contentPath)
  }
  const arrowDown = () => {
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
    if (e.key === 'ArrowLeft') return arrowLeft()
    if (e.key === 'ArrowRight') return arrowRight()
    if (e.key === 'ArrowUp') return arrowUp()
    if (e.key === 'ArrowDown') return arrowDown()
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
  const onMouseUp = () => {
    cursorRef.current?.focus()
  }
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
          'data-parent-path': path.join(),
          'data-content-path': index,
          onClick: (e: React.MouseEvent) => {
            // type-coverage:ignore-next-line
            const rect = (e.target as HTMLElement).getBoundingClientRect()
            setParentPath(path)
            setContentPath(e.clientX - rect.left < rect.width / 2 ? index : index + 1)
            e.stopPropagation()
          },
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
        onClick: (e: React.MouseEvent) => {
          setParentPath(path)
          setContentPath(element.children.length)
          e.stopPropagation()
        },
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
            onMouseUp={onMouseUp}
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

function getParentByPath(target: readonly HtmlElementNode[], path: number[]) {
  let result = target
  for (const p of path) {
    const children = result[p]?.children
    if (!children || typeof children === 'string') return
    result = children
  }
  return castDraft(result)
}
