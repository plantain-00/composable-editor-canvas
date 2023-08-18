import { Ability, Model } from "./model";
import { attackPureDamage, getModelResult } from './utils';
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
        return attackPureDamage(target, targetResult, 500)
      },
    },
    launch(index, updater) {
      updater(m => {
        consumeAbilityMana(m, index)
      })
    },
  },
  {
    name: 'Firestorm',
    cooldown: 16,
    mana: 110,
    cast: {
      range: 300,
      bulletSpeed: 400,
      radius: 200,
      hit(target, targetResult) {
        return attackPureDamage(target, targetResult, 200)
      },
    },
    launch(index, updater) {
      updater(m => {
        consumeAbilityMana(m, index)
      })
    },
  }
]

function consumeAbilityMana(m: Model, index: number) {
  const ability = abilities[index]
  if (m.mana !== undefined) {
    const modelResult = getModelResult(m)
    if (modelResult.mana) {
      m.mana = Math.min(m.mana - ability.mana / modelResult.mana.total, 1)
    }
    updateAbilityCooldown(m, index, 'abilities', ability.cooldown)
  }
}
