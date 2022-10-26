import * as React from "react"

/**
 * @public
 */
export function useLocalStorageState<S>(key: string | undefined, defaultValue: S): [S, React.Dispatch<React.SetStateAction<S>>, S] {
  const [state, setState] = React.useState(() => {
    if (!key) {
      return defaultValue
    }
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
  const initialState = React.useRef(state)

  React.useEffect(() => {
    if (key) {
      localStorage.setItem(key, JSON.stringify(state))
    }
  }, [state, key])

  return [state, setState, initialState.current]
}
