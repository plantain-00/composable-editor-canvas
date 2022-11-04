import { Size } from "./geometry"
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
/**
 * @public
 */
export function getTextSizeFromCache(font: string, text: string) {
  return textSizeMap.get(font, text, () => getTextSize(font, text))
}

/**
 * @public
 */
export function formatNumber(n: number, precision = 100) {
  return Math.round(n * precision) / precision
}
