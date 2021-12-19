export function transformPosition(
  { x, y }: {
    x: number,
    y: number,
  },
  transform?: Partial<{
    containerSize: { width: number, height: number }
    targetSize: { width: number, height: number }
    x: number
    y: number
    scale: number
  }>,
) {
  const positionX = (transform?.targetSize?.width ?? 0) / 2 - ((transform?.containerSize?.width ?? 0) / 2 - x + (transform?.x ?? 0)) / (transform?.scale ?? 1)
  const positionY = (transform?.targetSize?.height ?? 0) / 2 - ((transform?.containerSize?.height ?? 0) / 2 - y + (transform?.y ?? 0)) / (transform?.scale ?? 1)
  return {
    x: positionX,
    y: positionY,
  }
}
