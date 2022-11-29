import type * as React from "react"

/**
 * @public
 */
export function bindMultipleRefs<T>(
  ...refs: (React.ForwardedRef<T> | React.MutableRefObject<T | null>)[]
) {
  return (r: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(r)
      } else if (ref) {
        ref.current = r
      }
    }
  }
}
