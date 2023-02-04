import React from 'react';
import { Patch, enablePatches, produceWithPatches } from 'immer'
import { bindMultipleRefs, getTwoPointsDistance, metaKeyIfMacElseCtrlKey, Nullable, NumberEditor, ObjectEditor, Position, reverseTransformPosition, scaleByCursorPosition, Transform, useEvent, useKey, useLineClickCreate, usePatchBasedUndoRedo, useWheelScroll, useWheelZoom, useWindowSize } from "../../src";
import { BaseContent } from '../circuit-graph-editor/model';
import { Renderer } from './renderer';
import { isSphereContent, SphereContent } from './model';

enablePatches()

export const AstronomicalObjectSimulator = React.forwardRef((props: {
  operator: string
  initialState: readonly Nullable<BaseContent>[]
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
}, ref: React.ForwardedRef<AstronomicalObjectSimulatorRef>) => {
  const { width, height } = useWindowSize()
  const { state, setState, undo, redo, applyPatchFromOtherOperators, applyPatchFromSelf } = usePatchBasedUndoRedo(props.initialState, props.operator, {
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
  const [creating, setCreating] = React.useState(false)
  const assistentContents: BaseContent[] = []
  const previewPatches: Patch[] = []
  let panel: JSX.Element | undefined

  const { line, onClick: startCreate, reset: resetCreate, onMove } = useLineClickCreate(
    creating,
    (c) => {
      setState(draft => {
        const sphere: SphereContent = {
          type: 'sphere',
          x: c[0].x,
          y: c[0].y,
          z: 0,
          radius: getTwoPointsDistance(c[0], c[1]),
          speed: { x: 0, y: 0, z: 0 },
          mass: 1,
          color: 0xff0000,
        }
        draft.push(sphere)
      })
      reset()
    },
    {
      once: true,
    },
  )
  if (line) {
    const sphere: SphereContent = {
      type: 'sphere',
      x: line[0].x,
      y: line[0].y,
      z: 0,
      radius: getTwoPointsDistance(line[0], line[1]),
      speed: { x: 0, y: 0, z: 0 },
      mass: 1,
      color: 0xff0000,
    }
    assistentContents.push(sphere)
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
    setCreating(false)
    setHovering(undefined)
    setSelected(undefined)
  }
  useKey((e) => e.key === 'Escape', reset, [setCreating])
  useKey((k) => k.code === 'Backspace' && !k.shiftKey && !metaKeyIfMacElseCtrlKey(k), () => {
    if (hovering !== undefined) {
      setState(draft => {
        draft[hovering] = undefined
      })
      setHovering(undefined)
    } else if (selected !== undefined) {
      setState(draft => {
        draft[selected] = undefined
      })
      setSelected(undefined)
    }
  })
  const startCreation = () => {
    resetCreate()
    setCreating(true)
  }
  const getContentByPosition = (p: Position) => {
    for (let i = 0; i < state.length; i++) {
      const content = state[i]
      if (content && isSphereContent(content) && getTwoPointsDistance(content, p) <= content.radius) {
        return i
      }
    }
    return undefined
  }

  if (selected !== undefined) {
    const content = state[selected]
    if (content && isSphereContent(content)) {
      const update = (update: (content: BaseContent, contents: Nullable<BaseContent>[]) => void) => {
        const [, ...patches] = produceWithPatches(state, (draft) => {
          const content = draft[selected]
          if (content) {
            update(content, draft)
          }
        })
        applyPatchFromSelf(...patches)
      }
      panel = (
        <div style={{ position: 'absolute', right: '0px', top: '0px', bottom: '0px', width: '300px', overflowY: 'auto', background: 'white', zIndex: 11 }}>
          <div>{selected}</div>
          <ObjectEditor
            properties={{
              x: <NumberEditor value={content.x} setValue={(v) => update(c => { if (isSphereContent(c)) { c.x = v } })} />,
              y: <NumberEditor value={content.y} setValue={(v) => update(c => { if (isSphereContent(c)) { c.y = v } })} />,
              z: <NumberEditor value={content.z} setValue={(v) => update(c => { if (isSphereContent(c)) { c.z = v } })} />,
              radius: <NumberEditor value={content.radius} setValue={(v) => update(c => { if (isSphereContent(c)) { c.radius = v } })} />,
              mass: <NumberEditor value={content.mass} setValue={(v) => update(c => { if (isSphereContent(c)) { c.mass = v } })} />,
              color: <NumberEditor type='color' value={content.color} setValue={(v) => update(c => { if (isSphereContent(c)) { c.color = v } })} />,
              speed: <ObjectEditor
                inline
                properties={{
                  x: <NumberEditor value={content.speed.x} setValue={(v) => update(c => { if (isSphereContent(c)) { c.speed.x = v } })} />,
                  y: <NumberEditor value={content.speed.y} setValue={(v) => update(c => { if (isSphereContent(c)) { c.speed.y = v } })} />,
                  z: <NumberEditor value={content.speed.z} setValue={(v) => update(c => { if (isSphereContent(c)) { c.speed.z = v } })} />,
                }}
              />,
            }}
          />
        </div>
      )
    }
  }

  React.useImperativeHandle<AstronomicalObjectSimulatorRef, AstronomicalObjectSimulatorRef>(ref, () => ({
    handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }) {
      try {
        applyPatchFromOtherOperators(data.patches, data.reversePatches, data.operator)
      } catch (error) {
        console.error(error)
      }
    },
  }), [applyPatchFromOtherOperators])

  const onClick = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = reverseTransformPosition(viewportPosition, transform)
    if (creating) {
      startCreate(p)
    } else if (hovering !== undefined) {
      setSelected(hovering)
      setHovering(undefined)
    }
  })
  const onMouseMove = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = reverseTransformPosition(viewportPosition, transform)
    if (creating) {
      onMove(p, viewportPosition)
    } else {
      setHovering(getContentByPosition(p))
    }
  })

  return (
    <>
      <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
        <div style={{ position: 'absolute', inset: '0px', cursor: 'crosshair' }} onMouseMove={onMouseMove}>
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
            previewPatches={previewPatches}
            onClick={onClick}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{
            width: '20px',
            height: '20px',
            margin: '5px',
            cursor: 'pointer',
            display: 'inline-block',
            color: creating ? 'red' : undefined,
          }} onClick={startCreation}>create</span>
        </div>
      </div>
      {panel}
    </>
  )
})

export interface AstronomicalObjectSimulatorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
}
