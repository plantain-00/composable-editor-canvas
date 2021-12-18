import * as React from "react"

import { getDefaultZoomOption, ZoomOptions } from "."

export function useWheelZoom<T extends HTMLElement>(
  setScale: React.Dispatch<React.SetStateAction<number>>,
  options?: Partial<ZoomOptions>
) {
  const ref = React.useRef<T | null>(null)
  const { min, max } = getDefaultZoomOption(options)

  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey) {
        setScale((s) => Math.min(Math.max(min, s * Math.exp(-e.deltaY / 100)), max))
      }
    }
    ref.current.addEventListener('wheel', wheelHandler, { passive: false })
    return () => {
      ref.current?.removeEventListener('wheel', wheelHandler)
    }
  }, [ref.current])

  return ref
}
