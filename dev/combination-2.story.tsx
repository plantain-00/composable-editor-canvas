import React from 'react'
import { reactSvgRenderTarget, useDragSelect, useKey, useUndoRedo } from '../src'
import { executeCommand, getContentByClickPosition, getContentsByClickTwoPositions, isCommand, isContentSelectable, isExecutableCommand } from './util-2'
import produce from 'immer'
import { BaseContent, registerModel, useModelsCreate, useModelsEdit, useSnap } from './models/model'
import { lineModel } from './models/line-model'
import { circleModel } from './models/circle-model'
import { polylineModel } from './models/polyline-model'
import { rectModel } from './models/rect-model'
import { registerCommand, useCommands } from './commands/command'
import { moveCommand } from './commands/move'
import { rotateCommand } from './commands/rotate'
import { mirrorCommand } from './commands/mirror'
import { cloneCommand } from './commands/clone'
import { explodeCommand } from './commands/explode'
import { deleteCommand } from './commands/delete'
import { getAllRendererTypes, registerRenderer, Renderer } from './renderers/renderer'
import { reactPixiRenderTarget } from './renderers/react-pixi-render-target'
import { polygonModel } from './models/polygon-model'
import { ellipseModel } from './models/ellipse-model'

const draftKey = 'composable-editor-canvas-draft-2'
const draftState = localStorage.getItem(draftKey)
const initialState = draftState ? JSON.parse(draftState) as BaseContent[] : []

registerModel(lineModel)
registerModel(circleModel)
registerModel(polylineModel)
registerModel(rectModel)
registerModel(polygonModel)
registerModel(ellipseModel)

registerCommand(moveCommand)
registerCommand(rotateCommand)
registerCommand(mirrorCommand)
registerCommand(cloneCommand)
registerCommand(deleteCommand)
registerCommand(explodeCommand)

registerRenderer(reactSvgRenderTarget)
registerRenderer(reactPixiRenderTarget)

export default () => {
  // operation when no selection required or selected already
  const [operation, setOperation] = React.useState<string>()
  // next operation when selection finished by pressing 'Enter'
  const [nextOperation, setNextOperation] = React.useState<string>()
  // undo/redo
  const { state, setState, undo, redo, canRedo, canUndo, stateIndex } = useUndoRedo(initialState)
  const [selectedContents, setSelectedContents] = React.useState<number[]>([])
  const [hoveringContent, setHoveringContent] = React.useState<number>(-1)
  const [renderTarget, setRenderTarget] = React.useState<string>()
  const [snapTypes, setSnapTypes] = React.useState(['endpoint', 'midpoint', 'center', 'intersection'])

  // commands
  const { commandMasks, updateContent, startCommand } = useCommands(
    () => {
      setState(() => previewContents)
      setOperation(undefined)
    },
    (e) => getSnapPoint(e, state, snapTypes),
    operation,
  )

  // content data -> preview data / assistent data
  const assistentContents: BaseContent[] = []
  let previewContents = produce(state, (draft) => {
    const newContents: BaseContent[] = []
    draft.forEach((content, i) => {
      if (selectedContents.includes(i)) {
        const result = updateContent(content)
        if (result.assistentContents) {
          assistentContents.push(...result.assistentContents)
        }
        if (result.newContents) {
          newContents.push(...result.newContents)
        }
      }
    })
    draft.push(...newContents)
  })

  // select by region
  const { onStartSelect, dragSelectMask } = useDragSelect((start, end) => {
    if (end) {
      setSelectedContents([...selectedContents, ...getContentsByClickTwoPositions(state, start, end, contentSelectable)])
    }
  })

  // edit model
  const { editMasks, updateEditPreview, editBarMap } = useModelsEdit(() => setState(() => previewContents))
  // create model
  const { createInputs, updateCreatePreview, onStartCreate, onCreatingMove, createSubcommands } = useModelsCreate(operation, (c) => {
    setState((draft) => {
      draft.push(...c)
    })
    setOperation(undefined)
  })
  // snap point
  const { snapAssistentContents, getSnapPoint } = useSnap(!!operation)
  assistentContents.push(...snapAssistentContents)

  previewContents = produce(previewContents, (draft) => {
    updateEditPreview(draft)
    updateCreatePreview(draft)
  })

  const executeCommandForSelectedContents = (name: string) => {
    const removedContents: number[] = []
    const newContents: BaseContent[] = []
    state.forEach((c, i) => {
      if (selectedContents.includes(i)) {
        const result = executeCommand(name, c)
        if (result?.newContents) {
          newContents.push(...result.newContents)
        }
        if (result?.removed) {
          removedContents.push(i)
        }
      }
    })
    if (removedContents.length + newContents.length > 0) {
      setState((draft) => [...draft.filter((_, i) => !removedContents.includes(i)), ...newContents])
    }
    setSelectedContents([])
  }
  const contentSelectable = (content: BaseContent, index: number) => {
    // ignore selected contents
    if (selectedContents.includes(index)) {
      return false
    }
    return nextOperation ? isContentSelectable(nextOperation, content) : true
  }

  useKey((e) => e.key === 'Escape', () => {
    setOperation(undefined)
    setNextOperation(undefined)
    setSelectedContents([])
  }, [setOperation])

  useKey((e) => e.key === 'Enter', () => {
    // after selection, execute command immediately
    if (nextOperation && isExecutableCommand(nextOperation)) {
      executeCommandForSelectedContents(nextOperation)
      setNextOperation(undefined)
      return
    }
    // after selection, continue operation
    if (nextOperation) {
      setOperation(nextOperation)
      setNextOperation(undefined)
    }
  })

  // save contents if changed
  React.useEffect(() => {
    if (stateIndex > 0) {
      localStorage.setItem(draftKey, JSON.stringify(state))
    }
  }, [state, stateIndex])

  const onClick = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const p = getSnapPoint(e, state, snapTypes)
    // if the operation is create model/command, start it
    onStartCreate(p)
    if (operation && isCommand(operation)) {
      startCommand(operation, p)
    }
    if (!operation) {
      if (hoveringContent >= 0) {
        // if no operation and is hovering content, add it to selection
        setSelectedContents([...selectedContents, hoveringContent])
      } else {
        // if no operation and is not hovering, start selection by region
        onStartSelect(e)
      }
    }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    onCreatingMove(getSnapPoint(e, state, snapTypes))
    if (!operation) {
      // if no operation, hover by position
      setHoveringContent(getContentByClickPosition(state, { x: e.clientX, y: e.clientY }, contentSelectable))
    }
  }
  const onStartOperation = (p: string) => {
    // for commands, but no content selected, start to select some
    if (isCommand(p) && selectedContents.length === 0) {
      setOperation(undefined)
      setNextOperation(p)
      return
    }
    // for executable commands, if there are selections, do it
    if (isExecutableCommand(p)) {
      executeCommandForSelectedContents(p)
      return
    }
    setOperation(p)
  }

  return (
    <div style={{ height: '100%' }}>
      <div style={{ cursor: 'crosshair' }} onMouseMove={onMouseMove}>
        <Renderer
          type={renderTarget}
          contents={[...previewContents, ...assistentContents]}
          selectedContents={selectedContents}
          hoveringContent={hoveringContent}
          onClick={onClick}
        />
        {previewContents.map((s, i) => {
          if (selectedContents.includes(i)) {
            const EditBar = editBarMap[s.type]
            if (EditBar) {
              return <EditBar key={i} content={s} index={i} />
            }
          }
          return null
        })}
        {createInputs}
      </div>
      {['2 points', '3 points', 'center radius', 'center diameter', 'line', 'polyline', 'rect', 'polygon', 'ellipse center', 'ellipse endpoint', 'move', 'delete', 'rotate', 'clone', 'explode', 'mirror'].map((p) => <button onClick={() => onStartOperation(p)} key={p} style={{ position: 'relative', borderColor: p === operation || p === nextOperation ? 'red' : undefined }}>{p}</button>)}
      <button disabled={!canUndo} onClick={() => undo()} style={{ position: 'relative' }}>undo</button>
      <button disabled={!canRedo} onClick={() => redo()} style={{ position: 'relative' }}>redo</button>
      <select onChange={(e) => setRenderTarget(e.target.value)} style={{ position: 'relative' }}>
        {getAllRendererTypes().map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      {createSubcommands}
      {['endpoint', 'midpoint', 'center', 'intersection'].map((type) => (
        <span key={type} style={{ position: 'relative' }}>
          <input type='checkbox' checked={snapTypes.includes(type)} id={type} onChange={(e) => setSnapTypes(e.target.checked ? [...snapTypes, type] : snapTypes.filter((d) => d !== type))} />
          <label htmlFor={type}>{type}</label>
        </span>
      ))}
      {editMasks}
      {dragSelectMask}
      {commandMasks}
    </div>
  )
}
