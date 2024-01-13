import { Position } from "./position"
import { Region, Size } from "./region"
import { number, string, and } from "./validators"
import { MapCache2 } from "./weakmap-cache"

/**
 * @public
 */
export function getTextSize(font: string, text: string) {
  const ctx = new OffscreenCanvas(0, 0).getContext('2d')
  if (ctx) {
    ctx.font = font
    const textMetrics = ctx.measureText(text)
    const height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent
    return {
      width: textMetrics.width,
      height,
    }
  }
  return undefined
}

const textSizeMap = new MapCache2<string, string, Size | undefined>()

export function getTextSizeFromCache(font: string, text: string) {
  return textSizeMap.get(font, text, () => getTextSize(font, text))
}

export interface TextStyle {
  fontSize: number
  fontFamily: string
}

export const TextStyle = {
  fontSize: number,
  fontFamily: string,
}

export function getTextStyleFont(textStyleFont: TextStyle) {
  return `${textStyleFont.fontSize}px ${textStyleFont.fontFamily}`
}

export type Text = Position & TextStyle & {
  text: string
  color: number
}

export const Text = /* @__PURE__ */ and(Position, TextStyle, {
  text: string,
  color: number,
})

export type Image = Region & {
  url: string
}

export const Image = /* @__PURE__ */ and(Region, {
  url: string,
})

export function isWordCharactor(c: string) {
  if (c === '.') return true
  if (isLetter(c)) return true
  if (isNumber(c)) return true
  return false
}

export function isLetter(c: string) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
}

export function isNumber(c: string) {
  return c >= '0' && c <= '9'
}
