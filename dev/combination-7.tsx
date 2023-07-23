import React from "react";
import { produce } from 'immer'
import { Position, getPointByLengthAndAngle, getPointByLengthAndDirection, getTwoPointsAngle, getTwoPointsDistance, pointIsInRegion, reactCanvasRenderTarget, useDragSelect, useKey, useRefState, useWindowSize } from "../src";

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
      health: {
        total: 500,
        current: 200,
      },
      attack: {
        damage: 50,
        range: 2,
        speed: 1700,
      },
    },
    {
      position: { x: 300, y: 200 },
      speed: 300,
      size: 24,
      facing: 0,
      canControl: true,
      health: {
        total: 600,
        current: 100,
      },
    },
    {
      position: { x: 400, y: 200 },
      speed: 300,
      size: 24,
      facing: 0,
      canControl: false,
      health: {
        total: 700,
        current: 700,
      },
    },
  ])
  const [selected, setSelected] = React.useState<number[]>([])
  const attacking = React.useRef(false)

  const children = models.map((m, i) => {
    const p = getPointByLengthAndAngle(m.position, m.size * Math.SQRT2, m.facing)
    const color = selected.includes(i) ? m.canControl ? 0x00ff00 : 0x0000ff : undefined
    const result = [
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
    ]
    if (m.health) {
      const height = 6
      const width = m.size
      const rate = m.health.current / m.health.total
      result.push(
        target.renderRect(m.position.x - width / 2, m.position.y - m.size - height, width, height),
        target.renderRect(m.position.x - width / 2, m.position.y - m.size - height, rate * m.size, height, {
          fillColor: rate > 0.67 ? 0x00ff00 : rate > 0.33 ? 0xffff00 : 0x000000,
        }),
      )
    }
    return target.renderGroup(result)
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
  useKey(e => e.key === 'a', () => {
    attacking.current = true
  })

  const { onStartSelect, dragSelectMask } = useDragSelect((start, end) => {
    if (end) {
      const region = {
        start: { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
        end: { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) },
      }
      setSelected(Array.from(models.entries()).filter(([, m]) => pointIsInRegion(m.position, region)).map(([i]) => i))
    } else {
      for (const [i, model] of models.entries()) {
        if (getTwoPointsDistance(model.position, start) <= model.size) {
          if (attacking.current) {
            attacking.current = false
            setModels(produce(models, draft => {
              for (const j of selected) {
                if (draft[j].canControl) {
                  draft[j].action = {
                    type: 'attack',
                    target: i,
                    last: 0,
                  }
                }
              }
            }))
            break
          }
          setSelected([i])
          break
        }
      }
    }
  })

  React.useEffect(() => {
    let lastTime: number | undefined
    const step = (time: number) => {
      if (lastTime !== undefined) {
        const t = (time - lastTime) * 0.001
        const newModels = [...modelsRef.current]
        let changed = false
        for (const [i, model] of newModels.entries()) {
          if (model.action) {
            if (model.action.type === 'attack') {
              const target = newModels[model.action.target]
              const newFacing = getTwoPointsAngle(target.position, model.position)
              if (target.health && model.attack && time - model.action.last > model.attack.speed) {
                const health = Math.max(0, target.health.current - Math.floor(model.attack.damage + Math.random() * model.attack.range))
                newModels[model.action.target] = produce(target, draft => {
                  if (draft.health) {
                    draft.health.current = health
                  }
                })
                const dead = health === 0
                newModels[i] = produce(model, draft => {
                  draft.facing = newFacing
                  if (dead) {
                    draft.action = undefined
                  } else if (draft.action && draft.action.type === 'attack') {
                    draft.action.last = time
                  }
                })
                changed = true
                continue
              }
              if (newFacing !== model.facing) {
                newModels[i] = produce(model, draft => {
                  draft.facing = newFacing
                })
                changed = true
              }
              continue
            }
            const s = t * model.speed
            const to = model.action.to
            const d = getTwoPointsDistance(model.position, to)
            const newFacing = getTwoPointsAngle(to, model.position)
            let newModel: Model
            if (d <= s) {
              newModel = produce(model, draft => {
                draft.position = to
                draft.action = undefined
                draft.facing = newFacing
              })
            } else {
              const p = getPointByLengthAndDirection(model.position, s, to)
              newModel = produce(model, draft => {
                draft.position = p
                draft.facing = newFacing
              })
            }
            let valid = true
            for (let j = 0; j < newModels.length; j++) {
              if (j !== i) {
                const m = newModels[j]
                if (getTwoPointsDistance(m.position, newModel.position) < m.size + newModel.size) {
                  valid = false
                  break
                }
              }
            }
            if (valid) {
              newModels[i] = newModel
              changed = true
            } else if (newFacing !== model.facing) {
              newModels[i] = produce(model, draft => {
                draft.facing = newFacing
              })
              changed = true
            }
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
    <div style={{ position: 'absolute', inset: '0px', overflow: 'hidden' }} onMouseDown={onStartSelect} onContextMenu={onContextMenu}>
      {target.renderResult(children, width, height)}
      {dragSelectMask}
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
  health?: {
    total: number
    current: number
  }
  attack?: {
    damage: number
    range: number
    speed: number
  }
}

type Action = ActionMove | ActionAttack

interface ActionMove {
  type: 'move'
  to: Position
}

interface ActionAttack {
  type: 'attack'
  target: number
  last: number
}
