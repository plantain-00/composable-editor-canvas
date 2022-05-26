import * as React from "react"

export function useHovering<T extends string | number | readonly [number, number]>() {
  const [hovering, setHovering] = React.useState<T>()

  const isHovering = (value: T) => {
    if (hovering === undefined) {
      return false
    }
    if (typeof hovering === 'number' || typeof hovering === 'string') {
      return hovering === value
    }
    if (typeof value === 'number' || typeof value === 'string') {
      if (hovering[0] === value) {
        return hovering[1]
      }
      return false
    }
    if (hovering[0] === value[0]) {
      if (hovering[1] === value[1]) {
        return true
      }
      return value[1]
    }
    return false
  }

  return {
    hovering,
    isHovering,
    setHovering,
  }
}
