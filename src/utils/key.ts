import React from "react"

const isMacKeyboard = typeof navigator === 'undefined' ? false : /Mac|iPod|iPhone|iPad/.test(navigator.platform)

/**
 * @public
 */
export function metaKeyIfMacElseCtrlKey(e: React.KeyboardEvent | KeyboardEvent | React.MouseEvent<HTMLOrSVGElement> | MouseEvent) {
  return isMacKeyboard ? e.metaKey : e.ctrlKey
}
