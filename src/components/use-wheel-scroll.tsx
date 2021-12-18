import * as React from "react"

export function useWheelScroll<T extends HTMLElement>(
  setX: React.Dispatch<React.SetStateAction<number>>,
  setY: React.Dispatch<React.SetStateAction<number>>,
  maxOffsetX: number,
  maxOffsetY: number,
) {
  const ref = React.useRef<T | null>(null)

  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      if (!e.ctrlKey) {
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

  return ref
}
