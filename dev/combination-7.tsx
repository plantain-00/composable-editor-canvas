import React from "react";
import { produce } from 'immer'
import { Position, getPointByLengthAndAngle, getPointByLengthAndDirection, getTwoPointsAngle, getTwoPointsDistance, reactCanvasRenderTarget, useKey, useRefState, useWindowSize } from "../src";

export function Combination7() {
  const target = reactCanvasRenderTarget
  const { width, height } = useWindowSize()
  const [models, setModels, modelsRef] = useRefState<Model[]>([
    {
      position: { x: 200, y: 200 },
      speed: 300,
      size: 24,
      facing: 0,
      canControl: true,
    },
    {
      position: { x: 300, y: 200 },
      speed: 300,
      size: 24,
      facing: 0,
      canControl: true,
    },
    {
      position: { x: 400, y: 200 },
      speed: 300,
      size: 24,
      facing: 0,
      canControl: false,
    },
  ])
  const [selected, setSelected] = React.useState<number[]>([])

  const children = models.map((m, i) => {
    const p = getPointByLengthAndAngle(m.position, m.size * Math.SQRT2, m.facing)
    const color = selected.includes(i) ? m.canControl ? 0x00ff00 : 0x0000ff : undefined
    return target.renderGroup([
      target.renderCircle(m.position.x, m.position.y, m.size, { strokeColor: color }),
      target.renderPolyline([
        getPointByLengthAndAngle(p, -m.size, m.facing + Math.PI / 4),
        p,
        getPointByLengthAndAngle(p, -m.size, m.facing - Math.PI / 4),
      ], { strokeColor: color }),
      target.renderPolyline([
        getPointByLengthAndAngle(m.position, -m.size, m.facing),
        getPointByLengthAndAngle(m.position, -m.size * 2, m.facing),
      ], { strokeColor: color }),
    ])
  })

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
  const onClick = (e: React.MouseEvent<HTMLOrSVGElement>) => {
    const p = { x: e.clientX, y: e.clientY }
    for (const [i, model] of models.entries()) {
      if (getTwoPointsDistance(model.position, p) <= model.size) {
        setSelected([i])
        break
      }
    }
  }

  useKey(e => e.key === 'Escape', () => {
    setSelected([])
  }, [setSelected])
  useKey(e => e.key === 's', () => {
    setModels(produce(models, draft => {
      for (const i of selected) {
        if (draft[i].canControl && draft[i].action) {
          draft[i].action = undefined
        }
      }
    }))
  }, [models, setModels, selected])

  React.useEffect(() => {
    let lastTime: number | undefined
    const step = (time: number) => {
      if (lastTime !== undefined) {
        const t = (time - lastTime) * 0.001
        const newModels: typeof models = []
        let changed = false
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
                draft.facing = getTwoPointsAngle(to, model.position)
              }))
            }
            changed = true
          } else {
            newModels.push(model)
          }
        }
        if (changed) {
          setModels(newModels)
        }
      }
      lastTime = time
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: '0px', overflow: 'hidden' }}>
      {target.renderResult(children, width, height, { attributes: { onContextMenu, onClick } })}
    </div>
  )
}

interface Model {
  position: Position
  speed: number
  action?: Action
  size: number
  facing: number
  canControl: boolean
}

type Action = ActionMove

interface ActionMove {
  type: 'move'
  to: Position
}
