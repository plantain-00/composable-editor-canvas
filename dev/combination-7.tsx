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
        current: 0.4,
        regeneration: 10,
        armor: 0,
        magicResistance: 0,
      },
      mana: {
        total: 400,
        current: 0.75,
        regeneration: 5,
      },
      attack: {
        damage: 50,
        damageRange: 2,
        speed: 1700,
        last: 0,
        bulletSpeed: 900,
        range: 300,
      },
      abilities: {
        strength: 20,
        agility: 30,
        intelligence: 15,
        primary: 'agility',
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
        current: 0.8,
        regeneration: 10,
        armor: 10,
        magicResistance: 0.25,
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
        current: 1,
        regeneration: 10,
        armor: -10,
        magicResistance: 0,
      },
    },
  ])
  const [bullets, setBullets, bulletsRef] = useRefState<Bullet[]>([])
  const [selected, setSelected] = React.useState<number[]>([])
  const attacking = React.useRef(false)

  const children = models.map((m, i) => {
    const color = selected.includes(i) ? m.canControl ? 0x00ff00 : 0x0000ff : undefined
    const result = [
      target.renderCircle(m.position.x, m.position.y, m.size, { strokeColor: color }),
      target.renderPolyline([
        getPointByLengthAndAngle(m.position, m.size, m.facing),
        getPointByLengthAndAngle(m.position, m.size * 2, m.facing),
      ], { strokeColor: color }),
    ]
    if (m.health) {
      const height = 6
      const width = m.size
      const rate = m.health.current
      result.push(
        target.renderRect(m.position.x - width / 2, m.position.y - m.size - height, width, height),
        target.renderRect(m.position.x - width / 2, m.position.y - m.size - height, rate * m.size, height, {
          fillColor: rate > 0.67 ? 0x00ff00 : rate > 0.33 ? 0xffff00 : 0x000000,
        }),
      )
    }
    return target.renderGroup(result)
  })
  children.push(...bullets.map(b => target.renderCircle(b.position.x, b.position.y, 5)))

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

        const newBullets: Bullet[] = []
        for (const bullet of bulletsRef.current) {
          const s = t * bullet.speed
          const source = newModels[bullet.source]
          const target = newModels[bullet.target]
          const d = getTwoPointsDistance(bullet.position, target.position) - target.size
          if (d <= s) {
            if (target.health && source.attack) {
              const armor = getArmor(target.health.armor, target)
              const damage = getDamageAfterArmor(getDamage(source.attack.damage, source) + Math.random() * source.attack.damageRange, armor)
              const totalHealth = getTotalHealth(target.health.total, target.abilities?.strength)
              const health = Math.max(0, target.health.current - damage / totalHealth)
              newModels[bullet.target] = produce(target, draft => {
                if (draft.health) {
                  draft.health.current = health
                }
              })
              if (health === 0) {
                newModels[bullet.source] = produce(source, draft => {
                  draft.action = undefined
                })
              }
              changed = true
            }
          } else {
            const p = getPointByLengthAndDirection(bullet.position, s, target.position)
            newBullets.push(produce(bullet, draft => {
              draft.position = p
            }))
          }
        }

        for (const [i, model] of newModels.entries()) {
          if (model.health && model.health.regeneration && model.health.current < 1) {
            const h = t * getHealthRegeneration(model.health.regeneration, model.abilities?.strength)
            newModels[i] = produce(model, draft => {
              if (draft.health) {
                const totalHealth = getTotalHealth(draft.health.total, draft.abilities?.strength)
                draft.health.current = Math.min(draft.health.current + h / totalHealth, 1)
              }
            })
            changed = true
          }

          if (model.mana && model.mana.regeneration && model.mana.current < 1) {
            const h = t * getManaRegeneration(model.mana.regeneration, model.abilities?.intelligence)
            newModels[i] = produce(model, draft => {
              if (draft.mana) {
                const totalMana = getTotalMana(draft.mana.total, draft.abilities?.intelligence)
                draft.mana.current = Math.min(draft.mana.current + h / totalMana, 1)
              }
            })
            changed = true
          }

          if (model.action) {
            if (model.action.type === 'attack') {
              const target = newModels[model.action.target]
              const newFacing = getTwoPointsAngle(target.position, model.position)
              if (target.health && target.health.current > 0 && model.attack) {
                if (getTwoPointsDistance(model.position, target.position) > model.attack.range + model.size + target.size) {
                  const s = t * model.speed
                  const p = getPointByLengthAndDirection(model.position, s, target.position)
                  newModels[i] = produce(model, draft => {
                    draft.position = p
                    draft.facing = newFacing
                  })
                  changed = true
                  continue
                }
                const attackSpeed = getAttackSpeed(model.attack.speed, model.abilities?.agility)
                if (time - model.attack.last > attackSpeed) {
                  newModels[i] = produce(model, draft => {
                    draft.facing = newFacing
                    if (draft.attack) {
                      draft.attack.last = time
                    }
                  })
                  newBullets.push({
                    position: getPointByLengthAndDirection(model.position, model.size, target.position),
                    source: i,
                    target: model.action.target,
                    speed: model.attack.bulletSpeed,
                  })
                  changed = true
                  continue
                }
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
        if (newBullets.length > 0 || bulletsRef.current.length > 0) {
          setBullets(newBullets)
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
    regeneration: number
    armor: number
    magicResistance: number
  }
  mana?: {
    total: number
    current: number
    regeneration: number
  }
  attack?: {
    damage: number
    damageRange: number
    speed: number
    last: number
    bulletSpeed: number
    range: number
  }
  abilities?: {
    strength: number
    agility: number
    intelligence: number
    primary: 'strength' | 'agility' | 'intelligence' | 'universal'
  }
}

interface Bullet {
  position: Position
  source: number
  target: number
  speed: number
}

type Action = ActionMove | ActionAttack

interface ActionMove {
  type: 'move'
  to: Position
}

interface ActionAttack {
  type: 'attack'
  target: number
}

function getTotalHealth(totalHealth: number, strength = 0) {
  return totalHealth + strength * 22
}

function getTotalMana(totalMana: number, intelligence = 0) {
  return totalMana + intelligence * 12
}

function getAttackSpeed(attackSpeed: number, agility = 0) {
  return attackSpeed / (1 + agility * 0.01)
}

function getArmor(armor: number, model: Model) {
  if (model.abilities?.primary === 'agility') {
    armor += model.abilities.agility / 6
  }
  return armor
}

function getDamage(damage: number, model: Model) {
  if (model.abilities) {
    if (model.abilities.primary === 'strength') {
      damage += model.abilities.strength
    } else if (model.abilities.primary === 'agility') {
      damage += model.abilities.agility
    } else if (model.abilities.primary === 'intelligence') {
      damage += model.abilities.intelligence
    } else {
      damage += (model.abilities.strength + model.abilities.agility + model.abilities.intelligence) * 0.7
    }
  }
  return damage
}

function getHealthRegeneration(regeneration: number, strength = 0) {
  return regeneration + strength * 0.1
}

function getManaRegeneration(regeneration: number, intelligence = 0) {
  return regeneration + intelligence * 0.05
}

export function getMagicResistance(magicResistance: number, intelligence = 0) {
  return magicResistance + intelligence * 0.001
}

function getDamageAfterArmor(damage: number, armor: number) {
  return damage * (1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor)))
}
