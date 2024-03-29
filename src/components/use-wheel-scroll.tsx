import * as React from "react"
import { Position } from "../utils/position"
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
    disabled: boolean
    setXOffset: (x: number) => void
    setYOffset: (x: number) => void
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

  const filterX = (result: number) => {
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
  }
  const filterY = (result: number) => {
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
  }

  React.useEffect(() => {
    if (!ref.current || options?.disabled) {
      return
    }
    const wheelHandler = (e: WheelEvent) => {
      if (!e.ctrlKey) {
        e.preventDefault()
        if (options?.setXOffset) {
          options.setXOffset(-e.deltaX)
        } else {
          setX(x => filterX(x - e.deltaX))
        }
        if (options?.setYOffset) {
          options.setYOffset(-e.deltaY)
        } else {
          setY(y => filterY(y - e.deltaY))
        }
      }
    }
    ref.current.addEventListener('wheel', wheelHandler, { passive: false })
    return () => {
      ref.current?.removeEventListener('wheel', wheelHandler)
    }
  }, [ref.current, filterX, filterY, options?.disabled])

  return {
    ref,
    x,
    y,
    setX,
    setY,
    filterX,
    filterY,
  }
}
