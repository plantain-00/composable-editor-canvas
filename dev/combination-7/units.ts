import { Unit } from "./model";

export const units: Unit[] = [
  {
    speed: 300,
    size: 24,
    health: {
      total: 500,
      regeneration: 10,
      armor: 0,
      magicResistance: 0.25,
    },
    mana: {
      total: 400,
      regeneration: 0.5,
    },
    attack: {
      damage: 50,
      damageRange: 2,
      speed: 100,
      time: 1700,
      bulletSpeed: 900,
      range: 300,
    },
    attributes: {
      strength: 20,
      agility: 30,
      intelligence: 15,
      primary: 'agility',
    },
  },
  {
    speed: 300,
    size: 24,
    health: {
      total: 600,
      regeneration: 10,
      armor: 10,
      magicResistance: 0.25,
    },
  },
  {
    speed: 300,
    size: 24,
    health: {
      total: 700,
      regeneration: 10,
      armor: -10,
      magicResistance: 0,
    },
  },
]
