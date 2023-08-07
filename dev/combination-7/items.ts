import { Item, Model } from './model'
import { getModelResult, getTotalMana } from './utils'

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
      act(itemIndex, updater) {
        updater(m => {
          if (m.mana) {
            const modelResult = getModelResult(m)
            const totalMana = getTotalMana(m.mana.total, modelResult.abilities?.intelligence)
            m.mana.current = Math.min(m.mana.current + 175 / totalMana, 1)
          }
          const item = items[itemIndex]
          if (item.ability) {
            updateItemCooldown(m, itemIndex, item.ability.cooldown)
          }
        })
      },
    }
  },
]

function updateItemCooldown(m: Model, itemIndex: number, cooldown: number) {
  if (!m.itemCooldowns) m.itemCooldowns = []
  const index = m.itemCooldowns.findIndex(c => c.itemIndex === itemIndex)
  if (index >= 0) {
    m.itemCooldowns[index].cooldown = cooldown
  } else {
    m.itemCooldowns.push({ itemIndex, cooldown })
  }
}
