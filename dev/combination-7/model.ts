import { Position } from "../../src"

export interface Model {
  position: Position
  speed: number
  action?: Action
  size: number
  facing: number
  canControl: boolean
  health?: {
    total: number
    current: number
    regeneration: number
    armor: number
    magicResistance: number
  }
  mana?: {
    total: number
    current: number
    regeneration: number
  }
  attack?: {
    damage: number
    damageRange: number
    speed: number
    time: number
    last: number
    bulletSpeed: number
    range: number
  }
  abilities?: Abilities
  items?: number[]
}

export interface Abilities {
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
}

export type Action = ActionMove | ActionAttack

export interface ActionMove {
  type: 'move'
  to: Position
}

export interface ActionAttack {
  type: 'attack'
  target: number
}
