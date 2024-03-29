import * as React from "react"

/**
 * @public
 */
export function useGlobalKeyDown(handler: (e: KeyboardEvent) => void) {
  React.useEffect(() => {
    window.addEventListener('keydown', handler, { passive: false })
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [handler])
}

export function useGlobalKeyUp(handler: (e: KeyboardEvent) => void) {
  React.useEffect(() => {
    window.addEventListener('keyup', handler, { passive: false })
    return () => {
      window.removeEventListener('keyup', handler)
    }
  }, [handler])
}
