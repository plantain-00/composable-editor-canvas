import * as React from "react"

/**
 * @public
 */
export function useKey(
  filter: (e: KeyboardEvent) => boolean,
  handler: (e: KeyboardEvent) => void,
  deps: unknown[] = [filter],
) {
  React.useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (filter(e)) {
        handler(e)
      }
    }
    window.addEventListener('keydown', keyHandler)
    return () => {
      window.removeEventListener('keydown', keyHandler)
    }
  }, deps)
}

/**
 * @public
 */
export const isMacKeyboard = typeof navigator === 'undefined' ? false : /Mac|iPod|iPhone|iPad/.test(navigator.platform)

/**
 * @public
 */
export function metaKeyIfMacElseCtrlKey(e: React.KeyboardEvent | KeyboardEvent) {
  return isMacKeyboard ? e.metaKey : e.ctrlKey
}
