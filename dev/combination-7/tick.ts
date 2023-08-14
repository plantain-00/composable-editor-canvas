import { produce } from 'immer'
import { getPointByLengthAndDirection, getTwoPointsAngle, getTwoPointsDistance } from "../../src"
import { AbilityCooldown, Bullet, Model } from "./model"
import { getAbilityFromIndex, getDamageAfterArmor, getModelResult } from './utils'
import { updateAbilityCooldown } from './items'
import { units } from './units'

export function updateModels(t: number, models: Model[], bullets: Bullet[]) {
  const newModels = [...models]
  let changed = false

  const newBullets: Bullet[] = []
  for (const bullet of bullets) {
    const s = t * bullet.speed
    const source = newModels[bullet.source]
    const target = newModels[bullet.target]
    const d = getTwoPointsDistance(bullet.position, target.position) - units[target.unit].size
    if (d <= s) {
      if (units[target.unit].health) {
        const sourceResult = getModelResult(source)
        const targetResult = getModelResult(target)
        if (bullet.ability) {
          const ability = getAbilityFromIndex(bullet.ability)
          const newModel = ability?.cast?.hit(target, targetResult)
          if (newModel) {
            newModels[bullet.target] = newModel
            changed = true
          }
        } else if (sourceResult.attack && targetResult.health) {
          const damage = getDamageAfterArmor(sourceResult.attack.damage + Math.random() * sourceResult.attack.damageRange, targetResult.health.armor)
          const health = Math.max(0, (targetResult.health.current - damage) / targetResult.health.total)
          newModels[bullet.target] = produce(target, draft => {
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
      const p = getPointByLengthAndDirection(bullet.position, s, target.position)
      newBullets.push(produce(bullet, draft => {
        draft.position = p
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
        const target = newModels[model.action.target]
        const newFacing = getTwoPointsAngle(target.position, model.position)
        if (target.health && target.health > 0) {
          const distance = getTwoPointsDistance(model.position, target.position) - units[model.unit].size - units[target.unit].size
          if (model.action.ability) {
            const ability = getAbilityFromIndex(model.action.ability)
            const { index, source } = model.action.ability
            if (ability?.cast) {
              if (distance > ability.cast.range) {
                const s = t * modelResult.speed
                const p = getPointByLengthAndDirection(model.position, s, target.position)
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
                newBullets.push({
                  position: getPointByLengthAndDirection(model.position, units[model.unit].size, target.position),
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
              const p = getPointByLengthAndDirection(model.position, s, target.position)
              newModels[i] = produce(model, draft => {
                draft.position = p
                draft.facing = newFacing
              })
              changed = true
              continue
            }
            const attackTime = modelResult.attack.time
            if (modelResult.attack.cooldown === 0) {
              newModels[i] = produce(model, draft => {
                draft.facing = newFacing
                draft.attackCooldown = attackTime * 0.001
              })
              newBullets.push({
                position: getPointByLengthAndDirection(model.position, units[model.unit].size, target.position),
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
