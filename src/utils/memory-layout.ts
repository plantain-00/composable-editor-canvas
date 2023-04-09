import { Matrix } from "./matrix";
import { Vec4 } from "./types";

export type MemoryLayoutInput =
  | { type: 'vec4', value: Vec4 }
  | { type: 'mat3x3', value: Matrix }
  | { type: 'number', value: number }


export function createMemoryLayoutArray(...inputs: MemoryLayoutInput[]) {
  let size = 0
  for (const input of inputs) {
    size += getMemoryLayoutSize(input)
  }
  const result = new Float32Array(size)
  let index = 0
  for (const input of inputs) {
    const { type, value } = input
    if (type === 'mat3x3') {
      result.set(value.slice(0, 3), index)
      result.set(value.slice(3, 6), index + 4)
      result.set(value.slice(6, 9), index + 8)
    } else if (type === 'vec4') {
      result.set(value, index)
    } else if (type === 'number') {
      result.set([value], index)
    }
    index += getMemoryLayoutSize(input)
  }
  return result
}

function getMemoryLayoutSize({ type }: MemoryLayoutInput) {
  if (type === 'mat3x3') {
    return 12
  } else if (type === 'vec4' || type === 'number') {
    return 4
  }
  return 0
}
