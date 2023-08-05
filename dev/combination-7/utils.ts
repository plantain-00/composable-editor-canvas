import { items } from "./items"
import { Abilities, Model } from "./model"

export function getTotalHealth(totalHealth = 0, strength = 0) {
  return totalHealth + strength * 22
}

export function getTotalMana(totalMana: number, intelligence = 0) {
  return totalMana + intelligence * 12
}

export function getAttackTime(attackTime: number, attackSpeed = 0, agility = 0) {
  return attackTime * 100 / getAttackSpeed(attackSpeed, agility)
}

export function getAttackSpeed(attackSpeed: number, agility = 0) {
  return attackSpeed + agility
}

export function getArmor(armor = 0, abilities?: Abilities) {
  if (abilities?.primary === 'agility') {
    armor += abilities.agility / 6
  }
  return armor
}

export function getAttackDamage(damage = 0, abilities?: Abilities) {
  if (abilities) {
    if (abilities.primary === 'strength') {
      damage += abilities.strength
    } else if (abilities.primary === 'agility') {
      damage += abilities.agility
    } else if (abilities.primary === 'intelligence') {
      damage += abilities.intelligence
    } else {
      damage += (abilities.strength + abilities.agility + abilities.intelligence) * 0.7
    }
  }
  return damage
}

export function getModelResult(model: Model) {
  let speed = model.speed
  const abilities = model.abilities ? { ...model.abilities } : undefined
  const health = model.health ? { ...model.health } : undefined
  const mana = model.mana ? { ...model.mana } : undefined
  const attack = model.attack ? { ...model.attack } : undefined
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
      if (abilities) {
        if (item.strength) abilities.strength += item.strength
        if (item.agility) abilities.agility += item.agility
        if (item.intelligence) abilities.intelligence += item.intelligence
      }
    }
  }
  return {
    speed,
    health,
    mana,
    attack,
    bonusMagicResistance,
    abilities,
  }
}

export function getHealthRegeneration(regeneration: number, strength = 0) {
  return regeneration + strength * 0.1
}

export function getManaRegeneration(regeneration: number, intelligence = 0) {
  return regeneration + intelligence * 0.05
}

export function getMagicResistance(magicResistance: number, bonus = 1, intelligence = 0) {
  return 1 - (1 - (magicResistance + intelligence * 0.001)) * bonus
}

export function getDamageAfterArmor(damage: number, armor: number) {
  return damage * (1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor)))
}
