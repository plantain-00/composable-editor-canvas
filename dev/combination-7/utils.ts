import { abilities } from "./abilities"
import { items } from "./items"
import { AbilityIndex, Model } from "./model"
import { units } from "./units"

export function getModelResult(model: Model) {
  const unit = units[model.unit]
  let speed = unit.speed
  const attributes = unit.attributes ? {
    ...unit.attributes,
    base: unit.attributes,
  } : undefined
  const health = unit.health && model.health !== undefined ? {
    ...unit.health,
    current: model.health,
    base: unit.health,
  } : undefined
  const mana = unit.mana && model.mana !== undefined ? {
    ...unit.mana,
    current: model.mana,
    base: unit.mana,
  } : undefined
  const attack = unit.attack && model.attackCooldown !== undefined ? {
    ...unit.attack,
    cooldown: model.attackCooldown,
    base: unit.attack,
  } : undefined
  const bonusMagicResistance = 1
  if (model.items) {
    for (const i of model.items) {
      const item = items[i]
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
      if (attributes) {
        if (item.strength) attributes.strength += item.strength
        if (item.agility) attributes.agility += item.agility
        if (item.intelligence) attributes.intelligence += item.intelligence
      }
    }
  }
  if (health) {
    if (attributes?.strength) {
      health.total += attributes.strength * 22
      health.regeneration += attributes.strength * 0.1
    }
    if (attributes?.agility) {
      health.armor += attributes.agility / 6
    }
    if (attributes?.intelligence) {
      health.magicResistance = 1 - (1 - (health.magicResistance + attributes.intelligence * 0.001)) * bonusMagicResistance
    }
    health.current *= health.total
  }
  if (mana) {
    if (attributes?.intelligence) {
      mana.total += attributes.intelligence * 12
      mana.regeneration += attributes.intelligence * 0.05
    }
    mana.current *= mana.total
  }
  if (attack && attributes) {
    if (attributes.primary === 'strength') {
      attack.damage += attributes.strength
    } else if (attributes.primary === 'agility') {
      attack.damage += attributes.agility
    } else if (attributes.primary === 'intelligence') {
      attack.damage += attributes.intelligence
    } else {
      attack.damage += (attributes.strength + attributes.agility + attributes.intelligence) * 0.7
    }
    if (attributes.agility) {
      attack.speed += attributes.agility
    }
    attack.time *= 100 / attack.speed
  }
  return {
    size: unit.size,
    baseSpeed: unit.speed,
    speed,
    health,
    mana,
    attack,
    attributes,
  }
}

export function getDamageAfterArmor(damage: number, armor: number) {
  return damage * (1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor)))
}

export function getAbilityFromIndex(ability: AbilityIndex) {
  if (ability.source === 'abilities') {
    return abilities[ability.index]
  }
  return items[ability.index].ability
}
