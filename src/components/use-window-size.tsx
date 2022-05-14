import * as React from "react"

export function useWindowSize() {
  const [size, setSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  window.addEventListener('resize', () => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })
  })
  return size
}
