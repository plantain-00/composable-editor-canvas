import * as React from "react"

export function useInterval(callback: () => void, delay: number) {
  const lastCallback = React.useRef<() => void>()

  React.useEffect(() => {
    lastCallback.current = callback
  }, [callback])

  React.useEffect(() => {
    const id = setInterval(() => {
      lastCallback.current?.()
    }, delay)
    return () => clearInterval(id)
  }, [delay])
}
