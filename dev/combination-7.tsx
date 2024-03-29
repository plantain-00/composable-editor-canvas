import React from "react";
import { produce } from 'immer'
import { getTwoPointsDistance, pointIsInRegion, reactCanvasRenderTarget, useDragSelect, useGlobalKeyDown, useRefState, useWindowSize } from "../src";
import { Bullet, ModelStatus } from './combination-7/model'
import { initialModels } from "./combination-7/data";
import { updateModels } from "./combination-7/tick";
import { Panel } from "./combination-7/panel";
import { renderModels } from "./combination-7/render";
import { units } from "./combination-7/units";
import { getAbilityFromIndex } from "./combination-7/utils";

export function Combination7() {
  const target = reactCanvasRenderTarget
  const { width, height } = useWindowSize()
  const [models, setModels, modelsRef] = useRefState(initialModels)
  const [bullets, setBullets, bulletsRef] = useRefState<Bullet[]>([])
  const [selected, setSelected] = React.useState<number[]>([])
  const [, setTime, timeRef] = useRefState(0)
  const status = React.useRef<ModelStatus>()

  let panel: JSX.Element | undefined
  if (selected.length > 0) {
    panel = <Panel target={models[selected[0]]} status={status} updater={update => {
      setModels(produce(models, draft => {
        update(draft[0])
      }))
    }} />
  }

  const onContextMenu = (e: React.MouseEvent<HTMLOrSVGElement>) => {
    setModels(produce(models, draft => {
      for (const i of selected) {
        if (draft[i].canControl) {
          draft[i].action = {
            type: 'move',
            to: { x: Math.round(e.clientX), y: Math.round(e.clientY) },
          }
        }
      }
    }))
    e.preventDefault()
  }

  const { onStartSelect, dragSelectMask, resetDragSelect } = useDragSelect((start, end) => {
    if (end && Math.abs(start.x - end.x) > 10 && Math.abs(start.y - end.y) > 10) {
      const region = {
        start: { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
        end: { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) },
      }
      setSelected(Array.from(models.entries()).filter(([, m]) => pointIsInRegion(m.position, region)).map(([i]) => i))
    } else {
      if (status.current?.ability) {
        const ability = getAbilityFromIndex(status.current.ability)
        if (ability?.cast?.radius) {
          setModels(produce(models, draft => {
            for (const j of selected) {
              if (draft[j].canControl && status.current) {
                draft[j].action = {
                  type: 'attack',
                  ability: status.current.ability,
                  target: start,
                }
              }
            }
          }))
          status.current = undefined
          return
        }
      }
      for (const [i, model] of models.entries()) {
        if (getTwoPointsDistance(model.position, start) <= units[model.unit].size) {
          if (status.current) {
            setModels(produce(models, draft => {
              for (const j of selected) {
                if (draft[j].canControl && status.current) {
                  draft[j].action = {
                    type: 'attack',
                    ability: status.current.ability,
                    target: i,
                  }
                }
              }
            }))
            status.current = undefined
            break
          }
          setSelected([i])
          break
        }
      }
    }
  })
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      resetDragSelect()
      setSelected([])
    } else if (e.key === 's') {
      setModels(produce(models, draft => {
        for (const i of selected) {
          if (draft[i].canControl && draft[i].action) {
            draft[i].action = undefined
          }
        }
      }))
    } else if (e.key === 'a') {
      status.current = {
        type: 'attack'
      }
    }
  })
  React.useEffect(() => {
    const step = (time: number) => {
      if (timeRef.current !== 0) {
        const result = updateModels((time - timeRef.current) * 0.001, modelsRef.current, bulletsRef.current)
        if (result.models) setModels(result.models)
        if (result.bullets) setBullets(result.bullets)
      }
      setTime(time)
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [])

  return <>
    <div style={{ position: 'absolute', inset: '0px', overflow: 'hidden' }} onMouseDown={onStartSelect} onContextMenu={onContextMenu}>
      {target.renderResult(renderModels(models, bullets, selected), width, height)}
      {dragSelectMask}
    </div>
    {panel}
  </>
}
