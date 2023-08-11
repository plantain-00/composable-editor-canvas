import { Position } from "../../src"
import { getModelResult } from './utils'

export interface Model {
  unit: number
  position: Position
  action?: Action
  facing: number
  canControl: boolean
  health?: number
  mana?: number
  attackCooldown?: number
  items?: number[]
  itemCooldowns?: ItemCooldown[]
}

export interface Unit {
  speed: number
  size: number
  health?: {
    total: number
    regeneration: number
    armor: number
    magicResistance: number
  }
  mana?: {
    total: number
    regeneration: number
  }
  attack?: {
    damage: number
    damageRange: number
    speed: number
    time: number
    bulletSpeed: number
    range: number
  }
  attributes?: Attributes
}

export interface ItemCooldown {
  itemIndex: number
  cooldown: number
}

export interface Attributes {
  strength: number
  agility: number
  intelligence: number
  primary: 'strength' | 'agility' | 'intelligence' | 'universal'
}

export interface Bullet {
  position: Position
  source: number
  target: number
  speed: number
  itemIndex?: number
}

export interface Item {
  name: string
  speed?: number
  health?: number
  heathRegeneration?: number
  armor?: number
  magicResistance?: number
  mana?: number
  manaRegeneration?: number
  attackDamage?: number
  attackSpeed?: number
  attackRange?: number
  strength?: number
  agility?: number
  intelligence?: number
  ability?: Ability
}

export interface Ability {
  cooldown: number
  mana: number
  cast?: {
    range: number
    bulletSpeed: number
    hit(target: Model, targetResult: ReturnType<typeof getModelResult>): Model | undefined
  }
  launch(itemIndex: number, updater: Updater): void
}

export type Action = ActionMove | ActionAttack

export interface ActionMove {
  type: 'move'
  to: Position
}

export interface ActionAttack {
  type: 'attack'
  target: number
  itemIndex?: number
}

export type ModelStatus = Omit<ActionAttack, 'target'>

export type Updater = (update: (content: Model) => void) => void
