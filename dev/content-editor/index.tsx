import React from 'react'
import { Scrollbar, useWheelScroll, useWheelZoom, useUndoRedo, bindMultipleRefs, useDragMove, useZoom, useDragRotate, useDragResize, useDragSelect, AlignmentLine, useRegionAlignment, useLineAlignment, Position, Size, useSelected, isSamePath, metaKeyIfMacElseCtrlKey, useGlobalKeyDown } from '../../src'
import { styleGuide } from './data'
import { HoverRenderer } from './hover'
import { StyleGuide } from './model'
import { StyleGuideRenderer } from './renderer'
import { SelectionRenderer } from './selection'
import { getSelectedSize, getTargetByPath, selectByPosition, getSelectedPosition, selectTemplateByArea } from './util'

const draftKey = 'composable-editor-canvas-draft'
const draftState = localStorage.getItem(draftKey)

export function App() {
  const { state, setState, undo, redo, stateIndex } = useUndoRedo(draftState ? JSON.parse(draftState) as StyleGuide : styleGuide)

  React.useEffect(() => {
    if (stateIndex > 0) {
      localStorage.setItem(draftKey, JSON.stringify(state))
    }
  }, [state, stateIndex])

  const targetPosition = {
    x: Math.min(...state.templates.map((t) => t.x)),
    y: Math.min(...state.templates.map((t) => t.y)),
  }
  const [targetSize] = React.useState({
    width: Math.max(...state.templates.map((t) => t.x + t.width)) - targetPosition.x,
    height: Math.max(...state.templates.map((t) => t.y + t.height)) - targetPosition.y,
  })
  const containerSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
  const { ref: wheelZoomRef, scale: relativeScale, setScale: setRelativeScale } = useWheelZoom<HTMLDivElement>()
  const padding = 80
  const initialScale = Math.min((containerSize.width - padding) / targetSize.width, (containerSize.height - padding) / targetSize.height)
  const scale = relativeScale * initialScale
  const contentSize = {
    width: targetSize.width * scale + padding,
    height: targetSize.height * scale + padding,
  }

  const { x, y, setX, setY, ref: wheelScrollRef } = useWheelScroll<HTMLDivElement>({
    maxOffsetX: (contentSize.width - containerSize.width) / 2,
    maxOffsetY: (contentSize.height - containerSize.height) / 2,
  })
  const { zoomIn, zoomOut } = useZoom(relativeScale, setRelativeScale)

  const { selected: [selected], setSelected, onSelectedKeyDown } = useSelected<number[]>({ maxCount: 1 })
  const { selected: [hovered], setSelected: setHovered, onSelectedKeyDown: onHoveredKeyDown } = useSelected<number[]>({ maxCount: 1 })
  const transform = {
    containerSize,
    targetSize,
    x,
    y,
    scale,
  }

  const target = getSelectedSize(selected, state)
  const selectedTarget = getTargetByPath(selected, state)
  const parentRotate = selectedTarget?.kind === 'content' ? selectedTarget.parents.reduce((p, c) => p + (c.rotate ?? 0), 0) : undefined

  const { regionAlignmentX, regionAlignmentY, changeOffsetByRegionAlignment, clearRegionAlignments } = useRegionAlignment(6 / scale)
  const { offset: moveOffset, onStart: onStartMove, mask: dragMoveMask, startPosition: dragMoveStartPosition, resetDragMove } = useDragMove(
    () => {
      clearRegionAlignments()
      if (moveOffset.x === 0 && moveOffset.y === 0 && dragMoveStartPosition) {
        setSelected(selectByPosition(state, transformPosition(dragMoveStartPosition, transform), scale))
        return
      }
      setState((draft) => {
        const position = getSelectedPosition(selected, draft)
        if (position) {
          position.x += moveOffset.x
          position.y += moveOffset.y
        }
      })
    },
    {
      scale,
      parentRotate,
      transformOffset: (f, e) => {
        if (e && !e.shiftKey && selectedTarget?.kind === 'template') {
          const template = selectedTarget.template
          changeOffsetByRegionAlignment(f, template, state.templates.filter((t) => t !== template))
        } else {
          clearRegionAlignments()
        }
        return f
      },
    },
  )

  const { offset: rotateOffset, onStart: onStartRotate, mask: dragRotateMask, center, resetDragRotate } = useDragRotate(
    () => {
      setState((draft) => {
        const target = getTargetByPath(selected, draft)
        if (target?.kind === 'content') {
          target.content.rotate = rotateOffset?.angle
        }
      })
    },
    {
      transform: (p) => transformPosition(p, transform),
      parentRotate,
      transformOffset: (r, e) => {
        if (e && r !== undefined && !e.shiftKey) {
          const snap = Math.round(r / 45) * 45
          if (Math.abs(snap - r) < 5) {
            r = snap
          }
        }
        return r
      },
    },
  )

  const { lineAlignmentX, lineAlignmentY, changeOffsetByLineAlignment, clearLineAlignments } = useLineAlignment(6 / scale)
  const { offset: resizeOffset, onStart: onStartResize, mask: dragResizeMask, startPosition: dragResizeStartPosition, resetDragResize } = useDragResize(
    () => {
      clearLineAlignments()
      setState((draft) => {
        const size = getSelectedSize(selected, draft)
        const position = getSelectedPosition(selected, draft)
        if (size) {
          size.width += resizeOffset.width
          size.height += resizeOffset.height
        }
        if (position) {
          position.x += resizeOffset.x
          position.y += resizeOffset.y
        }
      })
    },
    {
      centeredScaling: (e) => e.shiftKey,
      keepRatio: (e) => {
        if (metaKeyIfMacElseCtrlKey(e) && target) {
          return target.width / target.height
        }
        return undefined
      },
      rotate: selectedTarget?.kind === 'content' ? selectedTarget.content.rotate ?? 0 : 0,
      parentRotate,
      transform: (p) => transformPosition(p, transform),
      transformOffset: (f, e, direction) => {
        if (e && direction && !e.altKey && selectedTarget?.kind === 'template') {
          const template = selectedTarget.template
          const xLines = state.templates.filter((t) => t !== template).map((t) => [t.x, t.x + t.width]).flat()
          const yLines = state.templates.filter((t) => t !== template).map((t) => [t.y, t.y + t.height]).flat()
          changeOffsetByLineAlignment(f, direction, template, xLines, yLines)
        } else {
          clearLineAlignments()
        }
        return f
      }
    },
  )

  const { onStartSelect, dragSelectMask, dragSelectStartPosition, resetDragSelect } = useDragSelect((dragSelectStartPosition, dragSelectEndPosition) => {
    if (!dragSelectEndPosition) {
      setSelected(selectByPosition(state, transformPosition(dragSelectStartPosition, transform), scale))
    } else {
      const index = selectTemplateByArea(state, transformPosition(dragSelectStartPosition, transform), transformPosition(dragSelectEndPosition, transform))
      if (index !== undefined) {
        setSelected([index])
      }
    }
  }, (e) => e.shiftKey)

  useGlobalKeyDown(e => {
    onSelectedKeyDown(e)
    onHoveredKeyDown(e)
    if (e.key === 'Escape') {
      resetDragSelect()
      resetDragRotate()
      resetDragResize()
      resetDragMove()
    } else if ( metaKeyIfMacElseCtrlKey(e)) {
      if (e.code === 'KeyZ') {
        if (e.shiftKey) {
          redo(e)
        } else {
          undo(e)
        }
      } else if (e.code === 'Minus') {
        zoomOut(e)
      } else if (e.code === 'Equal') {
        zoomIn(e)
      }
    }
  })

  const offset = {
    x: moveOffset.x + resizeOffset.x,
    y: moveOffset.y + resizeOffset.y,
    width: resizeOffset.width,
    height: resizeOffset.height,
  }
  const dragging = dragMoveStartPosition || center || dragResizeStartPosition || dragSelectStartPosition

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
        if (dragging) {
          setHovered()
        } else {
          const path = selectByPosition(state, transformPosition({ x: e.clientX, y: e.clientY }, transform), scale)
          if (!isSamePath(path, hovered)) {
            setHovered(path)
          }
        }
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
        rotate={rotateOffset?.angle}
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
          rotate={rotateOffset?.angle}
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
      <AlignmentLine type='x' value={regionAlignmentX ?? lineAlignmentX} transformX={(x) => reverseTransformX(x, transform)} />
      <AlignmentLine type='y' value={regionAlignmentY ?? lineAlignmentY} transformY={(y) => reverseTransformY(y, transform)} />
      {dragMoveMask}
      {dragRotateMask}
      {dragResizeMask}
      {dragSelectMask}
    </div>
  )
}

function reverseTransformX(
  x: number,
  transform?: Partial<Transform>,
) {
  return (transform?.containerSize?.width ?? 0) / 2 - ((transform?.targetSize?.width ?? 0) / 2 - x) * (transform?.scale ?? 1) + (transform?.x ?? 0)
}

function reverseTransformY(
  y: number,
  transform?: Partial<Transform>,
) {
  return (transform?.containerSize?.height ?? 0) / 2 - ((transform?.targetSize?.height ?? 0) / 2 - y) * (transform?.scale ?? 1) + (transform?.y ?? 0)
}

function transformPosition(
  { x, y }: Position,
  transform?: Partial<Transform>,
) {
  const positionX = (transform?.targetSize?.width ?? 0) / 2 - ((transform?.containerSize?.width ?? 0) / 2 - x + (transform?.x ?? 0)) / (transform?.scale ?? 1)
  const positionY = (transform?.targetSize?.height ?? 0) / 2 - ((transform?.containerSize?.height ?? 0) / 2 - y + (transform?.y ?? 0)) / (transform?.scale ?? 1)
  return {
    x: positionX,
    y: positionY,
  }
}

interface Transform extends Position {
  containerSize: Size
  targetSize: Size
  scale: number
}
