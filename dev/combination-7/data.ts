import { Model } from "./model";

export const initialModels: Model[] = [
  {
    position: { x: 200, y: 200 },
    speed: 300,
    size: 24,
    facing: 0,
    canControl: true,
    health: {
      total: 500,
      current: 0.4,
      regeneration: 10,
      armor: 0,
      magicResistance: 0.25,
    },
    mana: {
      total: 400,
      current: 0.5,
      regeneration: 0.5,
    },
    attack: {
      damage: 50,
      damageRange: 2,
      speed: 100,
      time: 1700,
      cooldown: 0,
      bulletSpeed: 900,
      range: 300,
    },
    abilities: {
      strength: 20,
      agility: 30,
      intelligence: 15,
      primary: 'agility',
    },
    items: [],
  },
  {
    position: { x: 300, y: 200 },
    speed: 300,
    size: 24,
    facing: 0,
    canControl: true,
    health: {
      total: 600,
      current: 0.8,
      regeneration: 10,
      armor: 10,
      magicResistance: 0.25,
    },
  },
  {
    position: { x: 400, y: 200 },
    speed: 300,
    size: 24,
    facing: 0,
    canControl: false,
    health: {
      total: 700,
      current: 1,
      regeneration: 10,
      armor: -10,
      magicResistance: 0,
    },
  },
]
