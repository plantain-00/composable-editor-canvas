import * as React from "react"
import { Position } from "../utils/geometry"
import { useLocalStorageState } from "./use-local-storage-state"
import { getDefaultZoomOption, ZoomOptions } from "./use-zoom"

/**
 * @public
 */
export function useWheelZoom<T extends HTMLElement>(
  options?: Partial<ZoomOptions & {
    onChange(oldScale: number, newScale: number, cursor: Position): void
    initialValue: number
    localStorageKey: string
    setScaleOffset: (x: number, cursor: Position) => void
  }>
) {
  const [scale, setScale] = useLocalStorageState(options?.localStorageKey, options?.initialValue ?? 1)
  const ref = React.useRef<T | null>(null)
  const { min, max } = getDefaultZoomOption(options)

  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        if (options?.setScaleOffset) {
          options.setScaleOffset(Math.exp(-e.deltaY / 100), { x: e.clientX, y: e.clientY })
          return
        }
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
  }, [ref.current, options?.setScaleOffset])

  return {
    ref,
    scale,
    setScale,
  }
}
