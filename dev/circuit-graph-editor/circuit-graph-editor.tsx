import { enablePatches } from 'immer'
import React from 'react';
import { bindMultipleRefs, getTwoPointsDistance, metaKeyIfMacElseCtrlKey, Nullable, Position, reverseTransformPosition, scaleByCursorPosition, Transform, useEvent, useKey, useLineClickCreate, usePatchBasedUndoRedo, useWheelScroll, useWheelZoom, useWindowSize } from "../../src";
import { BaseContent, CircleContent, isJunctionContent, JunctionContent, modelCenter, registerModel } from "./model";
import { powerModel } from "./plugins/power";
import { resistanceModel } from './plugins/resistance';
import { Renderer } from './renderer';

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

enablePatches()

registerModel(powerModel)
registerModel(resistanceModel)

export function CircuitGraphEditor(props: {
  initialState: readonly Nullable<BaseContent>[]
  onChange?: (state: readonly Nullable<BaseContent>[]) => void
}) {
  const { width, height } = useWindowSize()
  const { state, setState, undo, redo } = usePatchBasedUndoRedo(props.initialState, me, {
    onChange({ newState }) {
      props.onChange?.(newState)
    },
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
  const [operation, setOperation] = React.useState<string>()
  const [snapPoint, setSnapPoint] = React.useState<{ id: number, point: Position }>()
  const model = operation ? modelCenter[operation] : undefined
  const assistentContents: BaseContent[] = []

  const startJunctionId = React.useRef<number>()
  const endJunctionId = React.useRef<number>()
  const { line, onClick: startOperation, onMove } = useLineClickCreate(
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
      getAngleSnap: angle => {
        const snap = Math.round(angle / 90) * 90
        if (snap !== angle && Math.abs(snap - angle) < 5) {
          return snap
        }
        return undefined
      },
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
  }
  useKey((e) => e.key === 'Escape', reset, [setOperation, setSnapPoint])

  const getSnapPoint = (p: Position): { id?: number, point: Position } => {
    for (let i = 0; i < state.length; i++) {
      const content = state[i]
      if (content && isJunctionContent(content) && getTwoPointsDistance(content.position, p) <= 5) {
        const r = {
          id: i,
          point: content.position
        }
        setSnapPoint(r)
        return r
      }
    }
    setSnapPoint(undefined)
    return { point: p }
  }
  if (snapPoint) {
    assistentContents.push({
      type: 'circle',
      x: snapPoint.point.x,
      y: snapPoint.point.y,
      radius: 7,
    } as CircleContent)
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
    }
  })
  const onMouseMove = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = reverseTransformPosition(viewportPosition, transform)
    if (operation) {
      const s = getSnapPoint(p)
      onMove(s.point, viewportPosition)
    }
  })
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
            onClick={onClick}
          />
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        {Object.values(modelCenter).filter(p => p.createPreview).map((p) => (
          <span
            key={p.type}
            onClick={() => setOperation(p.type)}
            style={{
              width: '20px',
              height: '20px',
              margin: '5px',
              cursor: 'pointer',
              color: operation === p.type ? 'red' : undefined,
            }}
          >
            {p.type}
          </span>
        ))}
      </div>
    </>
  )
}
