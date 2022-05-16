import * as React from "react"

export function useWindowSize() {
  const [size, setSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const timeoutId = React.useRef<NodeJS.Timeout>()
  window.addEventListener('resize', () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current)
    }
    timeoutId.current = setTimeout(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }, 500)
  })
  return size
}
