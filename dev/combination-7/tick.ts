import { produce } from 'immer'
import { getPointByLengthAndDirection, getTwoPointsAngle, getTwoPointsDistance } from "../../src"
import { Bullet, Model } from "./model"
import { getArmor, getAttackDamage, getAttackTime, getDamageAfterArmor, getHealthRegeneration, getManaRegeneration, getModelResult, getTotalHealth, getTotalMana } from './utils'

export function updateModels(t: number, time: number, models: Model[], bullets: Bullet[]) {
  const newModels = [...models]
  let changed = false

  const newBullets: Bullet[] = []
  for (const bullet of bullets) {
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
  return {
    models: changed ? newModels : undefined,
    bullets: newBullets.length > 0 || bullets.length > 0 ? newBullets : undefined,
  }
}
