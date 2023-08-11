import { produce } from 'immer'
import { Item, Model } from './model'
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
      cooldown: 55,
      mana: 0,
      launch(itemIndex, updater) {
        updater(m => {
          if (m.mana !== undefined) {
            const modelResult = getModelResult(m)
            if (modelResult.mana) {
              m.mana = Math.min(m.mana + 175 / modelResult.mana.total, 1)
            }
          }
          const item = items[itemIndex]
          if (item.ability) {
            updateItemCooldown(m, itemIndex, item.ability.cooldown)
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
      launch(itemIndex, updater) {
        updater(m => {
          const item = items[itemIndex]
          if (m.mana !== undefined && item.ability) {
            const modelResult = getModelResult(m)
            if (modelResult.mana) {
              m.mana = Math.min(m.mana - item.ability.mana / modelResult.mana.total, 1)
            }
            updateItemCooldown(m, itemIndex, item.ability.cooldown)
          }
        })
      },
    },
  },
]

export function updateItemCooldown(m: Model, itemIndex: number, cooldown: number) {
  if (!m.itemCooldowns) m.itemCooldowns = []
  const index = m.itemCooldowns.findIndex(c => c.itemIndex === itemIndex)
  if (index >= 0) {
    m.itemCooldowns[index].cooldown = cooldown
  } else {
    m.itemCooldowns.push({ itemIndex, cooldown })
  }
}
