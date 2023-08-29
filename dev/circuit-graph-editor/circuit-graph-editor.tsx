import React from 'react';
import { Patch, enablePatches, produceWithPatches } from 'immer'
import { bindMultipleRefs, equals, getAngleSnapPosition, getPointAndLineSegmentMinimumDistance, getTwoNumbersDistance, getTwoPointsDistance, isSamePath, metaKeyIfMacElseCtrlKey, Nullable, ObjectEditor, Position, reverseTransformPosition, scaleByCursorPosition, solveEquations, Transform, useEdit, useEvent, useGlobalKeyDown, useLineClickCreate, usePatchBasedUndoRedo, useWheelScroll, useWheelZoom, useWindowSize } from "../../src";
import { BaseContent, CircleContent, contentIndexCache, contentIsReferenced, EquationData, getContentModel, isDeviceContent, isJunctionContent, JunctionContent, LineContent, ContentUpdater, modelCenter, registerModel, updateReferencedContents } from "./model";
import { powerModel } from "./plugins/power";
import { resistanceModel } from './plugins/resistance';
import { wireModel } from './plugins/wire';
import { Renderer } from './renderer';
import { parseExpression, tokenizeExpression } from 'expression-engine';
import { switchModel } from './plugins/switch';
import { capacitorModel } from './plugins/capacitor';

enablePatches()

registerModel(powerModel)
registerModel(resistanceModel)
registerModel(wireModel)
registerModel(switchModel)
registerModel(capacitorModel)

export const CircuitGraphEditor = React.forwardRef((props: {
  operator: string
  initialState: readonly Nullable<BaseContent>[]
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
}, ref: React.ForwardedRef<CircuitGraphEditorRef>) => {
  const { width, height } = useWindowSize()
  const { state, setState, undo, redo, applyPatchFromSelf, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, props.operator, {
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
  const previewPatches: Patch[] = []
  const previewReversePatches: Patch[] = []
  const selectedContents: { content: BaseContent, path: number[] }[] = []
  const [lastOperation, setLastOperation] = React.useState<string>()
  let panel: JSX.Element | undefined
  const [equationResult, setEquationResult] = React.useState<number[]>([])
  const [action, setAction] = React.useState<{ act: (update: ContentUpdater) => void, index: number }>()

  const startJunctionId = React.useRef<number>()
  const endJunctionId = React.useRef<number>()
  const { line, onClick: startCreate, reset: resetCreate, onMove, lastPosition: createLastPosition } = useLineClickCreate(
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
  const reset = () => {
    setOperation(undefined)
    startJunctionId.current = undefined
    endJunctionId.current = undefined
    setSnapPoint(undefined)
    setHovering(undefined)
    setSelected(undefined)
    setAction(undefined)
  }
  const { editPoint, updateEditPreview, onEditMove, onEditClick, editLastPosition, getEditAssistentContents, resetEdit } = useEdit<BaseContent, readonly number[]>(
    () => {
      const newPatches: Patch[] = []
      const newReversePatches: Patch[] = []
      let index = state.length
      for (const p of previewPatches) {
        // type-coverage:ignore-next-line
        if (p.op === 'replace' && p.path.length === 2 && p.value && isJunctionContent(p.value)) {
          const field = p.path[1]
          if (field === 'start' || field === 'end') {
            newPatches.push({
              op: 'add',
              path: [index],
              value: p.value,
            })
            // type-coverage:ignore-next-line
            p.value = index
            newReversePatches.push({
              op: 'replace',
              path: ['length'],
              value: index,
            })
            index++
          }
        }
      }
      applyPatchFromSelf([...previewPatches, ...newPatches], [...previewReversePatches, ...newReversePatches])
    },
    (s) => getContentModel(s)?.getEditPoints?.(s, state),
    {
      scale: transform.scale,
      readOnly: !!operation,
    }
  )
  const result = updateEditPreview()
  previewPatches.push(...result?.patches ?? [])
  previewReversePatches.push(...result?.reversePatches ?? [])
  assistentContents.push(...result?.assistentContents ?? [])
  if (result) {
    assistentContents.push(...updateReferencedContents(result.content, result.result, state))
  }
  if (selected !== undefined) {
    const content = state[selected]
    if (content) {
      selectedContents.push({ content, path: [selected] })
      const c = editPoint && isSamePath(editPoint.path, [selected]) ? result?.result : result?.relatedEditPointResults.get(content)
      assistentContents.push(...getEditAssistentContents(c ?? content, (rect) => ({ type: 'circle', x: rect.x, y: rect.y, radius: 7 } as CircleContent)))

      const contentsUpdater = (update: (content: BaseContent, contents: Nullable<BaseContent>[]) => void) => {
        const [, ...patches] = produceWithPatches(state, (draft) => {
          const content = draft[selected]
          if (content) {
            update(content, draft)
          }
        })
        applyPatchFromSelf(...patches)
      }
      const propertyPanel = getContentModel(content)?.propertyPanel?.(content, contentsUpdater, state)
      let voltage: JSX.Element | undefined
      if (isJunctionContent(content)) {
        const voltageValue = equationResult[selected]
        if (voltageValue !== undefined) {
          voltage = <div>{voltageValue}V</div>
        }
      }
      panel = (
        <div style={{ position: 'absolute', right: '0px', top: '0px', bottom: '0px', width: '300px', overflowY: 'auto', background: 'white', zIndex: 11 }}>
          {content.type}
          <div>{selected}</div>
          {voltage}
          {propertyPanel && <ObjectEditor
            properties={propertyPanel}
          />}
        </div>
      )
    }
  }
  const lastPosition = editLastPosition ?? createLastPosition

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
  const startOperation = (p: string) => {
    setLastOperation(p)
    resetCreate()
    setOperation(p)
  }
  const getContentByPosition = (p: Position) => {
    for (let i = 0; i < state.length; i++) {
      const content = state[i]
      if (content && isJunctionContent(content) && getTwoPointsDistance(content.position, p) < 4) {
        return i
      }
    }
    for (let i = 0; i < state.length; i++) {
      const content = state[i]
      if (content && !isJunctionContent(content)) {
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
    return undefined
  }
  const getActionByPosition = (p: Position) => {
    for (let i = 0; i < state.length; i++) {
      const content = state[i]
      if (content) {
        const action = getContentModel(content)?.getAction?.(p, content, state)
        if (action) {
          return {
            act: action,
            index: i,
          }
        }
      }
    }
    return undefined
  }
  const onClick = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = reverseTransformPosition(viewportPosition, transform)
    const s = getSnapPoint(p)
    if (operation) {
      if (line === undefined) {
        startJunctionId.current = s.id
      } else {
        endJunctionId.current = s.id
      }
      startCreate(s.point)
    } else if (editPoint) {
      onEditClick(s.point)
    } else if (action) {
      action.act(update => {
        const [, ...patches] = produceWithPatches(state, (draft) => {
          const content = draft[action.index]
          if (content) {
            update(content, draft)
          }
        })
        applyPatchFromSelf(...patches)
      })
    } else if (hovering !== undefined) {
      setSelected(hovering)
      setHovering(undefined)
    }
  })
  const onMouseMove = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = reverseTransformPosition(viewportPosition, transform)
    const s = getSnapPoint(p)
    if (operation) {
      onMove(s.point, viewportPosition)
    } else {
      onEditMove(s.point, selectedContents)
      setHovering(getContentByPosition(p))
      setAction(getActionByPosition(p))
    }
  })
  const onContextMenu = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    if (lastOperation) {
      startOperation(lastOperation)
      e.preventDefault()
    }
  })
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      reset()
      resetCreate(true)
      resetEdit()
    } else if (metaKeyIfMacElseCtrlKey(e)) {
      if (e.shiftKey) {
        if (e.code === 'KeyZ') {
          redo(e)
        }
      } else {
        if (e.code === 'KeyZ') {
          undo(e)
        } else if (e.code === 'Backspace') {
          if (hovering !== undefined && !contentIsReferenced(hovering, state)) {
            setState(draft => {
              draft[hovering] = undefined
            })
            setHovering(undefined)
          } else if (selected !== undefined && !contentIsReferenced(selected, state)) {
            setState(draft => {
              draft[selected] = undefined
            })
            setSelected(undefined)
          }
        }
      }
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

  React.useEffect(() => {
    const equationData: EquationData[] = []
    state.forEach((content, i) => {
      if (content) {
        if (isJunctionContent(content)) {
          const start: string[] = []
          const end: string[] = []
          state.forEach((s, j) => {
            if (s && isDeviceContent(s)) {
              if (s.start === i) {
                start.push(`I${j}`)
              } else if (s.end === i) {
                end.push(`I${j}`)
              }
            }
          })
          if (start.length + end.length > 0) {
            equationData.push({
              left: start.join(' + ') || '0',
              right: end.join(' + ') || '0',
            })
          }
          if (content.ground) {
            equationData.push({
              left: `U${i}`,
              right: '0',
            })
          }
        } else if (isDeviceContent(content) && typeof content.start === 'number' && typeof content.end === 'number') {
          const data = getContentModel(content)?.getEquationData?.(content, i)
          if (data) {
            equationData.push(data)
          }
        }
      }
    })
    const equations = equationData.map(e => ({
      left: parseExpression(tokenizeExpression(e.left)),
      right: parseExpression(tokenizeExpression(e.right)),
    }))
    const result: number[] = []
    for (const [key, e] of Object.entries(solveEquations(equations)[0])) {
      if (!Array.isArray(e) && e.type === 'NumericLiteral') {
        result[+key.slice(1)] = e.value
      }
    }
    setEquationResult(result)
  }, [state])

  let cursor: string | undefined
  if (editPoint) {
    cursor = editPoint.cursor
  } else if (hovering !== undefined && hovering !== selected) {
    cursor = 'pointer'
  } else if (action) {
    cursor = 'pointer'
  }

  return (
    <>
      <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
        <div style={{ cursor, position: 'absolute', inset: '0px' }} onMouseMove={onMouseMove}>
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
            equationResult={equationResult}
            onClick={onClick}
            onContextMenu={onContextMenu}
          />
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        {Object.values(modelCenter).filter(p => p.createPreview).map((p) => {
          if (p.icon) {
            const svg = React.cloneElement<React.HTMLAttributes<unknown>>(p.icon, {
              onClick: () => startOperation(p.type),
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
        <span title='compress'>
          <svg
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"
            style={{
              width: '20px',
              height: '20px',
              margin: '5px',
              cursor: 'pointer',
            }}
            onClick={() => {
              setState(draft => {
                const newIndexes: (number | undefined)[] = []
                let validContentCount = 0
                const invalidContentsIndex: number[] = []
                draft.forEach((d, i) => {
                  if (d) {
                    newIndexes.push(validContentCount)
                    validContentCount++
                  } else {
                    newIndexes.push(undefined)
                    invalidContentsIndex.unshift(i)
                  }
                })
                invalidContentsIndex.forEach(i => {
                  draft.splice(i, 1)
                })
                for (const content of draft) {
                  if (content) {
                    getContentModel(content)?.updateRefId?.(content, refId => typeof refId === 'number' ? newIndexes[refId] : undefined)
                  }
                }
                contentIndexCache.clear()
              })
            }}
          >
            <rect x="10" y="44" width="81" height="20" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></rect>
            <rect x="9" y="69" width="81" height="20" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></rect>
            <polygon points="42,6 57,6 57,31 73,31 51,44 27,32 42,32" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
          </svg>
        </span>
      </div>
      {panel}
    </>
  )
})

export interface CircuitGraphEditorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
}
