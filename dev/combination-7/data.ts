import { Model } from "./model";

export const initialModels: Model[] = [
  {
    unit: 0,
    position: { x: 200, y: 200 },
    facing: 0,
    canControl: true,
    health: 0.4,
    mana: 0.5,
    attackCooldown: 0,
    items: [],
    abilities: [0],
  },
  {
    unit: 1,
    position: { x: 300, y: 200 },
    facing: 0,
    canControl: true,
    health: 0.8,
  },
  {
    unit: 2,
    position: { x: 400, y: 200 },
    facing: 0,
    canControl: false,
    health: 1,
  },
]
