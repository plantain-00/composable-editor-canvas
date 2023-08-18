import { produce } from 'immer'
import { Position, getPointByLengthAndDirection, getTwoPointsAngle, getTwoPointsDistance } from "../../src"
import { AbilityCooldown, Bullet, Model } from "./model"
import { getAbilityFromIndex, getDamageAfterArmor, getModelResult, getModelsAroundPositionByRadiusExcept } from './utils'
import { updateAbilityCooldown } from './items'
import { units } from './units'

export function updateModels(t: number, models: Model[], bullets: Bullet[]) {
  const newModels = [...models]
  let changed = false

  const newBullets: Bullet[] = []
  for (const bullet of bullets) {
    const source = newModels[bullet.source]
    let position: Position | undefined
    if (bullet.type === undefined) {
      const s = t * bullet.speed
      const target = newModels[bullet.target]
      const d = getTwoPointsDistance(bullet.position, target.position) - units[target.unit].size
      if (d > s) {
        position = getPointByLengthAndDirection(bullet.position, s, target.position)
      }
    } else if (bullet.type === 'position') {
      const s = t * bullet.speed
      const d = getTwoPointsDistance(bullet.position, bullet.target)
      if (d > s) {
        position = getPointByLengthAndDirection(bullet.position, s, bullet.target)
      }
    }
    if (!position) {
      const targets = bullet.type === 'position'
        ? getModelsAroundPositionByRadiusExcept(newModels, bullet.target, bullet.radius, bullet.source)
        : [[bullet.target, newModels[bullet.target]] as const]
      for (const [index, target] of targets) {
        if (!units[target.unit].health) continue
        const sourceResult = getModelResult(source)
        const targetResult = getModelResult(target)
        if (bullet.ability) {
          const ability = getAbilityFromIndex(bullet.ability)
          if (ability?.cast) {
            const newModel = ability.cast.hit(target, targetResult)
            if (newModel) {
              newModels[index] = newModel
              changed = true
            }
          }
        } else if (sourceResult.attack && targetResult.health) {
          const damage = getDamageAfterArmor(sourceResult.attack.damage + Math.random() * sourceResult.attack.damageRange, targetResult.health.armor)
          const health = Math.max(0, (targetResult.health.current - damage) / targetResult.health.total)
          newModels[index] = produce(target, draft => {
            draft.health = health
          })
          if (health === 0) {
            newModels[bullet.source] = produce(source, draft => {
              draft.action = undefined
            })
          }
          changed = true
        }
      }
    } else {
      const p = position
      newBullets.push(produce(bullet, draft => {
        if (draft.type === undefined || draft.type === 'position') {
          draft.position = p
        }
      }))
    }
  }

  for (const i of newModels.keys()) {
    let model = newModels[i]
    const modelResult = getModelResult(model)
    if (model.health !== undefined && modelResult.health && modelResult.health.regeneration && model.health > 0 && model.health < 1) {
      const h = t * modelResult.health.regeneration
      const totalHealth = modelResult.health.total
      newModels[i] = produce(model, draft => {
        if (draft.health) {
          draft.health = Math.min(draft.health + h / totalHealth, 1)
        }
      })
      changed = true
      model = newModels[i]
    }

    if (model.mana !== undefined && modelResult.mana && modelResult.mana.regeneration && model.mana < 1) {
      const h = t * modelResult.mana.regeneration
      const totalMana = modelResult.mana.total
      newModels[i] = produce(model, draft => {
        if (draft.mana) {
          draft.mana = Math.min(draft.mana + h / totalMana, 1)
        }
      })
      changed = true
      model = newModels[i]
    }

    if (model.abilityCooldowns && model.abilityCooldowns.length > 0) {
      const newAbilityCooldowns: AbilityCooldown[] = []
      for (const abilityCooldown of model.abilityCooldowns) {
        const cooldown = Math.max(0, abilityCooldown.cooldown - t)
        if (cooldown) {
          newAbilityCooldowns.push({
            index: abilityCooldown.index,
            source: abilityCooldown.source,
            cooldown,
          })
        }
      }
      newModels[i] = produce(model, draft => {
        draft.abilityCooldowns = newAbilityCooldowns
      })
      changed = true
      model = newModels[i]
    }

    if (model.action) {
      if (model.action.type === 'attack') {
        let targetPosition: Position
        let canAttack: boolean
        let targetSize = 0
        if (typeof model.action.target === 'number') {
          const target = newModels[model.action.target]
          targetPosition = target.position
          canAttack = !!target.health && target.health > 0
          targetSize = units[target.unit].size
        } else {
          targetPosition = model.action.target
          canAttack = true
        }
        const newFacing = getTwoPointsAngle(targetPosition, model.position)
        if (canAttack) {
          const distance = getTwoPointsDistance(model.position, targetPosition) - units[model.unit].size - targetSize
          if (model.action.ability) {
            const ability = getAbilityFromIndex(model.action.ability)
            const { index, source } = model.action.ability
            if (ability?.cast) {
              if (distance > ability.cast.range) {
                const s = t * modelResult.speed
                const p = getPointByLengthAndDirection(model.position, s, targetPosition)
                newModels[i] = produce(model, draft => {
                  draft.position = p
                  draft.facing = newFacing
                })
                changed = true
                continue
              }
              const cooldown = model.abilityCooldowns?.find(c => c.source === source && c.index === index)?.cooldown
              if (!cooldown) {
                newModels[i] = produce(model, draft => {
                  draft.facing = newFacing
                  draft.action = undefined
                  updateAbilityCooldown(draft, index, source, ability.cooldown)
                  ability.launch(index, update => {
                    update(draft)
                  })
                })
                if (typeof model.action.target !== 'number') {
                  if (ability.cast.bulletSpeed && ability.cast.radius) {
                    newBullets.push({
                      type: 'position',
                      position: getPointByLengthAndDirection(model.position, units[model.unit].size, targetPosition),
                      source: i,
                      target: targetPosition,
                      speed: ability.cast.bulletSpeed,
                      radius: ability.cast.radius,
                      ability: {
                        index,
                        source,
                      },
                    })
                    changed = true
                  }
                  continue
                }
                if (!ability.cast.bulletSpeed) {
                  newBullets.push({
                    type: 'instant',
                    source: i,
                    target: model.action.target,
                    ability: {
                      index,
                      source,
                    },
                  })
                  changed = true
                  continue
                }
                newBullets.push({
                  position: getPointByLengthAndDirection(model.position, units[model.unit].size, targetPosition),
                  source: i,
                  target: model.action.target,
                  ability: {
                    index,
                    source,
                  },
                  speed: ability.cast.bulletSpeed,
                })
                changed = true
                continue
              }
              newModels[i] = produce(model, draft => {
                draft.facing = newFacing
              })
              changed = true
              continue
            }
          } else if (modelResult.attack) {
            if (distance > modelResult.attack.range) {
              const s = t * modelResult.speed
              const p = getPointByLengthAndDirection(model.position, s, targetPosition)
              newModels[i] = produce(model, draft => {
                draft.position = p
                draft.facing = newFacing
              })
              changed = true
              continue
            }
            const attackTime = modelResult.attack.time
            if (modelResult.attack.cooldown === 0 && typeof model.action.target === 'number') {
              newModels[i] = produce(model, draft => {
                draft.facing = newFacing
                draft.attackCooldown = attackTime * 0.001
              })
              newBullets.push({
                position: getPointByLengthAndDirection(model.position, units[model.unit].size, targetPosition),
                source: i,
                target: model.action.target,
                speed: modelResult.attack.bulletSpeed,
              })
              changed = true
              continue
            }
            newModels[i] = produce(model, draft => {
              draft.facing = newFacing
              if (draft.attackCooldown) {
                draft.attackCooldown = Math.max(0, draft.attackCooldown - t)
              }
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
          if (getTwoPointsDistance(m.position, newModel.position) < units[m.unit].size + units[newModel.unit].size) {
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
  return {
    models: changed ? newModels : undefined,
    bullets: newBullets.length > 0 || bullets.length > 0 ? newBullets : undefined,
  }
}
