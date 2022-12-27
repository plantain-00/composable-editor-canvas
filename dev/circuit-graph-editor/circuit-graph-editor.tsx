import { enablePatches } from 'immer'
import React from 'react';
import { Patch } from 'immer'
import { bindMultipleRefs, equals, getAngleSnapPosition, getPointAndLineSegmentMinimumDistance, getTwoNumbersDistance, getTwoPointsDistance, metaKeyIfMacElseCtrlKey, Nullable, Position, reverseTransformPosition, scaleByCursorPosition, Transform, useEvent, useKey, useLineClickCreate, usePatchBasedUndoRedo, useWheelScroll, useWheelZoom, useWindowSize } from "../../src";
import { BaseContent, CircleContent, contentIsReferenced, getContentModel, isJunctionContent, JunctionContent, LineContent, modelCenter, registerModel } from "./model";
import { powerModel } from "./plugins/power";
import { resistanceModel } from './plugins/resistance';
import { wireModel } from './plugins/wire';
import { Renderer } from './renderer';

enablePatches()

registerModel(powerModel)
registerModel(resistanceModel)
registerModel(wireModel)

export const CircuitGraphEditor = React.forwardRef((props: {
  operator: string
  initialState: readonly Nullable<BaseContent>[]
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
}, ref: React.ForwardedRef<CircuitGraphEditorRef>) => {
  const { width, height } = useWindowSize()
  const { state, setState, undo, redo, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, props.operator, {
    onApplyPatchesFromSelf: props.onApplyPatchesFromSelf,
  })
  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>()
  const { scale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    min: 0.001,
    onChange(oldScale, newScale, cursor) {
      const result = scaleByCursorPosition({ width, height }, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })
  const [hovering, setHovering] = React.useState<number>()
  const [selected, setSelected] = React.useState<number>()
  const [operation, setOperation] = React.useState<string>()
  const [snapPoint, setSnapPoint] = React.useState<{ type: 'point', id: number, point: Position } | { type: 'line', point: Position, start: Position }>()
  const model = operation ? modelCenter[operation] : undefined
  const assistentContents: BaseContent[] = []

  const startJunctionId = React.useRef<number>()
  const endJunctionId = React.useRef<number>()
  const { line, onClick: startOperation, onMove, lastPosition } = useLineClickCreate(
    operation !== undefined,
    (c) => {
      setState(draft => {
        if (!model?.createPreview) {
          return
        }
        let startId: number
        let endId: number
        let index = state.length
        if (startJunctionId.current === undefined) {
          const p1: JunctionContent = {
            type: 'junction',
            position: c[0],
          }
          draft.push(p1)
          startId = index
          index++
        } else {
          startId = startJunctionId.current
        }
        if (endJunctionId.current === undefined) {
          const p1: JunctionContent = {
            type: 'junction',
            position: c[1],
          }
          draft.push(p1)
          endId = index
          index++
        } else {
          endId = endJunctionId.current
        }
        draft.push(model.createPreview({
          start: startId,
          end: endId,
        }))
      })
      reset()
    },
    {
      once: true,
    },
  )
  if (line && model?.createPreview) {
    const p1: JunctionContent = {
      type: 'junction',
      position: line[0],
    }
    const p2: JunctionContent = {
      type: 'junction',
      position: line[1],
    }
    assistentContents.push(
      p1,
      p2,
      model.createPreview({
        start: p1,
        end: p2,
      }),
    )
  }

  const transform: Transform = {
    x,
    y,
    scale,
    center: {
      x: width / 2,
      y: height / 2,
    },
  }
  useKey((k) => k.code === 'KeyZ' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    undo(e)
  })
  useKey((k) => k.code === 'KeyZ' && k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    redo(e)
  })
  const reset = () => {
    setOperation(undefined)
    startJunctionId.current = undefined
    endJunctionId.current = undefined
    setSnapPoint(undefined)
    setHovering(undefined)
    setSelected(undefined)
  }
  useKey((e) => e.key === 'Escape', reset, [setOperation, setSnapPoint])
  useKey((k) => k.code === 'Backspace' && !k.shiftKey && !metaKeyIfMacElseCtrlKey(k), () => {
    if (selected !== undefined && !contentIsReferenced(selected, state)) {
      setState(draft => {
        draft[selected] = undefined
      })
      setSelected(undefined)
    }
  })

  const getSnapPoint = (p: Position): { id?: number, point: Position } => {
    for (let i = 0; i < state.length; i++) {
      const content = state[i]
      if (content && isJunctionContent(content) && getTwoPointsDistance(content.position, p) <= 5) {
        const r = {
          type: 'point' as const,
          id: i,
          point: content.position
        }
        setSnapPoint(r)
        return r
      }
    }
    if (lastPosition) {
      p = getAngleSnapPosition(lastPosition, p, angle => {
        const snap = Math.round(angle / 90) * 90
        if (snap !== angle && Math.abs(snap - angle) < 5) {
          return snap
        }
        return undefined
      })
      if (equals(lastPosition.x, p.x)) {
        for (const content of state) {
          if (content && isJunctionContent(content) && getTwoNumbersDistance(p.y, content.position.y) <= 5) {
            const r = {
              type: 'line' as const,
              point: {
                x: p.x,
                y: content.position.y,
              },
              start: content.position,
            }
            setSnapPoint(r)
            return r
          }
        }
      } else if (equals(lastPosition.y, p.y)) {
        for (const content of state) {
          if (content && isJunctionContent(content) && getTwoNumbersDistance(p.x, content.position.x) <= 5) {
            const r = {
              type: 'line' as const,
              point: {
                x: content.position.x,
                y: p.y,
              },
              start: content.position,
            }
            setSnapPoint(r)
            return r
          }
        }
      }
    }
    setSnapPoint(undefined)
    return { point: p }
  }
  if (snapPoint?.type === 'point') {
    assistentContents.push({
      type: 'circle',
      x: snapPoint.point.x,
      y: snapPoint.point.y,
      radius: 7,
    } as CircleContent)
  }
  if (snapPoint?.type === 'line') {
    assistentContents.push({
      type: 'line',
      p1: snapPoint.start,
      p2: snapPoint.point,
    } as LineContent)
  }
  const getContentByPosition = (p: Position) => {
    for (let i = 0; i < state.length; i++) {
      const content = state[i]
      if (content) {
        if (isJunctionContent(content)) {
          if (getTwoPointsDistance(content.position, p) < 4) {
            return i
          }
        } else {
          const geometries = getContentModel(content)?.getGeometries?.(content, state)
          if (geometries) {
            for (const line of geometries.lines) {
              const minDistance = getPointAndLineSegmentMinimumDistance(p, ...line)
              if (minDistance <= 3) {
                return i
              }
            }
          }
        }
      }
    }
    return undefined
  }
  const onClick = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = reverseTransformPosition(viewportPosition, transform)
    if (operation) {
      const s = getSnapPoint(p)
      if (line === undefined) {
        startJunctionId.current = s.id
      } else {
        endJunctionId.current = s.id
      }
      startOperation(s.point)
    } else if (hovering !== undefined) {
      setSelected(hovering)
      setHovering(undefined)
    }
  })
  const onMouseMove = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = reverseTransformPosition(viewportPosition, transform)
    if (operation) {
      const s = getSnapPoint(p)
      onMove(s.point, viewportPosition)
    } else {
      setHovering(getContentByPosition(p))
    }
  })

  React.useImperativeHandle<CircuitGraphEditorRef, CircuitGraphEditorRef>(ref, () => ({
    handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }) {
      try {
        applyPatchFromOtherOperators(data.patches, data.reversePatches, data.operator)
      } catch (error) {
        console.error(error)
      }
    },
  }), [applyPatchFromOtherOperators])

  return (
    <>
      <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
        <div style={{ position: 'absolute', inset: '0px' }} onMouseMove={onMouseMove}>
          <Renderer
            contents={state}
            x={transform.x}
            y={transform.y}
            scale={transform.scale}
            width={width}
            height={height}
            assistentContents={assistentContents}
            hovering={hovering}
            selected={selected}
            onClick={onClick}
          />
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        {Object.values(modelCenter).filter(p => p.createPreview).map((p) => {
          if (p.icon) {
            const svg = React.cloneElement<React.HTMLAttributes<unknown>>(p.icon, {
              onClick: () => setOperation(p.type),
              key: p.type,
              style: {
                width: '20px',
                height: '20px',
                margin: '5px',
                cursor: 'pointer',
                color: operation === p.type ? 'red' : undefined,
              },
            })
            return (
              <span title={p.type} key={p.type}>
                {svg}
              </span>
            )
          }
          return null
        })}
      </div>
    </>
  )
})

export interface CircuitGraphEditorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
}
