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
