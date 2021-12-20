import { WritableDraft } from 'immer/dist/types/types-external'
import React from 'react'
import * as ReactDOM from 'react-dom'
import { useKey } from 'react-use'
import { Scrollbar, useWheelScroll, useWheelZoom, useUndoRedo, bindMultipleRefs, useDragMove, useZoom, useDragRotate, useDragResize, transformPosition, useDragSelect } from '../src'
import { styleGuide } from './data'
import { HoverRenderer } from './hover'
import { CanvasSelection, Region } from './model'
import { StyleGuideRenderer } from './renderer'
import { SelectionRenderer } from './selection'
import { selectContentOrTemplateByPosition, selectTemplateByArea } from './utils'

function App() {
  const [relativeScale, setRelativeScale] = React.useState(1)
  const [x, setX] = React.useState(0)
  const [y, setY] = React.useState(0)
  const { state, setState, undo, redo } = useUndoRedo(styleGuide)

  const targetPosition = {
    x: Math.min(...state.templates.map((t) => t.x)),
    y: Math.min(...state.templates.map((t) => t.y)),
  }
  const targetSize = {
    width: Math.max(...state.templates.map((t) => t.x + t.width)) - targetPosition.x,
    height: Math.max(...state.templates.map((t) => t.y + t.height)) - targetPosition.y,
  }
  const containerSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
  const padding = 80
  const initialScale = Math.min((containerSize.width - padding) / targetSize.width, (containerSize.height - padding) / targetSize.height)
  const scale = relativeScale * initialScale
  const contentSize = {
    width: targetSize.width * scale + padding,
    height: targetSize.height * scale + padding,
  }

  const wheelScrollRef = useWheelScroll<HTMLDivElement>(
    setX,
    setY,
    (contentSize.width - containerSize.width) / 2,
    (contentSize.height - containerSize.height) / 2,
  )
  const wheelZoomRef = useWheelZoom<HTMLDivElement>(setRelativeScale)
  const isMacKeyboard = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  useKey((k) => k.code === 'KeyZ' && (isMacKeyboard ? k.metaKey : k.ctrlKey), undo)
  useKey((k) => k.code === 'KeyZ' && k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), redo)

  const { zoomIn, zoomOut } = useZoom(relativeScale, setRelativeScale)
  useKey((k) => k.code === 'Minus' && (isMacKeyboard ? k.metaKey : k.ctrlKey), zoomOut)
  useKey((k) => k.code === 'Equal' && (isMacKeyboard ? k.metaKey : k.ctrlKey), zoomIn)

  const [selected, setSelected] = React.useState<CanvasSelection>()
  const [hovered, setHovered] = React.useState<CanvasSelection>()
  const transform = {
    containerSize,
    targetSize,
    x,
    y,
    scale,
  }

  const selectByPosition = (position: { x: number, y: number }): CanvasSelection | undefined => {
    const region = selectContentOrTemplateByPosition(state, transformPosition(position, transform))
    if (region) {
      const templateIndex = state.templates.findIndex((t) => t === region.region.template)
      if (region.kind === 'template') {
        return {
          kind: 'template',
          templateIndex,
        }
      } else {
        return {
          kind: 'content',
          templateIndex,
          contentIndex: region.region.index,
        }
      }
    }
    return undefined
  }

  const [moveOffset, setMoveOffset] = React.useState({ x: 0, y: 0 })
  const { onStartMove, dragMoveMask, dragMoveStartPosition } = useDragMove(setMoveOffset, scale, () => {
    if (moveOffset.x === 0 && moveOffset.y === 0 && dragMoveStartPosition) {
      setSelected(selectByPosition(dragMoveStartPosition))
      return
    }
    setState((draft) => {
      if (selected) {
        const template = draft.templates[selected.templateIndex]
        if (selected.kind === 'content') {
          template.contents[selected.contentIndex].x += moveOffset.x
          template.contents[selected.contentIndex].y += moveOffset.y
        } else {
          template.x += moveOffset.x
          template.y += moveOffset.y
        }
      }
    })
    setMoveOffset({ x: 0, y: 0 })
  })

  const [rotate, setRotate] = React.useState<number>()
  const { onStartRotate, dragRotateMask, dragRotateCenter } = useDragRotate(
    setRotate,
    () => {
      setState((draft) => {
        if (selected && selected.kind === 'content') {
          draft.templates[selected.templateIndex].contents[selected.contentIndex].rotate = rotate
        }
      })
      setRotate(undefined)
    },
    transform,
  )

  const [resizeOffset, setResizeOffset] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
  const { onStartResize, dragResizeMask, dragResizeStartPosition } = useDragResize(
    setResizeOffset,
    (e) => e.shiftKey,
    selected?.kind === 'content' ? state.templates[selected.templateIndex].contents[selected.contentIndex].rotate ?? 0 : 0,
    () => {
      setState((draft) => {
        if (selected) {
          const template = draft.templates[selected.templateIndex]
          let target: WritableDraft<Region> | undefined
          if (selected.kind === 'content') {
            const content = template.contents[selected.contentIndex]
            if (content.kind === 'snapshot') {
              target = content.snapshot
            } else if (content.kind !== 'reference') {
              target = content
            }
          } else {
            target = template
          }
          if (target) {
            target.width += resizeOffset.width
            target.height += resizeOffset.height
            target.x += resizeOffset.x
            target.y += resizeOffset.y
          }
        }
      })
      setResizeOffset({ x: 0, y: 0, width: 0, height: 0 })
    },
    transform,
  )

  const { onStartSelect, dragSelectMask, dragSelectStartPosition } = useDragSelect<CanvasSelection | undefined>((dragSelectStartPosition, dragSelectEndPosition) => {
    if (!dragSelectEndPosition) {
      setSelected(dragSelectStartPosition.data)
    } else {
      const template = selectTemplateByArea(state, transformPosition(dragSelectStartPosition, transform), transformPosition(dragSelectEndPosition, transform))
      if (template) {
        setSelected({ kind: 'template', templateIndex: state.templates.findIndex((t) => t === template) })
      }
    }
  })

  const offset = {
    x: moveOffset.x + resizeOffset.x,
    y: moveOffset.y + resizeOffset.y,
    width: resizeOffset.width,
    height: resizeOffset.height,
  }
  const dragging = dragMoveStartPosition || dragRotateCenter || dragResizeStartPosition || dragSelectStartPosition

  return (
    <div
      style={{
        position: 'absolute',
        inset: '0px',
        backgroundColor: '#E0DFDE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}
      onMouseMove={(e) => {
        setHovered(dragging ? undefined : selectByPosition({ x: e.clientX, y: e.clientY }))
      }}
      onMouseDown={(e) => {
        onStartSelect(e, undefined)
      }}
    >
      <StyleGuideRenderer
        styleGuide={state}
        targetSize={targetSize}
        x={x}
        y={y}
        scale={scale}
        onStartSelect={onStartSelect}
        offset={offset}
        rotate={rotate}
        selected={selected}
      />
      {selected && <div
        style={{
          position: 'absolute',
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          width: targetSize.width,
          height: targetSize.height,
          pointerEvents: 'none',
        }}
      >
        <SelectionRenderer
          styleGuide={state}
          scale={scale}
          selected={selected}
          onStartMove={onStartMove}
          offset={offset}
          rotate={rotate}
          onStartRotate={onStartRotate}
          onStartResize={onStartResize}
        />
      </div>}
      {hovered && <div
        style={{
          position: 'absolute',
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          width: targetSize.width,
          height: targetSize.height,
          pointerEvents: 'none',
        }}
      >
        <HoverRenderer
          styleGuide={state}
          hovered={hovered}
        />
      </div>}
      <Scrollbar
        value={x}
        type='horizontal'
        containerSize={containerSize.width}
        contentSize={contentSize.width}
        onChange={setX}
      />
      <Scrollbar
        value={y}
        type='vertical'
        containerSize={containerSize.height}
        contentSize={contentSize.height}
        onChange={setY}
      />
      {dragMoveMask}
      {dragRotateMask}
      {dragResizeMask}
      {dragSelectMask}
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('container'))
