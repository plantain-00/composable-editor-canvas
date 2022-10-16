import * as React from "react"

/**
 * @public
 */
export function useLocalStorageState<S>(key: string, defaultValue: S): [S, React.Dispatch<S>] {
  const [state, setState] = React.useState(() => {
    const stateString = localStorage.getItem(key)
    if (stateString) {
      try {
        return JSON.parse(stateString) as S
      } catch {
        return defaultValue
      }
    }
    return defaultValue
  })
  const onChange: React.Dispatch<S> = (s) => {
    localStorage.setItem(key, JSON.stringify(s))
    setState(s)
  }
  return [state, onChange]
}
