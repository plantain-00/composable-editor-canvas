import React from 'react';
import { produce, Patch, enablePatches, produceWithPatches } from 'immer'
import { v3 } from 'twgl.js'
import { bindMultipleRefs, Button, colorNumberToPixelColor, EditPoint, getPointByLengthAndAngle, getTwoPointsDistance, metaKeyIfMacElseCtrlKey, Nullable, NumberEditor, ObjectEditor, pixelColorToColorNumber, Position, reverseTransformPosition, scaleByCursorPosition, Transform, useDragMove, useEdit, useEvent, useKey, useLineClickCreate, usePatchBasedUndoRedo, useRefState, useRefState2, useWheelScroll, useWheelZoom, useWindowSize } from "../../src";
import { BaseContent } from '../circuit-graph-editor/model';
import { Renderer } from './renderer';
import { isSphereContent, Position3D, SphereContent } from './model';
import { Renderer3d, Renderer3dRef } from './renderer-3d';

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
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    min: 0.001,
    onChange(oldScale, newScale, cursor) {
      const result = scaleByCursorPosition({ width, height }, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })
  const [rotate, setRotate] = React.useState({ x: 0, y: 0 })
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask } = useDragMove(() => {
    if (is3D) {
      setRotate((v) => ({ x: v.x + offset.x, y: v.y + offset.y }))
    } else {
      setX((v) => v + offset.x)
      setY((v) => v + offset.y)
    }
  })
  const [hovering, setHovering] = React.useState<number>()
  const [selected, setSelected] = React.useState<number>()
  const [creating, setCreating] = React.useState(false)
  const [pasting, setPasting] = React.useState<SphereContent>()
  const assistentContents: BaseContent[] = []
  const previewPatches: Patch[] = []
  const previewReversePatches: Patch[] = []
  const selectedContents: { content: BaseContent, path: number[] }[] = []
  const [yz, setYz] = React.useState(false)
  const [is3D, setIs3D] = React.useState(false)
  let panel: JSX.Element | undefined
  const renderer3dRef = React.useRef<Renderer3dRef | null>(null)
  const [running, setRunning, runningRef] = useRefState(false)
  const [runningState, setRunningState, runningStateRef] = useRefState2<readonly Nullable<BaseContent>[]>()
  const currentContents = runningState ?? state

  const { line, onClick: startCreate, reset: resetCreate, onMove } = useLineClickCreate(
    creating,
    (c) => {
      setState(draft => {
        const sphere: SphereContent = {
          type: 'sphere',
          x: yz ? 0 : c[0].x,
          y: c[0].y,
          z: yz ? c[0].x : 0,
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
      x: yz ? 0 : line[0].x,
      y: line[0].y,
      z: yz ? line[0].x : 0,
      radius: getTwoPointsDistance(line[0], line[1]),
      speed: { x: 0, y: 0, z: 0 },
      mass: 1,
      color: 0xff0000,
    }
    assistentContents.push(sphere)
  }
  if (pasting) {
    assistentContents.push(pasting)
  }

  const transform: Transform = {
    x: is3D ? x : x + offset.x,
    y: is3D ? y : y + offset.y,
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
  useKey((k) => k.code === 'Digit0' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    setScale(1)
    setX(0)
    setY(0)
    setRotate({ x: 0, y: 0 })
    e.preventDefault()
  })
  useKey((k) => k.code === 'KeyC' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    if (selected !== undefined) {
      const content = state[selected]
      if (content) {
        navigator.clipboard.writeText(JSON.stringify(content))
      }
    }
    e.preventDefault()
  })
  useKey((k) => k.code === 'KeyV' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), async (e) => {
    try {
      const text = await navigator.clipboard.readText()
      const copyData: BaseContent = JSON.parse(text)
      if (isSphereContent(copyData)) {
        setPasting(copyData)
        return
      }
    } catch (error) {
      console.info(error)
    }
    e.preventDefault()
  })
  const reset = () => {
    setCreating(false)
    setHovering(undefined)
    setSelected(undefined)
    setPasting(undefined)
  }
  useKey((e) => e.key === 'Escape', reset, [setCreating])
  useKey((k) => k.code === 'Backspace' && !k.shiftKey && !metaKeyIfMacElseCtrlKey(k), () => {
    if (is3D) return
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
  const { editPoint, updateEditPreview, onEditMove, onEditClick } = useEdit<BaseContent, readonly number[]>(
    () => applyPatchFromSelf(previewPatches, previewReversePatches),
    (s) => {
      if (isSphereContent(s)) {
        const contentX = yz ? s.z : s.x
        const editPoints: EditPoint<BaseContent>[] = [{
          x: contentX,
          y: s.y,
          cursor: 'move',
          update(c, { cursor }) {
            if (!isSphereContent(c)) return
            if (yz) {
              c.z = cursor.x
            } else {
              c.x = cursor.x
            }
            c.y = cursor.y
          },
        }]
        const speedX = yz ? s.speed.z : s.speed.x
        if (speedX || s.speed.y) {
          const pos = { x: contentX, y: s.y }
          const speedPos = { x: speedX, y: s.speed.y }
          const p = getPointByLengthAndAngle(pos, s.radius + getTwoPointsDistance(speedPos), Math.atan2(s.speed.y, speedX))
          editPoints.push({
            x: p.x,
            y: p.y,
            cursor: 'move',
            update(c, { cursor }) {
              if (!isSphereContent(c)) return
              const d = getTwoPointsDistance(cursor, s)
              if (d <= s.radius) return
              const x = cursor.x - contentX
              const y = cursor.y - s.y
              const r = getTwoPointsDistance({ x, y })
              const scale = (r - s.radius) / r
              if (yz) {
                c.speed.z = x * scale
              } else {
                c.speed.x = x * scale
              }
              c.speed.y = y * scale
            },
          })
        }
        return {
          editPoints,
        }
      }
      return
    },
    {
      scale: transform.scale,
      readOnly: creating,
    }
  )
  const result = updateEditPreview()
  previewPatches.push(...result?.patches ?? [])
  previewReversePatches.push(...result?.reversePatches ?? [])
  const startCreation = () => {
    resetCreate()
    setCreating(true)
  }
  const getContentByPosition = (p: Position) => {
    for (let i = 0; i < currentContents.length; i++) {
      const content = currentContents[i]
      if (content && isSphereContent(content) && getTwoPointsDistance({ x: yz ? content.z : content.x, y: content.y }, p) <= content.radius) {
        return i
      }
    }
    return undefined
  }

  if (selected !== undefined && !running) {
    const content = currentContents[selected]
    if (content && isSphereContent(content)) {
      selectedContents.push({ content, path: [selected] })
      const update = (update: (content: BaseContent, contents: Nullable<BaseContent>[]) => void) => {
        const [, ...patches] = produceWithPatches(currentContents, (draft) => {
          const content = draft[selected]
          if (content) {
            update(content, draft)
          }
        })
        applyPatchFromSelf(...patches)
      }
      const properties: Record<string, JSX.Element> = {
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
      }
      if (content.acceleration) {
        properties.acceleration = <ObjectEditor
          inline
          properties={{
            x: <NumberEditor value={content.acceleration.x} />,
            y: <NumberEditor value={content.acceleration.y} />,
            z: <NumberEditor value={content.acceleration.z} />,
          }}
        />
      }
      panel = (
        <div style={{ position: 'absolute', right: '0px', top: '0px', bottom: '0px', width: '300px', overflowY: 'auto', background: 'white', zIndex: 11 }}>
          <div>{selected}</div>
          <ObjectEditor
            readOnly={runningState !== undefined}
            properties={properties}
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

  const stop = () => {
    setRunning(false)
    setRunningState(undefined)
  }
  const run = () => {
    if (runningRef.current) {
      setRunning(false)
      return
    }
    setRunning(true)
    let lastTime: number | undefined
    const step = (time: number) => {
      if (!runningRef.current) return
      if (lastTime !== undefined) {
        const t = (time - lastTime) * 0.001
        const newContents: SphereContent[] = []
        const current = runningStateRef.current ?? state
        for (const content of current) {
          if (content && isSphereContent(content)) {
            const acceleration: Position3D = {
              x: 0,
              y: 0,
              z: 0,
            }
            for (const target of current) {
              if (target && target !== content && isSphereContent(target)) {
                const v = v3.create(target.x - content.x, target.y - content.y, target.z - content.z)
                const a = v3.mulScalar(v3.normalize(v), target.mass / v3.lengthSq(v))
                acceleration.x += a[0]
                acceleration.y += a[1]
                acceleration.z += a[2]
              }
            }
            const newContent = produce(content, draft => {
              draft.x += content.speed.x * t
              draft.y += content.speed.y * t
              draft.z += content.speed.z * t
              draft.speed.x += acceleration.x * t
              draft.speed.y += acceleration.y * t
              draft.speed.z += acceleration.z * t
              draft.acceleration = acceleration
            })
            const index = newContents.findIndex(c => (c.x - newContent.x) ** 2 + (c.y - newContent.y) ** 2 + (c.z - newContent.z) ** 2 <= (c.radius + newContent.radius) ** 2)
            if (index >= 0) {
              newContents[index] = produce(newContents[index], draft => {
                const mass = draft.mass + newContent.mass
                const rate1 = draft.mass / mass
                const rate2 = newContent.mass / mass
                const color1 = colorNumberToPixelColor(draft.color)
                const color2 = colorNumberToPixelColor(newContent.color)
                draft.color = pixelColorToColorNumber([
                  Math.round(color1[0] * rate1 + color2[0] * rate2),
                  Math.round(color1[1] * rate1 + color2[1] * rate2),
                  Math.round(color1[2] * rate1 + color2[2] * rate2),
                ])
                draft.x = draft.x * rate1 + newContent.x * rate2
                draft.y = draft.y * rate1 + newContent.y * rate2
                draft.z = draft.z * rate1 + newContent.z * rate2
                draft.speed.x = draft.speed.x * rate1 + newContent.speed.x * rate2
                draft.speed.y = draft.speed.y * rate1 + newContent.speed.y * rate2
                draft.speed.z = draft.speed.z * rate1 + newContent.speed.z * rate2
                draft.mass = mass
                draft.radius = (draft.radius ** 3 + newContent.radius ** 3) ** (1 / 3)
              })
            } else {
              newContents.push(newContent)
            }
          }
        }
        setRunningState(newContents)
      }
      lastTime = time
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  const onMouseDown = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    if (e.buttons === 4) {
      onStartMoveCanvas(viewportPosition)
    } else if (!creating && !editPoint && hovering === undefined && !pasting) {
      onStartMoveCanvas(viewportPosition)
    }
  })
  const onClick = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = reverseTransformPosition(viewportPosition, transform)
    if (creating) {
      startCreate(p)
    } else if (pasting) {
      setState(draft => {
        draft.push({ ...pasting, x: p.x, y: p.y } as SphereContent)
      })
    } else if (editPoint) {
      onEditClick(p)
    } else if (hovering !== undefined) {
      setSelected(hovering)
      setHovering(undefined)
    }
  })
  const onMouseMove = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    if (is3D) {
      setHovering(renderer3dRef.current?.getContentByPosition(viewportPosition))
      return
    }
    const p = reverseTransformPosition(viewportPosition, transform)
    if (creating) {
      onMove(p, viewportPosition)
    } else if (pasting) {
      setPasting({ ...pasting, x: p.x, y: p.y })
    } else {
      onEditMove(p, selectedContents)
      setHovering(getContentByPosition(p))
    }
  })

  let cursor: string | undefined
  if (editPoint) {
    cursor = editPoint.cursor
  } else if (hovering !== undefined && hovering !== selected) {
    cursor = 'pointer'
  } else if (creating) {
    cursor = 'crosshair'
  } else {
    cursor = 'grab'
  }

  return (
    <>
      <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
        <div style={{ position: 'absolute', inset: '0px', cursor }} onMouseMove={onMouseMove}>
          {!is3D && <Renderer
            contents={currentContents}
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
            onMouseDown={onMouseDown}
            yz={yz}
          />}
          {is3D && <Renderer3d
            ref={renderer3dRef}
            x={transform.x}
            y={transform.y}
            scale={transform.scale}
            width={width}
            height={height}
            rotateX={offset.x + rotate.x}
            rotateY={offset.y + rotate.y}
            contents={currentContents}
            hovering={hovering}
            selected={selected}
            onClick={onClick}
            onMouseDown={onMouseDown}
          />}
        </div>
        <div style={{ position: 'relative' }}>
          <Button onClick={() => setIs3D(!is3D)}>{is3D ? '3D' : '2D'}</Button>
          {!is3D && <Button style={{ color: creating ? 'red' : undefined }} onClick={startCreation}>create</Button>}
          <Button onClick={() => {
            setState(draft => {
              for (let i = state.length - 1; i >= 0; i--) {
                if (!state[i]) {
                  draft.splice(i, 1)
                }
              }
            })
          }}>compress</Button>
          <Button onClick={run}>{running ? 'pause' : 'run'}</Button>
          {runningState !== undefined && <Button onClick={stop}>stop</Button>}
          {!is3D && <Button onClick={() => setYz(!yz)}>{yz ? 'y-z' : 'x-y'}</Button>}
        </div>
      </div>
      {panel}
      {moveCanvasMask}
    </>
  )
})

export interface AstronomicalObjectSimulatorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
}
