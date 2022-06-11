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
