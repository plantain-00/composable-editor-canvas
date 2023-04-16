import { Matrix } from "./matrix";
import { Vec2, Vec3, Vec4 } from "./types";

export type MemoryLayoutInput =
  | { type: 'vec4', value: Vec4 }
  | { type: 'mat3x3', value: Matrix }
  | MemoryLayoutInlineInput
  | { type: 'vec4 array', count: number, value: number[] }
  | { type: 'inline', children: MemoryLayoutInlineInput[] }

type MemoryLayoutInlineInput =
  | { type: 'vec2', value: Vec2 }
  | { type: 'vec3', value: Vec3 }
  | { type: 'number', value: number }

export function createMemoryLayoutArray(...inputs: MemoryLayoutInput[]) {
  let size = 0
  for (const input of inputs) {
    size += getMemoryLayoutSize(input)
  }
  const result = new Float32Array(size)
  let index = 0
  for (const input of inputs) {
    if (input.type === 'mat3x3') {
      result.set(input.value.slice(0, 3), index)
      result.set(input.value.slice(3, 6), index + 4)
      result.set(input.value.slice(6, 9), index + 8)
    } else if (input.type === 'vec4' || input.type === 'vec3' || input.type === 'vec2') {
      result.set(input.value, index)
    } else if (input.type === 'number') {
      result.set([input.value], index)
    } else if (input.type === 'vec4 array') {
      result.set(input.value, index)
    } else if (input.type === 'inline') {
      let i = 0
      for (const child of input.children) {
        if (child.type === 'number') {
          result.set([child.value], index + i)
          i++
        } else {
          result.set(child.value, index + i)
          if (child.type === 'vec2') {
            i += 2
          } else if (child.type === 'vec3') {
            i += 3
          }
        }
      }
    }
    index += getMemoryLayoutSize(input)
  }
  return result
}

function getMemoryLayoutSize(input: MemoryLayoutInput) {
  if (input.type === 'mat3x3') {
    return 12
  }
  if (input.type === 'vec4' || input.type === 'number' || input.type === 'vec2' || input.type === 'vec3' || input.type === 'inline') {
    return 4
  }
  if (input.type === 'vec4 array') {
    return input.count * 4
  }
  return 0
}
