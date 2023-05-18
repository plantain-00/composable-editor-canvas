import { Vec3, Vec4 } from "./types"

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

export function colorNumberToRec(n: number, alpha = 1): Vec4 {
  const [r, g, b] = colorNumberToPixelColor(n)
  return [r / 255, g / 255, b / 255, alpha]
}

export function recToColorNumber(color: Vec4) {
  return pixelColorToColorNumber([
    Math.round(color[0] * 255),
    Math.round(color[1] * 255),
    Math.round(color[2] * 255),
  ])
}

export function pixelColorToColorNumber(color: Vec3 | Uint8Array) {
  return (color[0] * 256 + color[1]) * 256 + color[2]
}

export function colorNumberToPixelColor(n: number) {
  const color: Vec3 = [0, 0, n % 256]
  n = Math.floor(n / 256)
  color[1] = n % 256
  color[0] = Math.floor(n / 256)
  return color
}

export function mergeOpacityToColor(color?: Vec4, opacity?: number): Vec4 | undefined {
  if (opacity === undefined) {
    return color
  }
  if (color === undefined) {
    return undefined
  }
  return [color[0], color[1], color[2], color[3] * opacity]
}

export function mergeOpacities(opacity1?: number, opacity2?: number): number | undefined {
  if (opacity1 === undefined) {
    return opacity2
  }
  if (opacity2 === undefined) {
    return opacity1
  }
  return opacity1 * opacity2
}
