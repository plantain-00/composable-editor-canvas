/**
 * @public
 */
export function useZoom(
  value: number,
  onChange: (value: number) => void,
  options?: Partial<{
    min: number
    max: number
    step: number
  }>,
) {
  const { min, max } = getDefaultZoomOption(options)
  const step = options?.step ?? 1.25
  const setValue = (v: number) => {
    if (v === value) {
      return
    }
    if (v > max) {
      v = max
    } else if (v < min) {
      v = min
    }
    onChange(v)
  }
  return {
    canZoomIn: value < max,
    canZoomOut: value > min,
    zoomIn: (e?: { preventDefault(): void }) => {
      e?.preventDefault()
      setValue(value * step)
    },
    zoomOut: (e?: { preventDefault(): void }) => {
      e?.preventDefault()
      setValue(value / step)
    },
  }
}

export interface ZoomOptions {
  min: number
  max: number
}

export function getDefaultZoomOption(options?: Partial<ZoomOptions>) {
  return {
    min: options?.min ?? 0.1,
    max: options?.max ?? 10
  }
}
