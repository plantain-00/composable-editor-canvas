import { Vec4 } from "./types"

/**
 * @public
 */
export function colorStringToNumber(color: string): number {
  return +`0x${color.slice(1)}`
}

/**
 * @public
 */
export function getColorString(color: number, alpha?: number): string {
  const s = color.toString(16)
  let a = ''
  if (alpha !== undefined) {
    const f = Math.floor(alpha * 255).toString(16)
    a = '0'.repeat(2 - f.length) + f
  }
  return `#${'0'.repeat(6 - s.length)}${s}${a}`
}

export function colorNumberToRec(n: number, alpha = 1) {
  const color: Vec4 = [0, 0, 0, alpha]
  color[2] = n % 256 / 255
  n = Math.floor(n / 256)
  color[1] = n % 256 / 255
  color[0] = Math.floor(n / 256) / 255
  return color
}

export function recToColorNumber(color: Vec4) {
  return pixelColorToColorNumber([
    Math.round(color[0] * 255),
    Math.round(color[1] * 255),
    Math.round(color[2] * 255),
    Math.round(color[3] * 255),
  ])
}

export function pixelColorToColorNumber(color: Vec4 | Uint8Array) {
  return (color[0] * 256 + color[1]) * 256 + color[2]
}

export function mergeOpacityToColor(color?: Vec4, opacity?: number) {
  if (opacity === undefined) {
    return color
  }
  if (color === undefined) {
    return undefined
  }
  return [color[0], color[1], color[2], color[3] * opacity]
}
