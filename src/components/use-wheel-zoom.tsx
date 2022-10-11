import * as React from "react"

import { getDefaultZoomOption, ZoomOptions } from "."
import { Position } from "../utils"

/**
 * @public
 */
export function useWheelZoom<T extends HTMLElement>(
  options?: Partial<ZoomOptions & {
    onChange(oldScale: number, newScale: number, cursor: Position): void
  }>
) {
  const [scale, setScale] = React.useState(1)
  const ref = React.useRef<T | null>(null)
  const { min, max } = getDefaultZoomOption(options)

  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        setScale((s) => {
          const newScale = Math.min(Math.max(min, s * Math.exp(-e.deltaY / 100)), max)
          if (s !== newScale) {
            options?.onChange?.(s, newScale, { x: e.clientX, y: e.clientY })
          }
          return newScale
        })
      }
    }
    ref.current.addEventListener('wheel', wheelHandler, { passive: false })
    return () => {
      ref.current?.removeEventListener('wheel', wheelHandler)
    }
  }, [ref.current])

  return {
    ref,
    scale,
    setScale,
  }
}
