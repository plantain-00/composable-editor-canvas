import * as React from "react"

/**
 * @public
 */
export function useGlobalMouseUp(handler: (e: MouseEvent) => void) {
  React.useEffect(() => {
    window.addEventListener('mouseup', handler, { passive: false })
    return () => {
      window.removeEventListener('mouseup', handler)
    }
  }, [handler])
}
