import { produce } from 'immer'
import { Ability } from "./model";
import { getModelResult } from './utils';
import { updateAbilityCooldown } from './items';

export const abilities: Ability[] = [
  {
    name: 'Laguna Blade',
    cooldown: 70,
    mana: 150,
    cast: {
      range: 300,
      bulletSpeed: 400,
      hit(target, targetResult) {
        if (!targetResult.health || target.health === undefined) return
        const totalHealth = targetResult.health.total
        const health = Math.max(0, target.health - 500 / totalHealth)
        return produce(target, draft => {
          draft.health = health
        })
      },
    },
    launch(index, updater) {
      updater(m => {
        const ability = abilities[index]
        if (m.mana !== undefined) {
          const modelResult = getModelResult(m)
          if (modelResult.mana) {
            m.mana = Math.min(m.mana - ability.mana / modelResult.mana.total, 1)
          }
          updateAbilityCooldown(m, index, 'abilities', ability.cooldown)
        }
      })
    },
  },
]
