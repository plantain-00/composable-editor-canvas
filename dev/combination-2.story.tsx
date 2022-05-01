import React from 'react'
import { useDragSelect, useKey, useUndoRedo } from '../src'
import { executeCommand, getContentByClickPosition, getContentsByClickTwoPositions, isCommand, isContentSelectable, isExecutableCommand } from './util-2'
import { PixiRenderer } from './renderers/pixi-renderer'
import { SvgRenderer } from './renderers/svg-renderer'
import produce from 'immer'
import { BaseContent, registerModel, useModelsCreate, useModelsEdit } from './models/model'
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

const draftKey = 'composable-editor-canvas-draft-2'
const draftState = localStorage.getItem(draftKey)
const initialState = draftState ? JSON.parse(draftState) as BaseContent[] : []

registerModel(lineModel)
registerModel(circleModel)
registerModel(polylineModel)
registerModel(rectModel)

registerCommand(moveCommand)
registerCommand(rotateCommand)
registerCommand(mirrorCommand)
registerCommand(cloneCommand)
registerCommand(deleteCommand)
registerCommand(explodeCommand)

export default () => {
  // operation when no selection required or selected already
  const [operation, setOperation] = React.useState<string>()
  // next operation when selection finished by pressing 'Enter'
  const [nextOperation, setNextOperation] = React.useState<string>()
  // undo/redo
  const { state, setState, undo, redo, canRedo, canUndo, stateIndex } = useUndoRedo(initialState)
  const [selectedContents, setSelectedContents] = React.useState<number[]>([])
  const [hoveringContent, setHoveringContent] = React.useState<number>(-1)
  const [renderTarget, setRenderTarget] = React.useState<'pixi' | 'svg'>('pixi')

  // commands
  const { commandMasks, updateContent, startCommand } = useCommands(() => setState(() => previewContents))

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
  const { createInputs, updateCreatePreview, onStartCreate, onCreatingMove } = useModelsCreate(operation, (c) => {
    setState((draft) => {
      draft.push(...c)
    })
    setOperation(undefined)
  })

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
    // if the operation is create model/command, start it
    onStartCreate(e)
    if (operation && isCommand(operation)) {
      startCommand(operation, e)
      setOperation(undefined)
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
    onCreatingMove(e)
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

  const Render = renderTarget === 'pixi' ? PixiRenderer : SvgRenderer

  return (
    <div style={{ height: '100%' }}>
      <div style={{ cursor: 'crosshair' }} onMouseMove={onMouseMove}>
        <Render
          contents={[...previewContents, ...assistentContents]}
          selectedContents={selectedContents}
          hoveringContent={hoveringContent}
          onClick={onClick}
        />
        {previewContents.map((s, i) => {
          if (selectedContents.includes(i)) {
            const EditBar = editBarMap[s.type]
            return <EditBar key={i} content={s} index={i} />
          }
          return null
        })}
        {createInputs}
      </div>
      {['2 points', '3 points', 'center radius', 'center diameter', 'line', 'polyline', 'rect', 'move', 'delete', 'rotate', 'clone', 'explode', 'mirror'].map((p) => <button onClick={() => onStartOperation(p)} key={p} style={{ position: 'relative', borderColor: p === operation || p === nextOperation ? 'red' : undefined }}>{p}</button>)}
      <button disabled={!canUndo} onClick={() => undo()} style={{ position: 'relative' }}>undo</button>
      <button disabled={!canRedo} onClick={() => redo()} style={{ position: 'relative' }}>redo</button>
      <button onClick={() => setRenderTarget(renderTarget === 'pixi' ? 'svg' : 'pixi')} style={{ position: 'relative' }}>{renderTarget}</button>
      {editMasks}
      {dragSelectMask}
      {commandMasks}
    </div>
  )
}
