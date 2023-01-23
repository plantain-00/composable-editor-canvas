import * as React from "react"

export function useDelayedAction(
  condition: boolean,
  delay: number,
  action: () => void,
) {
  const timeout = React.useRef<NodeJS.Timeout>()
  if (condition) {
    if (timeout.current) {
      clearTimeout(timeout.current)
    }
    timeout.current = setTimeout(() => {
      action()
    }, delay)
  }
}
