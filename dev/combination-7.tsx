import React from "react";
import { produce } from 'immer'
import { BooleanEditor, EnumEditor, NumberEditor, ObjectEditor, Position, getPointByLengthAndAngle, getPointByLengthAndDirection, getTwoPointsAngle, getTwoPointsDistance, pointIsInRegion, reactCanvasRenderTarget, useDragSelect, useKey, useRefState, useWindowSize } from "../src";

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
        magicResistance: 0.25,
      },
      mana: {
        total: 400,
        current: 0.75,
        regeneration: 0.5,
      },
      attack: {
        damage: 50,
        damageRange: 2,
        speed: 100,
        time: 1700,
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
      items: [ironBranchItem, bootsOfSpeedItem, vitalityBoosterItem, ringOfHealthItem, platemailItem, cloakItem, aetherLensItem, monkeyKingBarItem],
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

  let panel: JSX.Element | undefined
  if (selected.length > 0) {
    const target = models[selected[0]]
    const updater = (update: (content: Model) => void) => {
      setModels(produce(models, draft => {
        update(draft[0])
      }))
    }
    const modelResult = getModelResult(target)
    const properties: Record<string, JSX.Element> = {
      baseSpeed: <NumberEditor value={target.speed} setValue={v => updater(m => { m.speed = v })} />,
      totalSpeed: <NumberEditor value={modelResult.speed} />,
      canControl: <BooleanEditor value={target.canControl} setValue={v => updater(m => { m.canControl = v })} />,
    }
    if (target.health && modelResult.health) {
      const totalHealth = getTotalHealth(modelResult.health.total, modelResult.abilities?.strength)
      properties.baseHealth = <NumberEditor value={Math.round(target.health.total)} setValue={v => updater(m => { if (m.health) { m.health.total = v } })} />
      properties.totalHealth = <NumberEditor value={Math.round(totalHealth)} />
      properties.currentHealth = <NumberEditor value={Math.round(totalHealth * target.health.current)} />
      properties.baseHealthRegeneration = <NumberEditor value={target.health.regeneration} setValue={v => updater(m => { if (m.health) { m.health.regeneration = v } })} />
      properties.totalHealthRegeneration = <NumberEditor value={getHealthRegeneration(modelResult.health.regeneration, modelResult.abilities?.strength)} />
      properties.baseArmor = <NumberEditor value={target.health.armor} setValue={v => updater(m => { if (m.health) { m.health.armor = v } })} />
      properties.totalArmor = <NumberEditor value={Math.round(getArmor(modelResult.health.armor, modelResult.abilities))} />
      properties.baseMagicResistance = <NumberEditor value={target.health.magicResistance} setValue={v => updater(m => { if (m.health) { m.health.magicResistance = v } })} />
      properties.totalMagicResistance = <NumberEditor value={getMagicResistance(target.health.magicResistance, modelResult.bonusMagicResistance, modelResult.abilities?.intelligence)} />
    }
    if (target.mana && modelResult.mana) {
      const totalMana = getTotalMana(modelResult.mana.total, modelResult.abilities?.intelligence)
      properties.baseMana = <NumberEditor value={Math.round(target.mana.total)} setValue={v => updater(m => { if (m.mana) { m.mana.total = v } })} />
      properties.totalMana = <NumberEditor value={Math.round(totalMana)} />
      properties.currentMana = <NumberEditor value={Math.round(totalMana * target.mana.current)} />
      properties.baseManaRegeneration = <NumberEditor value={target.mana.regeneration} setValue={v => updater(m => { if (m.mana) { m.mana.regeneration = v } })} />
      properties.totalManaRegeneration = <NumberEditor value={getManaRegeneration(modelResult.mana.regeneration, modelResult.abilities?.intelligence)} />
    }
    if (target.attack && modelResult.attack) {
      properties.baseDamage = <NumberEditor value={target.attack.damage} setValue={v => updater(m => { if (m.attack) { m.attack.damage = v } })} />
      properties.damageRange = <NumberEditor value={target.attack.damageRange} setValue={v => updater(m => { if (m.attack) { m.attack.damageRange = v } })} />
      properties.totalDamage = <NumberEditor value={Math.round(getAttackDamage(modelResult.attack.damage, modelResult.abilities))} />
      properties.baseAttackSpeed = <NumberEditor value={target.attack.speed} setValue={v => updater(m => { if (m.attack) { m.attack.speed = v } })} />
      properties.totalAttackSpeed = <NumberEditor value={getAttackSpeed(modelResult.attack.speed, modelResult.abilities?.agility)} />
      properties.baseAttackTime = <NumberEditor value={target.attack.time} setValue={v => updater(m => { if (m.attack) { m.attack.time = v } })} />
      properties.totalAttackTime = <NumberEditor value={Math.round(getAttackTime(target.attack.time, modelResult.attack.speed, modelResult.abilities?.agility))} />
      properties.bulletSpeed = <NumberEditor value={target.attack.bulletSpeed} setValue={v => updater(m => { if (m.attack) { m.attack.bulletSpeed = v } })} />
      properties.baseAttackRange = <NumberEditor value={target.attack.range} setValue={v => updater(m => { if (m.attack) { m.attack.range = v } })} />
      properties.totalAttackRange = <NumberEditor value={modelResult.attack.range} />
    }
    if (target.abilities && modelResult.abilities) {
      properties.baseStrength = <NumberEditor value={target.abilities.strength} setValue={v => updater(m => { if (m.abilities) { m.abilities.strength = v } })} />
      properties.totalStrength = <NumberEditor value={modelResult.abilities.strength} />
      properties.baseAgility = <NumberEditor value={target.abilities.agility} setValue={v => updater(m => { if (m.abilities) { m.abilities.agility = v } })} />
      properties.totalAgility = <NumberEditor value={modelResult.abilities.agility} />
      properties.baseIntelligence = <NumberEditor value={target.abilities.intelligence} setValue={v => updater(m => { if (m.abilities) { m.abilities.intelligence = v } })} />
      properties.totalIntelligence = <NumberEditor value={modelResult.abilities.intelligence} />
      properties.primary = <EnumEditor enums={['strength', 'agility', 'intelligence', 'universal']} value={target.abilities.primary} setValue={v => updater(m => { if (m.abilities) { m.abilities.primary = v } })} />
    }
    panel = (
      <div style={{ position: 'absolute', right: '0px', top: '0px', bottom: '0px', width: '400px', overflowY: 'auto', background: 'white', zIndex: 11 }}>
        <ObjectEditor inline properties={properties} />
      </div>
    )
  }

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
              const sourceResult = getModelResult(source)
              const targetResult = getModelResult(target)
              const armor = getArmor(targetResult.health?.armor, targetResult.abilities)
              const damage = getDamageAfterArmor(getAttackDamage(sourceResult.attack?.damage, sourceResult.abilities) + Math.random() * source.attack.damageRange, armor)
              const totalHealth = getTotalHealth(targetResult.health?.total, targetResult.abilities?.strength)
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

        for (const i of newModels.keys()) {
          let model = newModels[i]
          const modelResult = getModelResult(model)
          if (model.health && modelResult.health && model.health.regeneration && model.health.current > 0 && model.health.current < 1) {
            const h = t * getHealthRegeneration(modelResult.health.regeneration, modelResult.abilities?.strength)
            const totalHealth = getTotalHealth(modelResult.health.total, modelResult.abilities?.strength)
            newModels[i] = produce(model, draft => {
              if (draft.health) {
                draft.health.current = Math.min(draft.health.current + h / totalHealth, 1)
              }
            })
            changed = true
            model = newModels[i]
          }

          if (model.mana && modelResult.mana && model.mana.regeneration && model.mana.current < 1) {
            const h = t * getManaRegeneration(modelResult.mana.regeneration, modelResult.abilities?.intelligence)
            const totalMana = getTotalMana(modelResult.mana.total, modelResult.abilities?.intelligence)
            newModels[i] = produce(model, draft => {
              if (draft.mana) {
                draft.mana.current = Math.min(draft.mana.current + h / totalMana, 1)
              }
            })
            changed = true
            model = newModels[i]
          }

          if (model.action) {
            if (model.action.type === 'attack') {
              const target = newModels[model.action.target]
              const newFacing = getTwoPointsAngle(target.position, model.position)
              if (target.health && target.health.current > 0 && model.attack && modelResult.attack) {
                if (getTwoPointsDistance(model.position, target.position) > modelResult.attack.range + model.size + target.size) {
                  const s = t * modelResult.speed
                  const p = getPointByLengthAndDirection(model.position, s, target.position)
                  newModels[i] = produce(model, draft => {
                    draft.position = p
                    draft.facing = newFacing
                  })
                  changed = true
                  continue
                }
                const attackSpeed = getAttackTime(model.attack.time, modelResult.attack?.speed, modelResult.abilities?.agility)
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
            const s = t * modelResult.speed
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

  return <>
    <div style={{ position: 'absolute', inset: '0px', overflow: 'hidden' }} onMouseDown={onStartSelect} onContextMenu={onContextMenu}>
      {target.renderResult(children, width, height)}
      {dragSelectMask}
    </div>
    {panel}
  </>
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
    time: number
    last: number
    bulletSpeed: number
    range: number
  }
  abilities?: Abilities
  items?: Item[]
}

interface Abilities {
  strength: number
  agility: number
  intelligence: number
  primary: 'strength' | 'agility' | 'intelligence' | 'universal'
}

interface Bullet {
  position: Position
  source: number
  target: number
  speed: number
}

interface Item {
  name: string
  speed?: number
  health?: number
  heathRegeneration?: number
  armor?: number
  magicResistance?: number
  mana?: number
  manaRegeneration?: number
  attackDamage?: number
  attackSpeed?: number
  attackRange?: number
  strength?: number
  agility?: number
  intelligence?: number
}

const ironBranchItem: Item = {
  name: 'Icon Branch',
  strength: 1,
  agility: 1,
  intelligence: 1,
}
const bootsOfSpeedItem: Item = {
  name: 'Boots of Speed',
  speed: 45,
}
const vitalityBoosterItem: Item = {
  name: 'Vitality Booster',
  health: 250,
}
const ringOfHealthItem: Item = {
  name: 'Ring of Health',
  heathRegeneration: 4.5,
}
const platemailItem: Item = {
  name: 'Platemail',
  armor: 10,
}
const cloakItem: Item = {
  name: 'Cloak',
  magicResistance: 0.2,
}
const aetherLensItem: Item = {
  name: 'Aether Lens',
  mana: 300,
  manaRegeneration: 2.5,
}
const monkeyKingBarItem: Item = {
  name: 'Monkey King Bar',
  attackDamage: 40,
  attackSpeed: 45,
  attackRange: 100,
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

function getTotalHealth(totalHealth = 0, strength = 0) {
  return totalHealth + strength * 22
}

function getTotalMana(totalMana: number, intelligence = 0) {
  return totalMana + intelligence * 12
}

function getAttackTime(attackTime: number, attackSpeed = 0, agility = 0) {
  return attackTime * 100 / getAttackSpeed(attackSpeed, agility)
}

function getAttackSpeed(attackSpeed: number, agility = 0) {
  return attackSpeed + agility
}

function getArmor(armor = 0, abilities?: Abilities) {
  if (abilities?.primary === 'agility') {
    armor += abilities.agility / 6
  }
  return armor
}

function getAttackDamage(damage = 0, abilities?: Abilities) {
  if (abilities) {
    if (abilities.primary === 'strength') {
      damage += abilities.strength
    } else if (abilities.primary === 'agility') {
      damage += abilities.agility
    } else if (abilities.primary === 'intelligence') {
      damage += abilities.intelligence
    } else {
      damage += (abilities.strength + abilities.agility + abilities.intelligence) * 0.7
    }
  }
  return damage
}

function getModelResult(model: Model) {
  let speed = model.speed
  const abilities = model.abilities ? { ...model.abilities } : undefined
  const health = model.health ? { ...model.health } : undefined
  const mana = model.mana ? { ...model.mana } : undefined
  const attack = model.attack ? { ...model.attack } : undefined
  const bonusMagicResistance = 1
  if (model.items) {
    for (const item of model.items) {
      if (item.speed) speed += item.speed
      if (health) {
        if (item.health) health.total += item.health
        if (item.heathRegeneration) health.regeneration += item.heathRegeneration
        if (item.armor) health.armor += item.armor
        if (item.magicResistance) bonusMagicResistance * 1 - item.magicResistance
      }
      if (mana) {
        if (item.mana) mana.total += item.mana
        if (item.manaRegeneration) mana.regeneration += item.manaRegeneration
      }
      if (attack) {
        if (item.attackDamage) attack.damage += item.attackDamage
        if (item.attackSpeed) attack.speed += item.attackSpeed
        if (item.attackRange) attack.range += item.attackRange
      }
      if (abilities) {
        if (item.strength) abilities.strength += item.strength
        if (item.agility) abilities.agility += item.agility
        if (item.intelligence) abilities.intelligence += item.intelligence
      }
    }
  }
  return {
    speed,
    health,
    mana,
    attack,
    bonusMagicResistance,
    abilities,
  }
}

function getHealthRegeneration(regeneration: number, strength = 0) {
  return regeneration + strength * 0.1
}

function getManaRegeneration(regeneration: number, intelligence = 0) {
  return regeneration + intelligence * 0.05
}

function getMagicResistance(magicResistance: number, bonus = 1, intelligence = 0) {
  return 1 - (1 - (magicResistance + intelligence * 0.001)) * bonus
}

function getDamageAfterArmor(damage: number, armor: number) {
  return damage * (1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor)))
}
