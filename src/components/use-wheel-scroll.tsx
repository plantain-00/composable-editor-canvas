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
  }>
) {
  const maxOffsetX = options?.maxOffsetX ?? -1
  const maxOffsetY = options?.maxOffsetY ?? -1
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
          if (maxOffsetX >= 0) {
            return Math.max(-maxOffsetX, Math.min(maxOffsetX, x - e.deltaX))
          }
          return x - e.deltaX
        })
        setY((y) => {
          if (maxOffsetY >= 0) {
            return Math.max(-maxOffsetY, Math.min(maxOffsetY, y - e.deltaY))
          }
          return y - e.deltaY
        })
      }
    }
    ref.current.addEventListener('wheel', wheelHandler, { passive: false })
    return () => {
      ref.current?.removeEventListener('wheel', wheelHandler)
    }
  }, [ref.current, maxOffsetX, maxOffsetY])

  return {
    ref,
    x,
    y,
    setX,
    setY,
  }
}
