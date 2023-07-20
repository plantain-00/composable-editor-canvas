import React from "react";
import { produce } from 'immer'
import { Position, getPointByLengthAndDirection, getTwoPointsDistance, reactCanvasRenderTarget, useRefState, useWindowSize } from "../src";

export function Combination7() {
  const target = reactCanvasRenderTarget
  const { width, height } = useWindowSize()
  const [models, setModels, modelsRef] = useRefState<Model[]>([{
    position: { x: 200, y: 200 },
    speed: 300,
    action: {
      type: 'move',
      to: { x: 600, y: 600 },
    }
  }])
  const children = models.map(m => target.renderCircle(m.position.x, m.position.y, 50))

  const onContextMenu = (e: React.MouseEvent<HTMLOrSVGElement>) => {
    setModels(produce(models, draft => {
      draft[0].action = {
        type: 'move',
        to: { x: Math.round(e.clientX), y: Math.round(e.clientY) },
      }
    }))
    e.preventDefault()
  }

  React.useEffect(() => {
    let lastTime: number | undefined
    const step = (time: number) => {
      if (lastTime !== undefined) {
        const t = (time - lastTime) * 0.001
        const newModels: typeof models = []
        for (const model of modelsRef.current) {
          if (model.action) {
            const s = t * model.speed
            const to = model.action.to
            const d = getTwoPointsDistance(model.position, to)
            if (d <= s) {
              newModels.push(produce(model, draft => {
                draft.position = to
                draft.action = undefined
              }))
            } else {
              const p = getPointByLengthAndDirection(model.position, s, to)
              newModels.push(produce(model, draft => {
                draft.position = p
              }))
            }
          } else {
            newModels.push(model)
          }
        }
        setModels(newModels)
      }
      lastTime = time
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: '0px', overflow: 'hidden' }}>
      {target.renderResult(children, width, height, { attributes: { onContextMenu } })}
    </div>
  )
}

interface Model {
  position: Position
  speed: number
  action?: Action
}

type Action = ActionMove

interface ActionMove {
  type: 'move'
  to: Position
}
