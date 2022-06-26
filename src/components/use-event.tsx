import * as React from "react"

/**
 * @public
 */
export function useEvent<T>(handler: (e: T) => void) {
  const handlerRef = React.useRef<((e: T) => void) | undefined>()

  React.useLayoutEffect(() => {
    handlerRef.current = handler
  })

  return React.useCallback<(e: T) => void>((e) => {
    handlerRef.current?.(e)
  }, [])
}
