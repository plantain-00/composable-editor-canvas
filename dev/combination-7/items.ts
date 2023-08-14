import { produce } from 'immer'
import { AbilitySource, Item, Model } from './model'
import { getModelResult } from './utils'

export const items: Item[] = [
  {
    name: 'Icon Branch',
    strength: 1,
    agility: 1,
    intelligence: 1,
  },
  {
    name: 'Boots of Speed',
    speed: 45,
  },
  {
    name: 'Vitality Booster',
    health: 250,
  },
  {
    name: 'Ring of Health',
    heathRegeneration: 4.5,
  },
  {
    name: 'Platemail',
    armor: 10,
  },
  {
    name: 'Cloak',
    magicResistance: 0.2,
  },
  {
    name: 'Aether Lens',
    mana: 300,
    manaRegeneration: 2.5,
  },
  {
    name: 'Monkey King Bar',
    attackDamage: 40,
    attackSpeed: 45,
  },
  {
    name: 'Arcane Boots',
    mana: 250,
    speed: 45,
    ability: {
      name: 'Replenish Mana',
      cooldown: 55,
      mana: 0,
      launch(index, updater) {
        updater(m => {
          if (m.mana !== undefined) {
            const modelResult = getModelResult(m)
            if (modelResult.mana) {
              m.mana = Math.min(m.mana + 175 / modelResult.mana.total, 1)
            }
          }
          const item = items[index]
          if (item.ability) {
            updateAbilityCooldown(m, index, 'items', item.ability.cooldown)
          }
        })
      },
    }
  },
  {
    name: 'Dagon',
    strength: 7,
    agility: 7,
    intelligence: 7,
    ability: {
      name: 'Energy Burst',
      cooldown: 35,
      mana: 120,
      cast: {
        range: 300,
        bulletSpeed: 3000,
        hit(target, targetResult) {
          if (!targetResult.health || target.health === undefined) return
          const magicResistance = targetResult.health.magicResistance
          const totalHealth = targetResult.health.total
          const damage = 400 * (1 - magicResistance)
          const health = Math.max(0, target.health - damage / totalHealth)
          return produce(target, draft => {
            draft.health = health
          })
        },
      },
      launch(index, updater) {
        updater(m => {
          const item = items[index]
          if (m.mana !== undefined && item.ability) {
            const modelResult = getModelResult(m)
            if (modelResult.mana) {
              m.mana = Math.min(m.mana - item.ability.mana / modelResult.mana.total, 1)
            }
            updateAbilityCooldown(m, index, 'items', item.ability.cooldown)
          }
        })
      },
    },
  },
]

export function updateAbilityCooldown(m: Model, index: number, source: AbilitySource, cooldown: number) {
  if (!m.abilityCooldowns) m.abilityCooldowns = []
  const abilityCooldown = m.abilityCooldowns.find(c => c.index === index)
  if (abilityCooldown) {
    abilityCooldown.cooldown = cooldown
  } else {
    m.abilityCooldowns.push({ index, cooldown, source })
  }
}
