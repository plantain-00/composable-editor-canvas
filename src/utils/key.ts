const isMacKeyboard = typeof navigator === 'undefined' ? false : /Mac|iPod|iPhone|iPad/.test(navigator.platform)

/**
 * @public
 */
export function metaKeyIfMacElseCtrlKey(e: React.KeyboardEvent | KeyboardEvent) {
  return isMacKeyboard ? e.metaKey : e.ctrlKey
}
