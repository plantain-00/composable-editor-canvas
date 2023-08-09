import { produce } from 'immer'
import { getPointByLengthAndDirection, getTwoPointsAngle, getTwoPointsDistance } from "../../src"
import { Bullet, ItemCooldown, Model } from "./model"
import { getArmor, getAttackDamage, getAttackTime, getDamageAfterArmor, getHealthRegeneration, getManaRegeneration, getModelResult, getTotalHealth, getTotalMana } from './utils'
import { items, updateItemCooldown } from './items'

export function updateModels(t: number, models: Model[], bullets: Bullet[]) {
  const newModels = [...models]
  let changed = false

  const newBullets: Bullet[] = []
  for (const bullet of bullets) {
    const s = t * bullet.speed
    const source = newModels[bullet.source]
    const target = newModels[bullet.target]
    const d = getTwoPointsDistance(bullet.position, target.position) - target.size
    if (d <= s) {
      if (target.health) {
        const sourceResult = getModelResult(source)
        const targetResult = getModelResult(target)
        if (bullet.itemIndex !== undefined) {
          const newModel = items[bullet.itemIndex].ability?.cast?.hit(target, targetResult)
          if (newModel) {
            newModels[bullet.target] = newModel
            changed = true
          }
        } else if (source.attack) {
          const armor = getArmor(targetResult.health?.armor, targetResult.abilities)
          const totalHealth = getTotalHealth(targetResult.health?.total, targetResult.abilities?.strength)
          const damage = getDamageAfterArmor(getAttackDamage(sourceResult.attack?.damage, sourceResult.abilities) + Math.random() * source.attack.damageRange, armor)
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

    if (model.itemCooldowns && model.itemCooldowns.length > 0) {
      const newItemCooldowns: ItemCooldown[] = []
      for (const itemCooldown of model.itemCooldowns) {
        const cooldown = Math.max(0, itemCooldown.cooldown - t)
        if (cooldown) {
          newItemCooldowns.push({
            itemIndex: itemCooldown.itemIndex,
            cooldown,
          })
        }
      }
      newModels[i] = produce(model, draft => {
        draft.itemCooldowns = newItemCooldowns
      })
      changed = true
      model = newModels[i]
    }

    if (model.action) {
      if (model.action.type === 'attack') {
        const target = newModels[model.action.target]
        const newFacing = getTwoPointsAngle(target.position, model.position)
        if (target.health && target.health.current > 0) {
          const distance = getTwoPointsDistance(model.position, target.position) - model.size - target.size
          if (model.action.itemIndex !== undefined) {
            const itemIndex = model.action.itemIndex
            const item = items[itemIndex]
            if (item.ability?.cast) {
              if (distance > item.ability.cast.range) {
                const s = t * modelResult.speed
                const p = getPointByLengthAndDirection(model.position, s, target.position)
                newModels[i] = produce(model, draft => {
                  draft.position = p
                  draft.facing = newFacing
                })
                changed = true
                continue
              }
              const cooldown = model.itemCooldowns?.find(c => c.itemIndex === itemIndex)?.cooldown
              if (!cooldown) {
                newModels[i] = produce(model, draft => {
                  draft.facing = newFacing
                  if (item.ability) {
                    updateItemCooldown(draft, itemIndex, item.ability.cooldown)
                    item.ability.launch(itemIndex, update => {
                      update(draft)
                    })
                  }
                })
                newBullets.push({
                  position: getPointByLengthAndDirection(model.position, model.size, target.position),
                  source: i,
                  target: model.action.target,
                  itemIndex,
                  speed: item.ability.cast.bulletSpeed,
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
          } else if (model.attack && modelResult.attack) {
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
            const attackSpeed = getAttackTime(model.attack.time, modelResult.attack?.speed, modelResult.abilities?.agility)
            if (model.attack.cooldown === 0) {
              newModels[i] = produce(model, draft => {
                draft.facing = newFacing
                if (draft.attack) {
                  draft.attack.cooldown = attackSpeed * 0.001
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
            newModels[i] = produce(model, draft => {
              draft.facing = newFacing
              if (draft.attack) {
                draft.attack.cooldown = Math.max(0, draft.attack.cooldown - t)
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
  return {
    models: changed ? newModels : undefined,
    bullets: newBullets.length > 0 || bullets.length > 0 ? newBullets : undefined,
  }
}
