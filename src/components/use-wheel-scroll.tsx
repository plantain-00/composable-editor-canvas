import * as React from "react"
import { Position } from "../utils"
import { useLocalStorageState } from "./use-local-storage-state"

/**
 * @public
 */
export function useWheelScroll<T extends HTMLElement>(
  options?: Partial<{
    maxOffsetX: number
    maxOffsetY: number
    initialPosition: Position
    localStorageXKey: string
    localStorageYKey: string
    minX: number
    maxX: number
    minY: number
    maxY: number
  }>
) {
  const maxOffsetX = options?.maxOffsetX ?? -1
  const maxOffsetY = options?.maxOffsetY ?? -1
  const minX = options?.minX
  const maxX = options?.maxX
  const minY = options?.minY
  const maxY = options?.maxY
  const [x, setX] = useLocalStorageState(options?.localStorageXKey, options?.initialPosition?.x ?? 0)
  const [y, setY] = useLocalStorageState(options?.localStorageYKey, options?.initialPosition?.y ?? 0)
  const ref = React.useRef<T | null>(null)

  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    const wheelHandler = (e: WheelEvent) => {
      if (!e.ctrlKey) {
        e.preventDefault()
        setX((x) => {
          let result = x - e.deltaX
          if (minX !== undefined) {
            result = Math.max(minX, result)
          }
          if (maxX !== undefined) {
            result = Math.min(maxX, result)
          }
          if (maxOffsetX >= 0) {
            result = Math.max(-maxOffsetX, Math.min(maxOffsetX, result))
          }
          return result
        })
        setY((y) => {
          let result = y - e.deltaY
          if (minY !== undefined) {
            result = Math.max(minY, result)
          }
          if (maxY !== undefined) {
            result = Math.min(maxY, result)
          }
          if (maxOffsetY >= 0) {
            result = Math.max(-maxOffsetY, Math.min(maxOffsetY, result))
          }
          return result
        })
      }
    }
    ref.current.addEventListener('wheel', wheelHandler, { passive: false })
    return () => {
      ref.current?.removeEventListener('wheel', wheelHandler)
    }
  }, [ref.current, maxOffsetX, maxOffsetY, minX, maxX, minY, maxY])

  return {
    ref,
    x,
    y,
    setX,
    setY,
  }
}
